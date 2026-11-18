"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../types/DiscordContext";
import {
  Hash,
  Search,
  Lock,
  X,
  MessageSquare,
} from "lucide-react";

export default function CustomChannelList() {
  const { client } = useChatContext();
  const discordCtx = useDiscordContext() as any;
  const activeServer = discordCtx?.activeServer || discordCtx?.server || null;
  const activeChannel = discordCtx?.activeChannel || null;
  const setActiveChannel = discordCtx?.setActiveChannel;

  const [channels, setChannels] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const currentUserId = String(client?.userID || (client?.user as any)?.id || "");
  const currentUserName =
    (client?.user as any)?.name || currentUserId || "LeafyUser";
  const currentUserImage = (client?.user as any)?.image || "";

  useEffect(() => {
    if (!client || !currentUserId) return;
    let cancelled = false;

    const loadChannels = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/channel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "list",
            userId: currentUserId,
            serverId: activeServer?.id || null,
          }),
        });
        const data = await res.json().catch(() => ({}));
        const rawList = Array.isArray(data?.channels) ? data.channels : [];

        const seenIds = new Set<string>();
        const hydrated: any[] = [];

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
        if (!cancelled) setLoading(false);
      }
    };

    loadChannels();

    const handleManualRefresh = () => {
      loadChannels();
    };

    window.addEventListener("leafsty:channels-updated", handleManualRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener("leafsty:channels-updated", handleManualRefresh);
    };
  }, [client, currentUserId, activeServer?.id]);
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

  const filteredChannels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const seenDmPeers = new Set<string>();

    return channels.filter((ch) => {
      const chServerId =
        ch?.data?.serverId || ch?.data?.server_id || ch?.data?.server;
      const isServerCh =
        Boolean(chServerId) ||
        ch?.type === "team" ||
        String(ch?.id || "").startsWith("general-");

      if (activeServer?.id) {
        const matchesServer =
          String(chServerId || "") === String(activeServer.id) ||
          String(ch?.id || "").includes(String(activeServer.id));
        if (!matchesServer) return false;
      } else {
        if (isServerCh) return false;
        const peerId = getOtherMemberId(ch);
        if (peerId) {
          if (seenDmPeers.has(peerId)) return false;
          seenDmPeers.add(peerId);
        }
      }

      if (!q) return true;
      return getChannelDisplayName(ch).toLowerCase().includes(q);
    });
  }, [channels, activeServer?.id, searchQuery, currentUserId]);
  const isServerView = Boolean(activeServer?.id);

  return (
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

      <div className="px-3.5 pt-3 pb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-300/70">
          {isServerView ? "Text Channels" : "Direct Messages"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {loading && filteredChannels.length === 0 ? (
          <div className="px-3 py-4 text-xs text-emerald-300/50">
            Loading conversations...
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="px-3 py-6 text-center rounded-xl bg-[#0b211a] border border-emerald-500/15 mx-1 mt-2">
            <MessageSquare className="w-5 h-5 text-emerald-400/60 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-emerald-100">
              {isServerView ? "No channels yet" : "No DMs yet"}
            </p>
          </div>
        ) : (
          filteredChannels.map((ch) => {
            const label = getChannelDisplayName(ch);
            const isSelected = activeChannel?.id === ch.id;
            const unreadCount = ch.countUnread?.() || 0;

            return (
              <button
                key={ch.id}
                type="button"
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
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                    {label.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-emerald-50 truncate">
                    {label}
                  </div>
                  <div className="text-[10px] text-emerald-300/65 truncate flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-emerald-400/80 shrink-0" />
                    <span>{isServerView ? "Encrypted channel" : "Encrypted DM"}</span>
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

      <div className="p-2.5 bg-[#04120e] border-t border-emerald-500/15 flex items-center gap-2.5">
        <div className="relative w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center overflow-hidden shrink-0">
          {currentUserImage ? (
            <img
              src={currentUserImage}
              alt={currentUserName}
              className="w-full h-full object-cover"
            />
          ) : (
            currentUserName.charAt(0).toUpperCase()
          )}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#04120e]" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-extrabold text-emerald-50 truncate">
            {currentUserName}
          </div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            <span>Encrypted · Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
