"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../types/DiscordContext";
import UserCard from "./UserCard";
import UserSettingsModal from "./UserSettingsModal";
import UserContextMenu, { ContextTargetUser } from "./UserContextMenu";
import {
  Hash,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ChevronDown,
  UserPlus,
  LogOut,
  Check,
  X,
  Sparkles,
} from "lucide-react";

export function CustomChannelList() {
  const { client } = useChatContext();
  const { activeServer, setActiveServer, activeChannel, setActiveChannel } = useDiscordContext() as any;

  const [channels, setChannels] = useState<any[]>([]);
  const [sidebarFilter, setSidebarFilter] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [creating, setCreating] = useState(false);

  const [showCreateDM, setShowCreateDM] = useState(false);
  const [dmTargetUser, setDmTargetUser] = useState("");
  const [knownUsers, setKnownUsers] = useState<any[]>([]);
  const [creatingDM, setCreatingDM] = useState(false);

  const [showUserCard, setShowUserCard] = useState(false);
  const [inspectedProfile, setInspectedProfile] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [showServerInfo, setShowServerInfo] = useState(false);
  const [copiedServerInvite, setCopiedServerInvite] = useState(false);
  const [, setProfileTick] = useState(0);
  const [, setUnreadTick] = useState(0);

  const [ctxUser, setCtxUser] = useState<ContextTargetUser | null>(null);
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);

    const loadChannels = useCallback(async () => {
    const uid = client?.user?.id || client?.userID;
    if (!client || !uid) return;
    try {
      const res = await fetch("/api/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      });
      const json = await res.json().catch(() => ({}));
      const serverChannels = Array.isArray(json.channels) ? json.channels : [];
      const inMemory = Object.values((client as any).activeChannels || {});
      const map = new Map<string, any>();

      serverChannels.forEach((item: any) => {
        if (!item?.id) return;
        const instance = client.channel(item.type || "messaging", item.id);
        instance.data = { ...(instance.data || {}), ...(item.data || {}) };
        if (Array.isArray(item.members) && instance.state) {
          instance.state.members = instance.state.members || {};
          item.members.forEach((m: any) => {
            if (m.user_id) {
              instance.state.members[m.user_id] = m;
            }
          });
        }
        instance.watch().catch(() => {});
        map.set(item.id, instance);
      });

      inMemory.forEach((item: any) => {
        const raw = item?.channel || item;
        if (!raw?.id || map.has(raw.id)) return;
        const instance =
          typeof raw.watch === "function"
            ? raw
            : client.channel(raw.type || "messaging", raw.id);
        map.set(raw.id, instance);
      });

      const filtered = Array.from(map.values()).filter((ch: any) => {
        const custom = ch.data?.custom || ch.custom || {};
        const chServer = custom.server || ch.data?.server || ch.server;
        if (activeServer?.name) return chServer === activeServer.name;
        return !chServer && !String(ch.id || "").startsWith("general-");
      });

      const seenPartners = new Set<string>();
      const deduped = activeServer?.name
        ? filtered
        : filtered.filter((ch: any) => {
            const members = Object.values(ch.state?.members || {}) as any[];
            const other = members.find(
              (m: any) =>
                (m?.user_id || m?.user?.id || "").toLowerCase() !==
                uid.toLowerCase()
            );
            let partnerKey = (other?.user_id || other?.user?.id || "").toLowerCase();
            if (!partnerKey && String(ch.id || "").startsWith("dm-")) {
              const parts = String(ch.id).slice(3).split("-");
              partnerKey =
                parts.find((p) => p.toLowerCase() !== uid.toLowerCase()) ||
                parts.at(0) ||
                ch.id;
            }
            if (!partnerKey) partnerKey = ch.id;
            if (seenPartners.has(partnerKey)) return false;
            seenPartners.add(partnerKey);
            return true;
          });

      setChannels(deduped);
    } catch (error) {
      console.error("Failed to load channels:", error);
    }
  }, [client, activeServer]);

  useEffect(() => {
    setShowServerMenu(false);
    loadChannels();
    if (!client) return;
    const handleEvent = () => loadChannels();
    client.on?.("notification.added_to_channel", handleEvent);
    client.on?.("channel.created", handleEvent);
    client.on?.("message.new", handleEvent);
    return () => {
      client.off?.("notification.added_to_channel", handleEvent);
      client.off?.("channel.created", handleEvent);
      client.off?.("message.new", handleEvent);
    };
  }, [client, activeServer, loadChannels]);

    const handleSelectChannel = async (ch: any) => {
    if (!client || !ch) return;
    try {
      const liveChannel = client.channel(ch.type || "messaging", ch.id);
      await liveChannel.watch({ state: true, presence: true });
      await liveChannel.markRead?.();
      setActiveChannel?.(liveChannel);
      setUnreadTick((t) => t + 1);
    } catch (error) {
      console.error("Failed to open channel:", error);
    }
  };


  const openDMModal = async () => {
    setShowCreateDM(true);
    if (!client) return;
    try {
      const res = await (client as any).queryUsers?.(
        { id: { $ne: client.userID } },
        { last_active: -1 },
        { limit: 30 }
      );
      setKnownUsers(res?.users || []);
    } catch {
      setKnownUsers([]);
    }
  };

  const handleStartDM = async (targetId: string) => {
    const cleanId = targetId.trim().replace(/^@/, "");
    if (!cleanId || !client?.userID) return;
    try {
      setCreatingDM(true);
      const ensureRes = await fetch("/api/users/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: cleanId,
          name: cleanId,
          baseURL: (client as any).baseURL,
        }),
      });
      const ensureData = await ensureRes.json().catch(() => ({}));
      if (!ensureRes.ok) {
        throw new Error(ensureData.error || `Failed (${ensureRes.status})`);
      }

      const pair = [client.userID.toLowerCase(), cleanId.toLowerCase()].sort();
      const dmId = `dm-${pair.join("-")}`;
      const dmChannel = client.channel("messaging", dmId, {
        members: [{ user_id: client.userID }, { user_id: cleanId }],
        custom: { is_dm: true },
      } as any);

      await dmChannel.watch();
      await dmChannel.show?.();
      setDmTargetUser("");
      setShowCreateDM(false);
      setActiveChannel?.(dmChannel);
      await loadChannels();
    } catch (error: any) {
      console.error("Failed to start DM:", error);
      alert(error?.message || "Could not start DM with that user.");
    } finally {
      setCreatingDM(false);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newChannelName.trim();
    if (!trimmed || !client?.userID || !activeServer?.name) return;
    try {
      setCreating(true);
      const safeName = trimmed.toLowerCase().replace(/[^a-z0-9!_-]/g, "-") || "channel";
      const safeServer = activeServer.name.toLowerCase().replace(/[^a-z0-9!_-]/g, "-") || "server";

      const ch = client.channel(
        "messaging",
        `${safeName}-${safeServer}-${Date.now()}`,
        {
          name: trimmed,
          members: [client.userID],
          custom: { name: trimmed, server: activeServer.name, category: "TEXT CHANNELS" },
        } as any
      );

      await ch.watch();
      setNewChannelName("");
      setShowCreateChannel(false);
      setActiveChannel?.(ch);
      await loadChannels();
    } catch (error) {
      console.error("Failed to create channel:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleCopyServerInvite = () => {
    if (!activeServer?.name) return;
    const url = `${window.location.origin}/?invite=${encodeURIComponent(activeServer.name)}`;
    navigator.clipboard?.writeText(url);
    setCopiedServerInvite(true);
    setTimeout(() => {
      setCopiedServerInvite(false);
      setShowServerMenu(false);
    }, 1200);
  };

  const handleLeaveServer = async () => {
    if (!client?.userID || !activeServer?.name) return;
    if (!confirm(`Leave ${activeServer.name}?`)) return;
    try {
      for (const ch of channels) {
        await ch.removeMembers?.([client.userID]);
      }
      setShowServerMenu(false);
      setActiveServer?.(null);
      setActiveChannel?.(null);
    } catch (err) {
      console.error("Failed to leave server:", err);
    }
  };

    const handleLeaveDM = async (e: React.MouseEvent, ch: any) => {
    e.stopPropagation();
    if (!client?.userID || !ch) return;
    try {
      await ch.hide?.();
      await ch.removeMembers?.([client.userID]).catch(() => {});
      setChannels((prev) => prev.filter((item) => item.id !== ch.id));
      if (activeChannel?.id === ch.id) setActiveChannel?.(null);
    } catch (err) {
      console.error("Failed to leave DM:", err);
    }
  };

  const resolveChannelDisplay = (ch: any) => {
    const custom = ch.data?.custom || ch.custom || {};
    const myId = (client?.userID || "").toLowerCase();

    if (activeServer?.name) {
      return {
        partnerId: "",
        title: custom.name || ch.data?.name || ch.id,
        subtitle: null,
        avatar: null,
        online: false,
      };
    }

       const membersObj = ch.state?.members || {};
    const allMembers = Object.values(membersObj) as any[];
    const otherMember = allMembers.find((m: any) => {
      const uid = (m?.user_id || m?.user?.id || "").toLowerCase();
      return uid && uid !== myId;
    });

    const otherUser = otherMember?.user || {};
    let partnerId = otherMember?.user_id || otherUser?.id || "";


    if (!partnerId && String(ch.id || "").startsWith("dm-")) {
      const parts = String(ch.id).slice(3).split("-");
      partnerId = parts.find((p) => p.toLowerCase() !== myId) || parts.at(0) || "";
    }

    return {
      partnerId,
      title: otherUser?.name || partnerId || "Direct Message",
      subtitle: otherUser?.custom?.status || "Encrypted DM",
      avatar: otherUser?.image || null,
      online: Boolean(otherUser?.online),
    };
  };

  const userObj = (client?.user || {}) as any;
  const localPrefs =
    typeof window !== "undefined" && client?.userID
      ? JSON.parse(localStorage.getItem(`leafsty_profile_${client.userID}`) || "{}")
      : {};

  const currentProfile = {
    id: client?.userID || "user",
    name: localPrefs.name || userObj.name || client?.userID || "Leafsty User",
    image: localPrefs.image ?? userObj.image ?? "",
    status: localPrefs.status || userObj.custom?.status || "Encrypted • Online",
    bio: localPrefs.bio || userObj.custom?.bio || "256-bit AES-GCM Protected",
    banner: localPrefs.banner || userObj.custom?.banner,
    pronouns: localPrefs.pronouns || "",
    decoration: localPrefs.decoration || "emerald",
    nameStyle: localPrefs.nameStyle || "classic",
  };

  const visibleChannels = channels.filter((ch) => {
    if (!sidebarFilter.trim()) return true;
    const disp = resolveChannelDisplay(ch);
    return String(disp.title || "").toLowerCase().includes(sidebarFilter.toLowerCase());
  });
  return (
    <aside className="w-64 h-full bg-[#eef6f2] border-r border-emerald-200/80 flex flex-col justify-between shrink-0 select-none relative">
      <div className="flex flex-col min-h-0 flex-1">
        <div className="relative">
          {activeServer?.name ? (
            <button
              type="button"
              onClick={() => setShowServerMenu((s) => !s)}
              className="w-full h-14 px-4 border-b border-emerald-200/80 flex items-center justify-between hover:bg-emerald-500/15 transition cursor-pointer"
            >
              <span className="font-extrabold text-sm text-emerald-50 truncate">
                {activeServer.name}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-emerald-300 transition-transform ${
                  showServerMenu ? "rotate-180" : ""
                }`}
              />
            </button>
          ) : (
            <div className="h-14 px-3 border-b border-emerald-200/80 flex items-center">
              <div className="w-full flex items-center gap-2 rounded-xl bg-white/90 border border-emerald-200/80 px-2.5 py-1.5">
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={sidebarFilter}
                  onChange={(e) => setSidebarFilter(e.target.value)}
                  placeholder="Find or start a conversation"
                  className="w-full bg-transparent text-xs outline-none text-zinc-800 placeholder:text-zinc-400"
                />
              </div>
            </div>
          )}
          {showServerMenu && activeServer?.name && (
            <div className="absolute left-3 right-3 top-15 z-40 rounded-2xl bg-[#0b1914] border border-emerald-500/35 text-white p-1.5 shadow-2xl space-y-1">
              <button
                type="button"
                onClick={handleCopyServerInvite}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-extrabold text-emerald-300 hover:bg-emerald-500/15 transition cursor-pointer"
              >
                <span>{copiedServerInvite ? "Invite Link Copied!" : "Invite People"}</span>
                {copiedServerInvite ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => { setShowServerMenu(false); setShowCreateChannel(true); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-zinc-200 hover:bg-white/10 transition cursor-pointer"
              >
                <span>Create Channel</span>
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => { setShowServerMenu(false); setShowServerInfo(true); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-zinc-200 hover:bg-white/10 transition cursor-pointer"
              >
                <span>Server Overview</span>
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleLeaveServer}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/15 transition cursor-pointer"
              >
                <span>Leave Server</span>
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        <div className="px-3 pt-4 pb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300/80">
            {activeServer?.name ? "Text Channels" : "Direct Messages"}
          </span>
          <button
            type="button"
            onClick={() => (activeServer?.name ? setShowCreateChannel(true) : openDMModal())}
            title={activeServer?.name ? "Create Channel" : "New Direct Message"}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-500/20 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
                    {visibleChannels.map((ch) => {
            const disp = resolveChannelDisplay(ch);
            const isActive = activeChannel?.id === ch.id;
            const unreadCount =
              !isActive && typeof ch.countUnread === "function"
                ? ch.countUnread()
                : 0;

            return (
              <div
                key={ch.id}
                onContextMenu={(e) => {
                  if (!disp.partnerId) return;
                  e.preventDefault();
                  setCtxUser({
                    id: disp.partnerId,
                    name: disp.title,
                    image: disp.avatar || undefined,
                  });
                  setCtxPos({ x: e.clientX, y: e.clientY });
                }}
                className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-xs"
                    : unreadCount > 0
                    ? "bg-emerald-500/10 text-white hover:bg-emerald-500/20"
                    : "text-zinc-200 hover:bg-emerald-500/15 hover:text-white"
                }`}
              >
                {unreadCount > 0 && (
                  <span className="absolute -left-2 w-1.5 h-5 rounded-r-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]" />
                )}

                <button
                  type="button"
                  onClick={() => handleSelectChannel(ch)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                >
                  {activeServer?.name ? (
                    <Hash
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? "text-emerald-100"
                          : unreadCount > 0
                          ? "text-emerald-300"
                          : "text-emerald-400"
                      }`}
                    />
                  ) : disp.avatar ? (
                    <img
                      src={disp.avatar}
                      alt={disp.title}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                        isActive
                          ? "bg-white text-emerald-700"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {String(disp.title || "U").charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-xs truncate ${
                        unreadCount > 0 ? "font-black text-white" : "font-bold"
                      }`}
                    >
                      {disp.title}
                    </div>
                    {disp.subtitle && (
                      <div
                        className={`text-[10px] truncate ${
                          isActive
                            ? "text-emerald-100"
                            : "text-emerald-300/70"
                        }`}
                      >
                        {disp.subtitle}
                      </div>
                    )}
                  </div>
                </button>

                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-400 text-[#04110b] font-black text-[10px] leading-none shrink-0 shadow-xs">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}

                {!activeServer?.name && (
                  <button
                    type="button"
                    onClick={(e) => handleLeaveDM(e, ch)}
                    title="Close / Leave DM"
                    className={`opacity-75 hover:opacity-100 p-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                      isActive
                        ? "text-white hover:bg-white/20"
                        : "text-emerald-300/80 hover:bg-red-500/20 hover:text-red-400"
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-2.5 border-t border-emerald-500/20 bg-[#07110d] text-white flex items-center justify-between gap-2">
        {/* User profile dock and settings buttons */}
      </div>

      {showCreateChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <form onSubmit={handleCreateChannel} className="w-full max-w-sm rounded-3xl bg-[#0b1914] border border-emerald-500/30 text-white p-5 space-y-4 shadow-2xl">
            {/* Create Channel Modal Content */}
          </form>
        </div>
      )}
      <div className="p-2.5 border-t border-emerald-500/20 bg-[#07110d] text-white flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            setInspectedProfile(currentProfile);
            setShowUserCard(true);
          }}
          className="flex items-center gap-2.5 min-w-0 flex-1 p-1.5 rounded-xl hover:bg-white/10 transition text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center overflow-hidden shrink-0">
            {currentProfile.image ? (
              <img src={currentProfile.image} alt={currentProfile.name} className="w-full h-full object-cover" />
            ) : (
              currentProfile.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-white truncate">{currentProfile.name}</div>
            <div className="text-[10px] text-emerald-400 truncate flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 shrink-0" />
              <span className="truncate">{currentProfile.status}</span>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          title="User Settings"
          className="p-2 rounded-xl text-zinc-400 hover:text-emerald-300 hover:bg-white/10 transition cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
            {showCreateDM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#0b1914] border border-emerald-500/30 text-white p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base">Start Direct Message</h3>
              <button
                type="button"
                onClick={() => setShowCreateDM(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStartDM(dmTargetUser);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={dmTargetUser}
                onChange={(e) => setDmTargetUser(e.target.value)}
                placeholder="Enter username"
                className="flex-1 rounded-xl bg-black/35 border border-emerald-500/25 px-3 py-2 text-xs outline-none"
              />
              <button
                type="submit"
                disabled={creatingDM}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 text-xs font-extrabold cursor-pointer"
              >
                {creatingDM ? "..." : "Chat"}
              </button>
            </form>
            {knownUsers.length > 0 && (
              <div className="space-y-1 max-h-44 overflow-y-auto">
                {knownUsers.map((u: any) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleStartDM(u.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left text-xs font-bold cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[11px]">
                      {(u.name || u.id).charAt(0).toUpperCase()}
                    </div>
                    <span>{u.name || u.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {showServerInfo && activeServer?.name && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#0b1914] border border-emerald-500/30 text-white p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="font-black text-base">{activeServer.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowServerInfo(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              {channels.length} encrypted channel(s) in this server.
            </p>
            <button
              type="button"
              onClick={handleCopyServerInvite}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {copiedServerInvite ? "Invite Link Copied!" : "Copy Server Invite Link"}
              </span>
            </button>
          </div>
        </div>
      )}

      {showUserCard && inspectedProfile && (
        <UserCard
          user={inspectedProfile}
          onClose={() => setShowUserCard(false)}
          onEdit={() => {
            setShowUserCard(false);
            setShowSettings(true);
          }}
        />
      )}

      <UserSettingsModal
        isOpen={showSettings}
        user={client?.user}
        profile={currentProfile}
        onClose={() => setShowSettings(false)}
              onSave={async (updated) => {
        if (!client?.userID) return;
        localStorage.setItem(`leafsty_profile_${client.userID}`, JSON.stringify(updated));
        try {
          await (client as any).partialUpdateUser?.({
            id: client.userID,
            set: {
              name: updated.name,
              image: updated.image || "",
              custom: {
                status: updated.status,
                bio: updated.bio,
                banner: updated.banner,
              },
            },
          });
        } catch {}
        setProfileTick((t) => t + 1);
      }}
      />

      <UserContextMenu
        user={ctxUser}
        position={ctxPos}
        onClose={() => {
          setCtxUser(null);
          setCtxPos(null);
        }}
        onViewProfile={(u) => {
          setInspectedProfile(u);
          setShowUserCard(true);
        }}
        onMention={(u) => navigator.clipboard?.writeText(`@${u.id} `)}
        onMessage={(u) => handleStartDM(u.id)}
        onPoke={(u) => alert(`Leaf Poke sent to ${u.name}!`)}
      />
    </aside>
  );
}
