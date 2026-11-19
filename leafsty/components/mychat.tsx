"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Channel, useChatContext } from "stream-chat-react";
import ServerList from "./ServerList";
import CustomChannelList from "./CustomChannelList";
import CustomMessage, { ReplyTarget } from "./MessageList/CustomMessage/CustomMessage";
import CustomMessageComposer from "./MessageList/MessageComposer/MessageComposer";
import UserContextMenu, { ContextTargetUser } from "./UserContextMenu";
import { useDiscordContext } from "../types/DiscordContext";
import {
  AtSign,
  Hash,
  Lock,
  Phone,
  Search,
  Users,
  Video,
  X,
} from "lucide-react";

export default function MyChat() {
  const { client } = useChatContext() as any;
  const discordCtx = useDiscordContext() as any;
  const activeChannel = discordCtx?.activeChannel || null;
  const activeServer =
    discordCtx?.activeServer ||
    discordCtx?.server ||
    discordCtx?.selectedServer ||
    null;

  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMembers, setShowMembers] = useState(true);
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [targetUserMenu, setTargetUserMenu] = useState<{
    user: ContextTargetUser;
    position: { x: number; y: number };
  } | null>(null);
  const [msgMenu, setMsgMenu] = useState<{
    x: number;
    y: number;
    msg: any;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = String(client?.user?.id || client?.userID || "");

  useEffect(() => {
    const closeMenus = () => setMsgMenu(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMsgMenu(null);
        setTargetUserMenu(null);
      }
    };
    window.addEventListener("click", closeMenus);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("click", closeMenus);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
  useEffect(() => {
    setReplyTo(null);
    setSearchQuery("");
    setMsgMenu(null);
    setTargetUserMenu(null);
    if (!activeChannel) {
      setLocalMessages([]);
      return;
    }

    let cancelled = false;

    const mergeMessages = (incoming: any[]) => {
      if (!Array.isArray(incoming) || incoming.length === 0) return;
      setLocalMessages((prev) => {
        const map = new Map<string, any>();
        for (const m of prev) {
          if (m?.id) map.set(String(m.id), m);
        }
        for (const m of incoming) {
          if (m?.id) map.set(String(m.id), m);
        }
        return Array.from(map.values()).sort((a, b) => {
          const ta = new Date(a?.created_at || a?.createdAt || 0).getTime();
          const tb = new Date(b?.created_at || b?.createdAt || 0).getTime();
          return ta - tb;
        });
      });
    };

    setLocalMessages([...(activeChannel?.state?.messages || [])]);

    (async () => {
      try {
        const res = await activeChannel.query?.({
          messages: { limit: 100 },
        });
        if (!cancelled) {
          const history =
            res?.messages || activeChannel?.state?.messages || [];
          mergeMessages(history);
        }
      } catch {
        try {
          await activeChannel.watch?.();
          if (!cancelled) {
            mergeMessages(activeChannel?.state?.messages || []);
          }
        } catch {}
      }
    })();

    const syncFromChannel = () => {
      mergeMessages(activeChannel?.state?.messages || []);
    };

    const handleDeleted = (e: any) => {
      const delId = e?.message?.id;
      if (delId) {
        setLocalMessages((prev) => prev.filter((m) => m.id !== delId));
      }
    };

    const handleSent = (e: any) => {
      const newMsg = e?.detail;
      if (!newMsg?.id) {
        syncFromChannel();
        return;
      }
      setLocalMessages((prev) => {
        const filtered = newMsg._replaceId
          ? prev.filter((m) => m.id !== newMsg._replaceId)
          : prev;
        return filtered.some((m) => m.id === newMsg.id)
          ? filtered
          : [...filtered, newMsg];
      });
    };

    activeChannel.on?.("message.new", syncFromChannel);
    activeChannel.on?.("message.updated", syncFromChannel);
    activeChannel.on?.("message.deleted", handleDeleted);
    window.addEventListener("leafsty:message-sent", handleSent);

    return () => {
      cancelled = true;
      activeChannel.off?.("message.new", syncFromChannel);
      activeChannel.off?.("message.updated", syncFromChannel);
      activeChannel.off?.("message.deleted", handleDeleted);
      window.removeEventListener("leafsty:message-sent", handleSent);
    };
  }, [activeChannel?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages.length, activeChannel?.id]);

  const handleOpenDmWithUser = async (target: ContextTargetUser) => {
    if (!client || !target?.id || target.id === currentUserId) return;
    const sorted = [currentUserId, target.id].sort();
    const dmId = `dm-${sorted.join("-")}`;
    const ch = client.channel("messaging", dmId, {
      members: sorted,
    } as any);
    await ch.watch({ state: true });
    discordCtx?.setActiveChannel?.(ch);
    window.dispatchEvent(new Event("leafsty:channels-updated"));
  };

  const handlePokeUser = async (target: ContextTargetUser) => {
    if (!activeChannel || !target?.name) return;
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channelType: activeChannel.type || "messaging",
        channelId: activeChannel.id,
        userId: currentUserId,
        text: `👋 poked @${target.name}!`,
      }),
    }).catch(() => {});
  };

  const channelTitle = useMemo(() => {
    if (!activeChannel) return "";
    if (activeChannel.data?.name) return activeChannel.data.name;
    const membersObj = activeChannel.state?.members || {};
    const other: any = Object.values(membersObj).find(
      (m: any) => String(m?.user?.id || m?.user_id) !== currentUserId
    );
    return (
      other?.user?.name ||
      other?.user_id ||
      activeChannel.id ||
      "Encrypted Chat"
    );
  }, [activeChannel, currentUserId]);

  const membersList = useMemo(() => {
    if (!activeChannel?.state?.members) return [];
    return Object.values(activeChannel.state.members);
  }, [activeChannel, localMessages.length]);

  const visibleMessages = useMemo(() => {
    const recent = localMessages.slice(-100);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recent;
    return recent.filter((m: any) =>
      String(m?.text || "").toLowerCase().includes(q)
    );
  }, [localMessages, searchQuery]);

  const isDm =
    !activeServer?.id &&
    !activeChannel?.data?.serverId &&
    !activeChannel?.data?.server;
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#071410] text-emerald-50">
      <ServerList />

      <CustomChannelList />

      <main className="flex-1 h-full flex flex-col bg-[#0a1d17] text-emerald-50 min-w-0">
        {!activeChannel ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0a1d17]">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center shadow-lg shadow-emerald-950/60 mb-4">
              L
            </div>
            <h1 className="text-xl font-extrabold text-emerald-50">
              Your Leafsty Space
            </h1>
            <p className="text-sm text-emerald-300/70 mt-1 max-w-sm">
              Pick a channel or DM from the sidebar to start chatting.
            </p>
          </div>
        ) : (
          <>
            <header className="h-14 px-4 border-b border-emerald-500/15 bg-[#081914] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {isDm ? (
                  <AtSign className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Hash className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <h2 className="text-sm font-extrabold text-emerald-50 truncate">
                  {channelTitle}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">
                  <Lock className="w-2.5 h-2.5" /> E2EE
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Voice Call"
                  className="p-2 rounded-lg text-emerald-300/75 hover:text-emerald-50 hover:bg-emerald-500/15 transition cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Video Call"
                  className="p-2 rounded-lg text-emerald-300/75 hover:text-emerald-50 hover:bg-emerald-500/15 transition cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowMembers((v) => !v)}
                  title="Toggle Members"
                  className={`p-2 rounded-lg transition cursor-pointer ${
                    showMembers
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "text-emerald-300/75 hover:text-emerald-50 hover:bg-emerald-500/15"
                  }`}
                >
                  <Users className="w-4 h-4" />
                </button>

                <div className="relative hidden md:block w-44">
                  <Search className="w-3.5 h-3.5 text-emerald-400/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-8 pr-6 py-1 rounded-lg bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/45 focus:outline-none focus:border-emerald-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-300/60 hover:text-emerald-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </header>

            <div className="flex-1 flex min-h-0">
              <div className="flex-1 flex flex-col min-w-0 h-full bg-[#0a1d17]">
                <Channel channel={activeChannel}>
                  <div className="flex-1 flex flex-col justify-between h-full min-h-0">
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                      <div className="pb-4 mb-4 border-b border-emerald-500/15">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 flex items-center justify-center mb-3">
                          {isDm ? (
                            <AtSign className="w-6 h-6" />
                          ) : (
                            <Hash className="w-6 h-6" />
                          )}
                        </div>
                        <h3 className="text-lg font-extrabold text-emerald-50">
                          {isDm
                            ? `Welcome to your DM with ${channelTitle}`
                            : `Welcome to #${channelTitle}!`}
                        </h3>
                        <p className="text-xs text-emerald-300/70 mt-1 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            {isDm
                              ? `This is the start of your end-to-end encrypted conversation with ${channelTitle}.`
                              : `This is the start of the #${channelTitle} encrypted channel.`}
                          </span>
                        </p>
                      </div>

                      {visibleMessages.map((msg: any) => (
                        <div
                          key={msg.id}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setTargetUserMenu(null);
                            setMsgMenu({
                              x: Math.min(e.clientX, window.innerWidth - 200),
                              y: Math.min(e.clientY, window.innerHeight - 160),
                              msg,
                            });
                          }}
                        >
                                                   <CustomMessage
                            message={msg}
                            onReply={setReplyTo}
                            onSelectUser={(u) => {
                              setMsgMenu(null);
                              setTargetUserMenu({
                                user: {
                                  id: String(u?.id || ""),
                                  name: u?.name || String(u?.id || "User"),
                                  image: u?.image,
                                },
                                position: { x: 260, y: 220 },
                              });
                            }}
                          />
                        </div>
                      ))}
                      <div ref={bottomRef} />
                    </div>

                    <CustomMessageComposer
                      replyTarget={replyTo}
                      onCancelReply={() => setReplyTo(null)}
                    />
                  </div>
                </Channel>
              </div>
              {showMembers && (
                <aside className="w-60 h-full border-l border-emerald-500/15 bg-[#081914] p-3 overflow-y-auto shrink-0 hidden lg:block">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/70 mb-3 px-1">
                    Room Members — {membersList.length}
                  </div>
                  <div className="space-y-1.5">
                    {membersList.map((member: any, idx: number) => {
                      const mUser = member?.user || {};
                      const mId = String(mUser.id || member?.user_id || "");
                      const mName = mUser.name || member?.user_id || "Member";
                      const mImg = mUser.image || "";

                      return (
                        <div
                          key={mId || idx}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setMsgMenu(null);
                            setTargetUserMenu({
                              user: {
                                id: mId,
                                name: mName,
                                image: mImg,
                              },
                              position: {
                                x: e.clientX,
                                y: e.clientY,
                              },
                            });
                          }}
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-emerald-500/10 transition cursor-context-menu"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center overflow-hidden shrink-0">
                            {mImg ? (
                              <img
                                src={mImg}
                                alt={mName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              mName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-emerald-50 truncate">
                              {mName}
                            </div>
                            <div className="text-[10px] text-emerald-400/75 truncate">
                              E2EE verified
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </aside>
              )}
            </div>
          </>
        )}
      </main>

      <UserContextMenu
        user={targetUserMenu?.user || null}
        position={targetUserMenu?.position || null}
        onClose={() => setTargetUserMenu(null)}
        onMessage={handleOpenDmWithUser}
        onPoke={handlePokeUser}
      />

      {msgMenu && (
        <div
          style={{ top: msgMenu.y, left: msgMenu.x }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-48 rounded-xl bg-[#061410] border border-emerald-500/30 shadow-2xl py-1.5 text-xs text-emerald-50 select-none"
        >
          <button
            type="button"
            onClick={() => {
              setReplyTo({
                id: msgMenu.msg.id,
                text: msgMenu.msg.text || "",
                userName:
                  msgMenu.msg.user?.name ||
                  msgMenu.msg.user?.id ||
                  "User",
              });
              setMsgMenu(null);
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-emerald-500/20 cursor-pointer"
          >
            Reply
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(String(msgMenu.msg.text || ""));
              setMsgMenu(null);
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-emerald-500/20 cursor-pointer"
          >
            Copy Message Text
          </button>
          <button
            type="button"
            onClick={() => {
              const u = msgMenu.msg.user || {};
              setTargetUserMenu({
                user: {
                  id: String(u.id || ""),
                  name: u.name || String(u.id || "User"),
                  image: u.image,
                },
                position: { x: msgMenu.x, y: msgMenu.y },
              });
              setMsgMenu(null);
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-emerald-500/20 text-emerald-300 cursor-pointer"
          >
            User Options
          </button>
          {String(msgMenu.msg.user?.id) === currentUserId && (
            <button
              type="button"
              onClick={async () => {
                const msgId = msgMenu.msg.id;
                setMsgMenu(null);
                setLocalMessages((prev) =>
                  prev.filter((m) => m.id !== msgId)
                );
                try {
                  await (client as any)?.deleteMessage?.(msgId);
                } catch {}
              }}
              className="w-full px-3 py-1.5 text-left text-red-300 hover:bg-red-500/20 cursor-pointer"
            >
              Delete Message
            </button>
          )}
        </div>
      )}
    </div>
  );
}
