"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../types/DiscordContext";
import FriendsModal from "./FriendsModal";
import {
  LeafstyPresence,
  LeafstyStatusDot,
  LeafstyStatusPicker,
  PRESENCE_META,
  getStoredPresence,
  setStoredPresence,
} from "./LeafstyStatusBadge";
import {
  Hash,
  Plus,
  Search,
  Lock,
  X,
  MessageSquare,
  UserPlus,
  Check,
  Inbox,
  Settings,
  Users,
} from "lucide-react";

export default function CustomChannelList() {
  const { client } = useChatContext();
  const discordCtx = useDiscordContext() as any;
  const activeServer =
    discordCtx?.activeServer ||
    discordCtx?.server ||
    discordCtx?.selectedServer ||
    null;
    const activeChannel = discordCtx?.activeChannel || null;
  const setActiveChannel = discordCtx?.setActiveChannel;

  const [channels, setChannels] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
const [presence, setPresence] = useState<LeafstyPresence>("online");
const [showStatusPicker, setShowStatusPicker] = useState(false);
const [showFriends, setShowFriends] = useState(false);
const [pendingFriendsCount, setPendingFriendsCount] = useState(0);

  const [showNewDm, setShowNewDm] = useState(false);
  const [dmTarget, setDmTarget] = useState("");
  const [creatingDm, setCreatingDm] = useState(false);
  const [dmError, setDmError] = useState<string | null>(null);
  const [knownUsers, setKnownUsers] = useState<any[]>([]);
  const [acceptedIds, setAcceptedIds] = useState<Record<string, boolean>>({});
  const [declinedIds, setDeclinedIds] = useState<Record<string, boolean>>({});

  const currentUserId = String(client?.userID || (client?.user as any)?.id || "");
  const currentUserName =
    (client?.user as any)?.name || currentUserId || "LeafyUser";
  const currentUserImage = (client?.user as any)?.image || "";

  useEffect(() => {
    try {
      const savedAcc = JSON.parse(localStorage.getItem("leafsty_accepted_dms") || "{}");
      const savedDec = JSON.parse(localStorage.getItem("leafsty_declined_dms") || "{}");
      setAcceptedIds(savedAcc);
      setDeclinedIds(savedDec);
    } catch {}
  }, []);

    useEffect(() => {
    const saved = getStoredPresence();
    setPresence(saved);
    if (currentUserId) {
      setStoredPresence(saved, currentUserId, true);
    }

    const onStatus = (e: any) => {
      if (e?.detail) setPresence(e.detail);
    };
    window.addEventListener("leafsty:status-changed", onStatus);

    const markOfflineOnClose = () => {
      if (!currentUserId) return;
      const payload = JSON.stringify({
        userId: currentUserId,
        status: "offline",
      });
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/status", blob);
      } else {
        setStoredPresence("offline", currentUserId, false);
      }
    };

    window.addEventListener("pagehide", markOfflineOnClose);
    window.addEventListener("beforeunload", markOfflineOnClose);

    return () => {
      window.removeEventListener("leafsty:status-changed", onStatus);
      window.removeEventListener("pagehide", markOfflineOnClose);
      window.removeEventListener("beforeunload", markOfflineOnClose);
    };
  }, [currentUserId]);


  useEffect(() => {
    if (!client || !currentUserId) return;
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const loadChannels = async (silent = false) => {
      try {
        if (!silent) setLoading(true);

        const [apiRes, streamChannels] = await Promise.all([
          fetch("/api/channel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "list",
              userId: currentUserId,
              serverId: activeServer?.id || activeServer?.name || null,
            }),
          })
            .then((r) => r.json())
            .catch(() => ({ channels: [] })),
          (client as any)
            .queryChannels({
              filter_conditions: {
                type: "messaging",
                members: { $in: [currentUserId] },
              },
              sort: [{ field: "last_message_at", direction: -1 }],
              watch: true,
              state: true,
              limit: 40,
            })
            .catch(() => ({ channels: [] })),
        ]);

        const seenIds = new Set<string>();
        const hydrated: any[] = [];

        const fetchedChannels = Array.isArray(streamChannels)
          ? streamChannels
          : Array.isArray(streamChannels?.channels)
          ? streamChannels.channels
          : [];

        for (const item of fetchedChannels) {
          const ch = item?.channel
            ? client.channel(item.channel.type || "messaging", item.channel.id)
            : item;
          if (item?.channel && ch) {
            ch.data = { ...ch.data, ...item.channel };
          }
          if (ch?.id && !seenIds.has(ch.id)) {
            seenIds.add(ch.id);
            hydrated.push(ch);
          }
        }

        const rawList = Array.isArray(apiRes?.channels) ? apiRes.channels : [];
        for (const item of rawList) {
          const cid = String(item.id || item.channel?.id || "");
          if (!cid || seenIds.has(cid)) continue;
          seenIds.add(cid);

          const ctype = item.type || item.channel?.type || "messaging";
          const ch = client.channel(ctype, cid);
          if (item.channel) {
            ch.data = { ...ch.data, ...item.channel };
          }
          if (item.members && ch.state) {
            ch.state.members = item.members;
          }
          hydrated.push(ch);
        }

        if (!cancelled) {
          setChannels(hydrated);
        }
      } catch (err) {
        console.error("Failed to load channels:", err);
      } finally {
        if (!cancelled && !silent) setLoading(false);
      }
    };

    loadChannels(false);

    const scheduleSilentRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        if (!cancelled) loadChannels(true);
      }, 600);
    };

    const handleManualRefresh = () => loadChannels(true);

    client.on?.("notification.added_to_channel", scheduleSilentRefresh);
    client.on?.("notification.message_new", scheduleSilentRefresh);
    client.on?.("channel.visible", scheduleSilentRefresh);
        const handleUserPresence = () => {
      setChannels((prev) => [...prev]);
    };
    client.on?.("user.updated", handleUserPresence);
    client.on?.("user.presence.changed", handleUserPresence);
      client.off?.("user.updated", handleUserPresence);
      client.off?.("user.presence.changed", handleUserPresence);

    window.addEventListener("leafsty:channels-updated", handleManualRefresh);

    const pollInterval = setInterval(() => {
      if (!cancelled) loadChannels(true);
    }, 15000);

    return () => {
      cancelled = true;
      if (refreshTimer) clearTimeout(refreshTimer);
      clearInterval(pollInterval);
      client.off?.("notification.added_to_channel", scheduleSilentRefresh);
      client.off?.("notification.message_new", scheduleSilentRefresh);
            client.off?.("user.updated", handleUserPresence);
      client.off?.("user.presence.changed", handleUserPresence);
      client.off?.("channel.visible", scheduleSilentRefresh);
      window.removeEventListener("leafsty:channels-updated", handleManualRefresh);
    };
  }, [client, currentUserId, activeServer?.id, activeServer?.name]);

  const handleCreateServerChannel = async () => {
    const srvName = String(activeServer?.name || activeServer?.id || "").trim();
    if (!srvName || !client) return;
    const rawName = window.prompt("New text channel name (e.g. memes, clips):");
    const cleanName = String(rawName || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-");
    if (!cleanName) return;

    const slugSrv = srvName.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    const channelId = `${slugSrv}-${cleanName}-${Date.now().toString(36).slice(-4)}`;

    const newCh = client.channel("messaging", channelId, {
      name: cleanName,
      server: srvName,
      serverId: srvName,
      members: [currentUserId],
    } as any);
    await newCh.watch({ state: true });

    await fetch("/api/channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        type: "messaging",
        channelType: "messaging",
        id: channelId,
        channelId,
        name: cleanName,
        serverId: srvName,
        userId: currentUserId,
        members: [currentUserId],
      }),
    }).catch(() => {});

    setChannels((prev) => [newCh, ...prev]);
    setActiveChannel?.(newCh);
    window.dispatchEvent(new Event("leafsty:server-updated"));
  };

  const openNewDmModal = async () => {
    setDmTarget("");
    setDmError(null);
    setShowNewDm(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data?.users) ? data.users : [];
        setKnownUsers(
          list.filter((u: any) => String(u.id) !== currentUserId)
        );
      }
    } catch {}
  };

  const handleCreateDm = async (targetUsername?: string) => {
    const raw = (targetUsername ?? dmTarget)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
    if (!raw || !client) {
      setDmError("Enter a valid username.");
      return;
    }
    if (raw === currentUserId) {
      setDmError("You cannot start a DM with yourself.");
      return;
    }

    try {
      setCreatingDm(true);
      setDmError(null);

      const sortedIds = [currentUserId, raw].sort();
      const dmId = `dm-${sortedIds.join("-")}`;

      const liveChannel = client.channel("messaging", dmId, {
        members: sortedIds,
        invite_status: "pending",
        invited_by: currentUserId,
      } as any);
      await liveChannel.watch({ state: true, presence: true });

      await fetch("/api/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          type: "messaging",
          channelType: "messaging",
          id: dmId,
          channelId: dmId,
          userId: currentUserId,
          targetUserId: raw,
          members: sortedIds,
        }),
      }).catch(() => {});

      const nextAccepted = { ...acceptedIds, [dmId]: true };
      setAcceptedIds(nextAccepted);
      localStorage.setItem("leafsty_accepted_dms", JSON.stringify(nextAccepted));

      setShowNewDm(false);
      setDmTarget("");
      setChannels((prev) =>
        prev.some((c) => c.id === dmId) ? prev : [liveChannel, ...prev]
      );
      setActiveChannel?.(liveChannel);
      window.dispatchEvent(new Event("leafsty:channels-updated"));
    } catch (err: any) {
      setDmError(err?.message || "User not found or could not send DM invite");
    } finally {
      setCreatingDm(false);
    }
  };

  const handleAcceptInvite = async (ch: any) => {
    if (!ch?.id) return;
    const nextAccepted = { ...acceptedIds, [ch.id]: true };
    setAcceptedIds(nextAccepted);
    localStorage.setItem("leafsty_accepted_dms", JSON.stringify(nextAccepted));
    if (ch.data) ch.data.invite_status = "accepted";

    await fetch("/api/channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "accept",
        channelType: ch.type || "messaging",
        channelId: ch.id,
        userId: currentUserId,
      }),
    }).catch(() => {});

    await handleSelectChannel(ch);
  };
  const handleDeclineInvite = async (ch: any) => {
    if (!ch?.id) return;
    const nextDeclined = { ...declinedIds, [ch.id]: true };
    setDeclinedIds(nextDeclined);
    localStorage.setItem("leafsty_declined_dms", JSON.stringify(nextDeclined));

    try {
      await ch.hide?.();
    } catch {}
    if (activeChannel?.id === ch.id) {
      setActiveChannel?.(null);
    }
    setChannels((prev) => prev.filter((c) => c.id !== ch.id));
  };

  const handleSelectChannel = async (ch: any) => {
    if (!client || !ch) return;
    try {
      const liveChannel = client.channel(ch.type || "messaging", ch.id);
      await liveChannel.watch({ state: true, presence: true });
      await liveChannel.markRead?.();
      setActiveChannel?.(liveChannel);
    } catch (error) {
      console.error("Failed to open channel:", error);
      setActiveChannel?.(ch);
    }
  };

  const getOtherMemberId = (ch: any) => {
    const membersObj = ch?.state?.members || {};
    const otherMember: any = Object.values(membersObj).find(
      (m: any) => String(m?.user?.id || m?.user_id) !== currentUserId
    );
    return String(otherMember?.user?.id || otherMember?.user_id || "");
  };

  const getChannelDisplayName = (ch: any) => {
    if (ch?.data?.name) return ch.data.name;
    const membersObj = ch?.state?.members || {};
    const otherMember: any = Object.values(membersObj).find(
      (m: any) => String(m?.user?.id || m?.user_id) !== currentUserId
    );
    if (otherMember?.user?.name) return otherMember.user.name;
    if (otherMember?.user_id) return otherMember.user_id;
    return ch?.id || "Encrypted DM";
  };

  const { activeList, incomingInvites } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const seenDmPeers = new Set<string>();
    const active: any[] = [];
    const invites: any[] = [];
    const activeSrvKey = String(activeServer?.id || activeServer?.name || "").trim();

    for (const ch of channels) {
      if (declinedIds[ch.id]) continue;

      const chServerKey = String(
        ch?.data?.server ||
          ch?.data?.custom?.server ||
          ch?.data?.serverId ||
          ch?.data?.server_id ||
          ""
      ).trim();
      const isServerCh =
        Boolean(chServerKey) ||
        ch?.type === "team" ||
        String(ch?.id || "").startsWith("general-");

      if (activeSrvKey) {
        const matchesServer =
          chServerKey.toLowerCase() === activeSrvKey.toLowerCase() ||
          String(ch?.id || "")
            .toLowerCase()
            .includes(activeSrvKey.toLowerCase().replace(/\s+/g, "-"));
        if (!matchesServer) continue;
        if (!q || getChannelDisplayName(ch).toLowerCase().includes(q)) {
          active.push(ch);
        }
        continue;
      }

      if (isServerCh) continue;

      const peerId = getOtherMemberId(ch);
      if (peerId) {
        if (seenDmPeers.has(peerId)) continue;
        seenDmPeers.add(peerId);
      }

      if (q && !getChannelDisplayName(ch).toLowerCase().includes(q)) continue;

      const inviter = String(ch?.data?.invited_by || ch?.data?.created_by?.id || "");
      const status = String(ch?.data?.invite_status || "");
      const hasMyMessages = (ch?.state?.messages || []).some(
        (m: any) => String(m?.user?.id) === currentUserId
      );
      const isAlreadyAccepted =
        Boolean(acceptedIds[ch.id]) ||
        Boolean(acceptedIds[ch.cid]) ||
        status === "accepted" ||
        hasMyMessages;

      const isIncomingPending =
        !isAlreadyAccepted &&
        status === "pending" &&
        Boolean(inviter) &&
        inviter !== currentUserId;

      if (isIncomingPending) {
        invites.push(ch);
      } else {
        active.push(ch);
      }
    }

    return { activeList: active, incomingInvites: invites };
  }, [channels, activeServer?.id, activeServer?.name, searchQuery, currentUserId, acceptedIds, declinedIds]);
  const isServerView = Boolean(activeServer?.id || activeServer?.name);

  return (
    <>
      <aside className="w-64 h-full flex flex-col bg-[#081914] border-r border-emerald-500/15 text-emerald-50 select-none shrink-0">
                <div className="p-3 border-b border-emerald-500/15 bg-[#061410]">
          {isServerView ? (
            <div className="flex items-center justify-between px-1 py-1">
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-emerald-50 truncate">
                  {activeServer?.name || "Leafsty Space"}
                </h2>
                <p className="text-[11px] text-emerald-400/70 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Encrypted Space
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-emerald-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find or start a conversation"
                className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/45 focus:outline-none focus:border-emerald-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-300/60 hover:text-emerald-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {!isServerView && incomingInvites.length > 0 && (
          <div className="px-2 pt-3 pb-2 border-b border-emerald-500/15 bg-[#061510]">
            <div className="px-2 pb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-amber-300 flex items-center gap-1">
                <Inbox className="w-3 h-3" /> Message Requests
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 font-extrabold text-[10px]">
                {incomingInvites.length}
              </span>
            </div>

            <div className="space-y-1.5">
              {incomingInvites.map((inv) => {
                const label = getChannelDisplayName(inv);
                return (
                  <div
                    key={inv.id}
                    className="p-2 rounded-xl bg-[#0d261e] border border-amber-400/25 flex items-center justify-between gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectChannel(inv)}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-full bg-amber-500/25 text-amber-200 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {label.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-emerald-50 truncate">
                          {label}
                        </div>
                        <div className="text-[10px] text-amber-300/80 truncate">
                          DM Invite
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAcceptInvite(inv)}
                        title="Accept DM Request"
                        className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeclineInvite(inv)}
                        title="Decline DM Request"
                        className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/35 text-red-300 transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-3.5 pt-3 pb-1.5 flex items-center justify-between">
             {!isServerView && (
       <div className="px-2 pt-2.5">
         <button
           type="button"
           onClick={() => setShowFriends(true)}
           className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#0d261e]/80 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-extrabold text-emerald-100 transition cursor-pointer"
         >
           <span className="flex items-center gap-2">
             <Users className="w-4 h-4 text-emerald-400" />
             <span>Friends</span>
           </span>
           {pendingFriendsCount > 0 && (
             <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-zinc-950 font-extrabold text-[10px]">
               {pendingFriendsCount}
             </span>
           )}
         </button>
       </div>
     )}
          <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-300/70">
            {isServerView ? "Text Channels" : "Direct Messages"}
          </span>
          <button
            type="button"
            onClick={isServerView ? handleCreateServerChannel : openNewDmModal}
            title={isServerView ? "Create Text Channel" : "Send DM Invite"}
            className="p-1 rounded-md text-emerald-300/80 hover:text-emerald-50 hover:bg-emerald-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

                <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {loading && activeList.length === 0 ? (
            <div className="px-3 py-4 text-xs text-emerald-300/50">
              Loading conversations...
            </div>
          ) : activeList.length === 0 ? (
            <div className="px-3 py-6 text-center rounded-xl bg-[#0b211a] border border-emerald-500/15 mx-1 mt-2">
              <MessageSquare className="w-5 h-5 text-emerald-400/60 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-emerald-100">
                {isServerView ? "No channels yet" : "No DMs yet"}
              </p>
              <button
                type="button"
                onClick={
                  isServerView ? handleCreateServerChannel : openNewDmModal
                }
                className="mt-2.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
              >
                {isServerView ? "+ Create Text Channel" : "+ Send DM Invite"}
              </button>
            </div>
          ) : (
            activeList.map((ch) => {
              const label = getChannelDisplayName(ch);
              const isSelected = activeChannel?.id === ch.id;
              const unreadCount = ch.countUnread?.() || 0;
              const isPendingOutgoing =
                !isServerView &&
                String(ch?.data?.invite_status || "") === "pending" &&
                String(ch?.data?.invited_by || "") === currentUserId;
                           const otherMember: any = Object.values(
                ch?.state?.members || {}
              ).find(
                (m: any) =>
                  String(m?.user?.id || m?.user_id) !== currentUserId
              );
              const peerUser = otherMember?.user;
              const peerPresence = peerUser?.invisible
                ? "offline"
                : peerUser?.presence_status ||
                  (peerUser?.online ? "online" : "offline");

              return (
                <button
                  key={ch.id}
                  type="button"
                  data-leafsty-channel={isServerView ? ch.id : undefined}
                  data-leafsty-dm={!isServerView ? ch.id : undefined}
                  data-leafsty-label={label}
                  onClick={() => handleSelectChannel(ch)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500/20 text-emerald-50 border border-emerald-400/30 shadow-sm"
                      : "text-emerald-100/85 hover:bg-emerald-500/10 hover:text-emerald-50 border border-transparent"
                  }`}
                >
                  {isServerView ? (
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0">
                      <Hash className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="relative w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                      <span className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                        {peerUser?.image ? (
                          <img
                            src={peerUser.image}
                            alt={label}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          label.charAt(0).toUpperCase()
                        )}
                      </span>
                      <span className="absolute -bottom-0.5 -right-0.5">
                        <LeafstyStatusDot
                          status={peerPresence}
                          size="xs"
                          ringColor="#081914"
                        />
                      </span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-emerald-50 truncate">
                      {label}
                    </div>
                    <div className="text-[10px] text-emerald-300/65 truncate flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-emerald-400/80 shrink-0" />
                      <span>
                        {isServerView
                          ? "Encrypted channel"
                          : isPendingOutgoing
                          ? "Invite sent · Pending"
                          : "Encrypted DM"}
                      </span>
                    </div>
                  </div>

                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-[#04120e] font-extrabold text-[10px]">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
             <div className="relative p-2.5 bg-[#04120e] border-t border-emerald-500/15 flex items-center justify-between gap-2">
       {showStatusPicker && (
         <div className="absolute bottom-full left-2.5 mb-2 z-50">
           <LeafstyStatusPicker
             current={presence}
                            onSelect={async (next) => {
                  setPresence(next);
                  await setStoredPresence(next, currentUserId);
                }}
             onClose={() => setShowStatusPicker(false)}
           />
         </div>
       )}

       <div className="flex items-center gap-2.5 min-w-0 flex-1 rounded-xl p-1 hover:bg-emerald-500/10 transition">
         <button
           type="button"
           onClick={() => setShowStatusPicker((v) => !v)}
           title="Change Status (Online, Idle, Do Not Disturb, Invisible)"
           className="relative w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 cursor-pointer"
         >
           <span className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
             {currentUserImage ? (
               <img
                 src={currentUserImage}
                 alt={currentUserName}
                 className="w-full h-full object-cover"
               />
             ) : (
               currentUserName.charAt(0).toUpperCase()
             )}
           </span>
           <span className="absolute -bottom-0.5 -right-0.5">
             <LeafstyStatusDot status={presence} size="sm" ringColor="#04120e" />
           </span>
         </button>

         <button
           type="button"
           onClick={() =>
             window.dispatchEvent(new Event("leafsty:open-own-profile"))
           }
           title="View Your Profile Card"
           className="min-w-0 flex-1 text-left cursor-pointer"
         >
           <div className="text-xs font-extrabold text-emerald-50 truncate">
             {currentUserName}
           </div>
           <div className="text-[10px] text-emerald-400/90 truncate">
             {PRESENCE_META[presence].label}
           </div>
         </button>
       </div>

       <button
         type="button"
         onClick={() =>
           window.dispatchEvent(new Event("leafsty:open-settings"))
         }
         title="User Settings"
         className="p-2 rounded-xl text-emerald-300/75 hover:text-emerald-50 hover:bg-emerald-500/15 transition cursor-pointer shrink-0"
       >
         <Settings className="w-4 h-4" />
       </button>
     </div>
      </aside>

      {showNewDm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#081914] border border-emerald-500/25 p-5 text-emerald-50 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-extrabold">Send DM Invite</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewDm(false)}
                className="p-1 rounded-lg text-emerald-300/70 hover:text-emerald-50 hover:bg-emerald-500/15 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateDm();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300/75 mb-1">
                  Enter Username
                </label>
                <input
                  type="text"
                  value={dmTarget}
                  onChange={(e) => setDmTarget(e.target.value)}
                  placeholder="e.g. testuser"
                  autoFocus
                  className="w-full px-3 py-2 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                />
              </div>

              {dmError && (
                <div className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300">
                  {dmError}
                </div>
              )}

              <button
                type="submit"
                disabled={creatingDm || !dmTarget.trim()}
                className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 text-white font-extrabold text-xs transition cursor-pointer"
              >
                {creatingDm ? "Sending DM invite..." : "Send DM Invite"}
              </button>
            </form>

            {knownUsers.length > 0 && (
              <div className="mt-4 pt-3 border-t border-emerald-500/15">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/60 mb-2">
                  People on Leafsty
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {knownUsers.map((u: any) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleCreateDm(u.id)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-emerald-500/15 text-left transition cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-extrabold text-[11px] flex items-center justify-center">
                        {(u.name || u.id).charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-emerald-100 truncate">
                        {u.name || u.id}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
         {showFriends && (
     <FriendsModal
       currentUserId={currentUserId}
       onClose={() => setShowFriends(false)}
       onPendingCountChange={setPendingFriendsCount}
       onOpenDmWithUser={async (targetUserId) => {
         await handleCreateDm(targetUserId);
       }}
     />
   )}
    </>
  );
}
