"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../types/DiscordContext";
import UserSettingsModal from "./UserSettingsModal";
import UserCard from "./UserCard";

export function CustomChannelList() {
  const { client } = useChatContext();
  const { activeServer, activeChannel, setActiveChannel } =
    useDiscordContext() as any;

  const [channels, setChannels] = useState<any[]>([]);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [showUserCard, setShowUserCard] = useState(false);
  const [profileTick, setProfileTick] = useState(0);

  const loadChannels = useCallback(async () => {
    if (!client || !client.userID) return;

    try {
      const response = await client.queryChannels({
        filter_conditions: {
          type: "messaging",
          members: { $in: [client.userID] },
        },
      });

      const inMemory = Object.values((client as any).activeChannels || {});
      const map = new Map<string, any>();

      [...(response.channels || []), ...inMemory].forEach((item: any) => {
        const raw = item.channel || item;
        if (!raw?.id || map.has(raw.id)) return;

        const instance =
          typeof raw.watch === "function"
            ? raw
            : client.channel(raw.type || "messaging", raw.id);

        (instance as any)._meta = raw;
        map.set(raw.id, instance);
      });

      const allChannels = Array.from(map.values());

      const filtered = allChannels.filter((ch: any) => {
        const meta = ch._meta || {};
        const custom =
          meta.custom ||
          ch.custom ||
          ch.data?.custom ||
          meta.data ||
          ch.data ||
          {};
        const chServer =
          custom.server || meta.server || ch.data?.server || ch.server;

        if (activeServer?.name) {
          return chServer === activeServer.name;
        }
        return !chServer && !String(ch.id || "").startsWith("general-");
      });

      setChannels(filtered);
    } catch (error) {
      console.error("Failed to load channels:", error);
    }
  }, [client, activeServer]);

  useEffect(() => {
    loadChannels();
    if (!client) return;

    const subAdded = client.on("notification.added_to_channel", loadChannels);
    const subCreated = client.on("channel.created", loadChannels);

    return () => {
      subAdded.unsubscribe();
      subCreated.unsubscribe();
    };
  }, [client, activeServer, activeChannel, loadChannels]);

  const handleSelectChannel = async (ch: any) => {
    if (!client) return;
    try {
      const channelInstance =
        typeof ch.watch === "function"
          ? ch
          : client.channel(ch.type || "messaging", ch.id);

      await channelInstance.watch();
      setActiveChannel?.(channelInstance);
    } catch (error) {
      console.error("Failed to open channel:", error);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newChannelName.trim();
    if (!trimmed || !client?.userID || !activeServer?.name) return;

    try {
      setCreating(true);
      const safeName =
        trimmed.toLowerCase().replace(/[^a-z0-9!_-]/g, "-") || "channel";
      const safeServer =
        activeServer.name.toLowerCase().replace(/[^a-z0-9!_-]/g, "-") ||
        "server";

      const ch = client.channel(
        "messaging",
        `${safeName}-${safeServer}-${Date.now()}`,
        {
          name: trimmed,
          category: "TEXT CHANNELS",
          server: activeServer.name,
          members: [client.userID],
          custom: {
            name: trimmed,
            server: activeServer.name,
            category: "TEXT CHANNELS",
          },
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

  const userObj = (client?.user || {}) as any;
  const localPrefs =
    typeof window !== "undefined" && client?.userID
      ? JSON.parse(
          localStorage.getItem(`leafsty_profile_${client.userID}`) || "{}"
        )
      : {};

  const currentProfile = {
    id: client?.userID || "user",
    name: localPrefs.name || userObj.name || client?.userID || "Leafsty User",
    status:
      localPrefs.status ?? userObj.custom?.status ?? "Encrypted • Online",
    bio:
      localPrefs.bio ??
      userObj.custom?.bio ??
      "Messaging privately with 256-bit AES-GCM encryption.",
    banner:
      localPrefs.banner || "from-emerald-800 via-emerald-600 to-teal-500",
    image: userObj.image,
    roles: ["Leafsty Member", "E2EE Verified"],
    joinedAt: "Nov 13, 2026",
  };

  const handleSaveProfile = async (updated: any) => {
    if (!client?.userID) return;
    const anyClient = client as any;
    const merged = { ...currentProfile, ...updated };

    localStorage.setItem(
      `leafsty_profile_${client.userID}`,
      JSON.stringify({
        name: merged.name,
        status: merged.status,
        bio: merged.bio,
        banner: merged.banner,
      })
    );

    const saved = JSON.parse(localStorage.getItem("stream_user") || "{}");
    localStorage.setItem(
      "stream_user",
      JSON.stringify({ ...saved, id: client.userID, name: merged.name })
    );

    if (anyClient.user) {
      anyClient.user.name = merged.name;
      anyClient.user.custom = {
        ...(anyClient.user.custom || {}),
        status: merged.status,
        bio: merged.bio,
      };
    }

    if (typeof anyClient.upsertUsers === "function") {
      await anyClient.upsertUsers({
        users: {
          [client.userID]: {
            id: client.userID,
            name: merged.name,
            custom: { status: merged.status, bio: merged.bio },
          },
        },
      });
    }

    setProfileTick((t) => t + 1);
  };

  void profileTick;

  return (
    <aside className="w-64 h-full bg-[#f3f8f5] border-r border-emerald-100 flex flex-col justify-between select-none shrink-0">
      <div className="flex-1 overflow-y-auto">
        <div className="h-14 px-4 border-b border-emerald-100 bg-white/60 flex items-center justify-between">
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-700">
              {activeServer?.name ? "Leafsty Server" : "Workspace"}
            </span>
            <h1 className="text-sm font-extrabold text-zinc-900 truncate">
              {activeServer?.name || "Direct Messages"}
            </h1>
          </div>
        </div>

        <div className="p-3">
          <div className="flex items-center justify-between px-2 mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-800/70">
            <span>{activeServer?.name ? "Text Channels" : "Conversations"}</span>
            {activeServer?.name && (
              <button type="button" onClick={() => setShowCreateChannel(true)} className="w-5 h-5 rounded-md bg-emerald-100/80 hover:bg-emerald-600 text-emerald-800 hover:text-white flex items-center justify-center text-sm leading-none cursor-pointer">+</button>
            )}
          </div>

          <div className="space-y-1">
            {channels.length === 0 ? (
              <div className="mx-1 rounded-xl border border-dashed border-emerald-200 bg-white/70 p-3 text-xs text-zinc-500">
                {activeServer?.name ? "Click + above to add a text channel." : "Select a server or click + to create one."}
              </div>
            ) : (
              channels.map((ch: any) => {
                const meta = ch._meta || {};
                const custom = meta.custom || ch.custom || ch.data?.custom || meta.data || ch.data || {};
                const displayName = custom.name || meta.name || ch.data?.name || ch.name || "general";
                const isSelected = activeChannel?.id === ch.id;
                return (
                  <button key={ch.id} type="button" onClick={() => handleSelectChannel(ch)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer ${isSelected ? "bg-emerald-600 text-white" : "text-zinc-700 hover:bg-emerald-100/70"}`}>
                    <span className={isSelected ? "text-emerald-200" : "text-emerald-600"}>#</span>
                    <span className="truncate">{displayName}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-emerald-100 bg-white/80 shrink-0">
        <div onClick={() => setShowUserCard(true)} role="button" tabIndex={0} className="flex items-center gap-2.5 rounded-xl bg-white hover:bg-emerald-50/80 border border-emerald-100 px-3 py-2 cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center uppercase shrink-0">
            {currentProfile.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-zinc-900 truncate">{currentProfile.name}</div>
            <div className="text-[11px] text-emerald-600 font-medium truncate">{currentProfile.status || "Encrypted • Online"}</div>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); setShowSettings(true); }} className="p-1.5 rounded-lg hover:bg-emerald-100/70 cursor-pointer">⚙️</button>
        </div>
      </div>

      {showUserCard && <UserCard user={currentProfile} isCurrentUser={true} onClose={() => setShowUserCard(false)} onSaveProfile={handleSaveProfile} />}
      <UserSettingsModal isOpen={showSettings} onClose={() => { setShowSettings(false); setProfileTick((t) => t + 1); }} />

      {showCreateChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-emerald-100">
            <h3 className="text-lg font-bold text-zinc-900 mb-3">Create Text Channel</h3>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <input type="text" required value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="announcements" className="w-full rounded-xl bg-[#f7faf8] border border-emerald-200 px-3.5 py-2.5 text-sm outline-none" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateChannel(false)} className="px-4 py-2 text-xs text-zinc-600 cursor-pointer">Cancel</button>
                <button type="submit" disabled={creating} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white cursor-pointer">{creating ? "Creating..." : "Create Channel"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}

export default CustomChannelList;
