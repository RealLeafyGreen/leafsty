"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  MessageSquare,
  Check,
  X,
  UserMinus,
  Loader2,
} from "lucide-react";
import { LeafstyStatusDot, PRESENCE_META } from "./LeafstyStatusBadge";

interface FriendProfile {
  id: string;
  name: string;
  image?: string;
  online?: boolean;
  presence?: string;
}

interface FriendsModalProps {
  currentUserId: string;
  onClose: () => void;
  onOpenDmWithUser: (targetUserId: string) => Promise<void> | void;
  onPendingCountChange?: (count: number) => void;
}

export default function FriendsModal({
  currentUserId,
  onClose,
  onOpenDmWithUser,
  onPendingCountChange,
}: FriendsModalProps) {
  const [tab, setTab] = useState<"online" | "all" | "pending" | "add">("online");
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [incoming, setIncoming] = useState<FriendProfile[]>([]);
  const [outgoing, setOutgoing] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [addInput, setAddInput] = useState("");
  const [addStatus, setAddStatus] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);
  const [sendingReq, setSendingReq] = useState(false);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", userId: currentUserId }),
      });
      const data = await res.json().catch(() => ({}));
      const isActiveUser = (u: any) =>
        Boolean(u?.id) && !String(u.id).startsWith("deleted-user-");

      const inc = (Array.isArray(data?.incoming) ? data.incoming : []).filter(
        isActiveUser
      );
      setFriends(
        (Array.isArray(data?.friends) ? data.friends : []).filter(isActiveUser)
      );
      setIncoming(inc);
      setOutgoing(
        (Array.isArray(data?.outgoing) ? data.outgoing : []).filter(
          isActiveUser
        )
      );
      onPendingCountChange?.(inc.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) loadFriends();
  }, [currentUserId]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = addInput.trim().toLowerCase().replace(/^@/, "");
    if (!target || sendingReq) return;
    setSendingReq(true);
    setAddStatus(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          userId: currentUserId,
          targetId: target,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddStatus({
          ok: false,
          msg: data?.error || "Could not send friend request.",
        });
      } else {
        setAddInput("");
        setAddStatus({
          ok: true,
          msg: data?.autoAccepted
            ? `You and @${target} are now friends!`
            : `Friend request sent to @${target}!`,
        });
        await loadFriends();
      }
    } finally {
      setSendingReq(false);
    }
  };

  const handleAction = async (
    action: "accept" | "decline" | "remove",
    targetId: string
  ) => {
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId: currentUserId, targetId }),
    }).catch(() => {});
    await loadFriends();
  };

  const onlineFriends = friends.filter(
    (f) => f.presence && f.presence !== "offline"
  );
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg max-h-[82vh] flex flex-col rounded-2xl bg-[#081914] border border-emerald-500/30 text-emerald-50 shadow-2xl overflow-hidden">
        <div className="px-4 py-3 bg-[#061410] border-b border-emerald-500/15 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-extrabold tracking-wide text-emerald-100">
              Friends
            </span>
          </div>

          <div className="flex items-center gap-1">
            {(
              [
                { id: "online", label: `Online (${onlineFriends.length})` },
                { id: "all", label: `All (${friends.length})` },
                {
                  id: "pending",
                  label: `Pending${incoming.length ? ` (${incoming.length})` : ""}`,
                },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  tab === t.id
                    ? "bg-emerald-500/25 text-white"
                    : "text-emerald-300/75 hover:bg-emerald-500/15"
                }`}
              >
                {t.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setTab("add");
                setAddStatus(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                tab === "add"
                  ? "bg-emerald-500 text-[#04120e]"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              Add Friend
            </button>

            <button
              type="button"
              onClick={onClose}
              className="ml-1 p-1 rounded-lg text-emerald-300/70 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "add" ? (
            <form onSubmit={handleSendRequest} className="space-y-3">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                  Add Friend
                </h3>
                <p className="text-[11px] text-emerald-300/70 mt-0.5">
                  You can add friends with their Leafsty username.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={addInput}
                  onChange={(e) => setAddInput(e.target.value)}
                  placeholder="Enter a Leafsty username (e.g. jomkos)"
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="submit"
                  disabled={!addInput.trim() || sendingReq}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 text-white font-extrabold text-xs transition cursor-pointer shrink-0"
                >
                  {sendingReq ? "Sending..." : "Send Request"}
                </button>
              </div>

              {addStatus && (
                <div
                  className={`px-3 py-2 rounded-xl border text-xs font-medium ${
                    addStatus.ok
                      ? "bg-emerald-500/15 border-emerald-400/35 text-emerald-200"
                      : "bg-red-500/15 border-red-400/35 text-red-300"
                  }`}
                >
                  {addStatus.msg}
                </div>
              )}
            </form>
          ) : loading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-xs text-emerald-300/70">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Loading friends...</span>
            </div>
          ) : tab === "pending" ? (
            <div className="space-y-4">
              {incoming.length === 0 && outgoing.length === 0 ? (
                <p className="py-10 text-center text-xs text-emerald-300/60">
                  No pending friend requests right now.
                </p>
              ) : (
                <>
                  {incoming.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                        Incoming Requests — {incoming.length}
                      </div>
                      {incoming.map((u) => (
                        <div
                          key={u.id}
                          className="p-2.5 rounded-xl bg-[#0b211a] border border-emerald-500/20 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate">
                                {u.name}
                              </div>
                              <div className="text-[10px] text-emerald-300/65">
                                Incoming Friend Request
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAction("accept", u.id)}
                              title="Accept"
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction("decline", u.id)}
                              title="Ignore"
                              className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/35 text-red-300 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {outgoing.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300/70">
                        Outgoing Requests — {outgoing.length}
                      </div>
                      {outgoing.map((u) => (
                        <div
                          key={u.id}
                          className="p-2.5 rounded-xl bg-[#0b211a] border border-emerald-500/15 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#12362a] text-emerald-200 font-extrabold text-xs flex items-center justify-center shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate">
                                {u.name}
                              </div>
                              <div className="text-[10px] text-emerald-300/60">
                                Outgoing Friend Request
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAction("decline", u.id)}
                            title="Cancel Request"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/25 text-zinc-300 hover:text-red-300 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {(tab === "online" ? onlineFriends : friends).length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <p className="text-xs text-emerald-300/65">
                    {tab === "online"
                      ? "No friends are online right now."
                      : "You haven't added any friends yet."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("add")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add a Friend</span>
                  </button>
                </div>
              ) : (
                (tab === "online" ? onlineFriends : friends).map((f) => {
                  const statusKey = (
                    f.presence === "idle" ||
                    f.presence === "dnd" ||
                    f.presence === "online"
                      ? f.presence
                      : "offline"
                  ) as keyof typeof PRESENCE_META;
                  return (
                    <div
                      key={f.id}
                      className="p-2.5 rounded-xl bg-[#0b211a] border border-emerald-500/20 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-9 h-9 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                          <span className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                            {f.image ? (
                              <img
                                src={f.image}
                                alt={f.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              f.name.charAt(0).toUpperCase()
                            )}
                          </span>
                          <span className="absolute -bottom-0.5 -right-0.5">
                            <LeafstyStatusDot
                              status={statusKey}
                              size="xs"
                              ringColor="#0b211a"
                            />
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-emerald-50 truncate">
                            {f.name}
                          </div>
                          <div className="text-[10px] text-emerald-300/70">
                            {statusKey === "offline"
                              ? "Offline"
                              : PRESENCE_META[statusKey].label}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            onClose();
                            await onOpenDmWithUser(f.id);
                          }}
                          title="Message Friend"
                          className="p-2 rounded-xl bg-emerald-600/25 hover:bg-emerald-600 text-emerald-200 hover:text-white transition cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction("remove", f.id)}
                          title="Remove Friend"
                          className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/30 text-red-300 transition cursor-pointer"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
