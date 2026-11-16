"use client";

import React, { useRef, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../types/DiscordContext";
import { X, Sparkles, Camera, Download, Hash, Plus, Trash2, Users } from "lucide-react";

export default function CreateServerForm({
  onClose,
}: {
  onClose?: () => void;
}) {
  const { client } = useChatContext();
  const { setActiveServer, setActiveChannel } = useDiscordContext() as any;
    const [discordInvite, setDiscordInvite] = useState("");
  const [botToken, setBotToken] = useState("");
  const [fetchingInvite, setFetchingInvite] = useState(false);
  const [discordStats, setDiscordStats] = useState<{ members: number; online: number } | null>(null);
  const [importChannels, setImportChannels] = useState<string[]>(["welcome", "general", "clips"]);
  const [newImportChannel, setNewImportChannel] = useState("");

  const [mode, setMode] = useState<"create" | "discord">("create");
  const [serverName, setServerName] = useState("");
  const [serverIcon, setServerIcon] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const iconInputRef = useRef<HTMLInputElement>(null);
  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/");
      window.location.reload();
    }
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        setServerIcon(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  };

 const handleLookupDiscord = async () => {
  if (!discordInvite.trim() && !botToken.trim()) return;
  try {
    setFetchingInvite(true);
    setError("");
    const params = new URLSearchParams();
    if (discordInvite.trim()) params.set("invite", discordInvite.trim());
    if (botToken.trim()) params.set("botToken", botToken.trim());

    const res = await fetch(`/api/servers/import?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch Discord server");

    setServerName(data.name || "");
    if (data.iconUrl) setServerIcon(data.iconUrl);
    if (Array.isArray(data.channels) && data.channels.length > 0) {
      setImportChannels(data.channels);
    }
    setDiscordStats({ members: data.memberCount || 0, online: data.onlineCount || 0 });
  } catch (err: any) {
    setError(err?.message || "Invalid Discord invite or Bot Token");
  } finally {
    setFetchingInvite(false);
  }
};

  const handleDiscordJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const gName = parsed.guild?.name || parsed.name || file.name.replace(/\.json$/i, "");
        if (gName) setServerName(gName);
        if (parsed.guild?.iconUrl || parsed.icon) setServerIcon(parsed.guild?.iconUrl || parsed.icon);

        const extracted: string[] = [];
        if (Array.isArray(parsed.channels)) {
          parsed.channels.forEach((c: any) => {
            if (typeof c === "string") extracted.push(c);
            else if (c?.name && (c.type === 0 || c.type === "GUILD_TEXT" || c.type === undefined)) {
              extracted.push(c.name);
            }
          });
        }
        if (extracted.length > 0) setImportChannels(extracted.slice(0, 20));
        setError("");
      } catch {
        setError("Invalid JSON file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = serverName.trim();
    if (!cleanName || !client?.userID || creating) return;

    try {
      setCreating(true);
      setError("");

            if (mode === "discord") {
        const slug =
          cleanName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "server";

        const channelsToCreate =
          importChannels.length > 0 ? importChannels : ["general"];

        let firstCh: any = null;

        for (const rawCh of channelsToCreate) {
          const chName =
            rawCh
              .trim()
              .replace(/^#/, "")
              .toLowerCase()
              .replace(/[^a-z0-9_-]+/g, "-") || "general";

          const channelId = `srv-${slug}-${chName}-${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .slice(2, 5)}`;

          const ch = client.channel("messaging", channelId, {
            name: chName,
            members: [client.userID],
            custom: {
              server: cleanName,
              serverIcon: serverIcon.trim() || undefined,
              name: chName,
              category: "IMPORTED CHANNELS",
            },
          } as any);

          await ch.watch();
          if (!firstCh) firstCh = ch;
        }

        setActiveServer?.({
          id: cleanName,
          name: cleanName,
          image: serverIcon.trim() || undefined,
        });
        if (firstCh) setActiveChannel?.(firstCh);
        handleClose();
        return;
      }

      const slug =
        cleanName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "server";

      const channelId = `srv-${slug}-${Date.now().toString(36)}`;
      const newChannel = client.channel("messaging", channelId, {
        name: "general",
        members: [client.userID],
        custom: {
          server: cleanName,
          serverIcon: serverIcon.trim() || undefined,
          name: "general",
        },
      } as any);

      await newChannel.watch();
      setActiveServer?.({
        id: cleanName,
        name: cleanName,
        image: serverIcon.trim() || undefined,
      });
      setActiveChannel?.(newChannel);
      handleClose();
    } catch (err: any) {
      console.error("Failed to create/import server:", err);
      setError(err?.message || "Failed to create server");
    } finally {
      setCreating(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-lg rounded-3xl bg-[#0b1914] border border-emerald-500/30 text-white shadow-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              {mode === "discord" ? <Download className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </span>
            <h2 className="text-lg font-black">
              {mode === "discord" ? "Import Discord Server" : "Create a Leafsty Server"}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-3">
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-black/40 border border-emerald-500/20 text-xs font-extrabold">
            <button
              type="button"
              onClick={() => { setMode("create"); setError(""); }}
              className={`py-2 rounded-xl transition cursor-pointer ${
                mode === "create" ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Create Fresh
            </button>
            <button
              type="button"
              onClick={() => { setMode("discord"); setError(""); }}
              className={`py-2 rounded-xl transition cursor-pointer ${
                mode === "discord" ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Import from Discord
            </button>
          </div>
        </div>

        <form onSubmit={handleCreate}>
          <div className="px-6 pb-5 space-y-4 max-h-[65vh] overflow-y-auto">
            {mode === "discord" && (
              <div className="rounded-2xl bg-black/30 border border-emerald-500/20 p-3.5 space-y-2.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                  Discord Invite Link or JSON Template
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discordInvite}
                    onChange={(e) => setDiscordInvite(e.target.value)}
                    placeholder="https://discord.gg"
                    className="flex-1 rounded-xl bg-black/40 border border-emerald-500/25 px-3 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={handleLookupDiscord}
                    disabled={fetchingInvite || (!discordInvite.trim() && !botToken.trim())}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-extrabold cursor-pointer"
                  >
                    {fetchingInvite ? "Fetching..." : "Fetch"}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer underline">
                    Or upload Discord JSON export
                    <input type="file" accept=".json" className="hidden" onChange={handleDiscordJsonUpload} />
                  </label>
                  {discordStats && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                      <Users className="w-3 h-3 text-emerald-400" />
                      {discordStats.members.toLocaleString()} members
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => iconInputRef.current?.click()}
                className="relative w-14 h-14 rounded-2xl bg-emerald-600/20 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
              >
                {serverIcon ? (
                  <img src={serverIcon} alt="Icon" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-5 h-5 text-emerald-400" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <input ref={iconInputRef} type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
                <button
                  type="button"
                  onClick={() => iconInputRef.current?.click()}
                  className="text-xs font-extrabold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  Upload Custom Server Icon
                </button>
                <p className="text-[11px] text-zinc-400 truncate">
                  {serverIcon ? "✓ Server icon ready" : "Auto-filled from Discord or upload your own"}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 mb-1">
                Server Name
              </label>
              <input
                type="text"
                required
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="e.g. Leafsty Grove"
                className="w-full rounded-xl bg-black/35 border border-emerald-500/25 px-3.5 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400"
              />
            </div>

            {mode === "discord" && (
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 mb-1.5">
                  Channels to Import ({importChannels.length})
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {importChannels.map((ch) => (
                    <span
                      key={ch}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-200"
                    >
                      <Hash className="w-3 h-3" />
                      {ch}
                      {importChannels.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setImportChannels((prev) => prev.filter((item) => item !== ch))}
                          className="ml-1 text-emerald-400 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newImportChannel}
                    onChange={(e) => setNewImportChannel(e.target.value)}
                    placeholder="Add another channel (e.g. memes)"
                    className="flex-1 rounded-xl bg-black/35 border border-emerald-500/25 px-3 py-1.5 text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const clean = newImportChannel.trim().replace(/^#/, "").toLowerCase();
                      if (clean && !importChannels.includes(clean)) {
                        setImportChannels((prev) => [...prev, clean]);
                        setNewImportChannel("");
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-500/15 border border-red-500/30 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-[#07110d] border-t border-emerald-500/15 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-zinc-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !serverName.trim()}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-extrabold text-white shadow-md transition cursor-pointer"
            >
              {creating
                ? mode === "discord"
                  ? "Importing Server..."
                  : "Creating..."
                : mode === "discord"
                ? `Import ${importChannels.length} Channels`
                : "Create Server"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
