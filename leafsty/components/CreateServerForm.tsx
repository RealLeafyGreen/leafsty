"use client";

import React, { useState } from "react";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../types/DiscordContext";

interface CreateServerFormProps {
  onClose?: () => void;
}

export default function CreateServerForm({ onClose }: CreateServerFormProps) {
  const { client } = useChatContext();
  const { setActiveServer, setActiveChannel } = useDiscordContext() as any;

  const [serverName, setServerName] = useState("");
  const [serverImage, setServerImage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedServer = serverName.trim();
    if (!trimmedServer || !client?.userID) return;

    try {
      setLoading(true);
      const safeServer =
        trimmedServer.toLowerCase().replace(/[^a-z0-9!_-]/g, "-") || "server";

      const newChannel = client.channel(
        "messaging",
        `general-${safeServer}-${Date.now()}`,
        {
          name: "general",
          category: "TEXT CHANNELS",
          server: trimmedServer,
          image: serverImage.trim() || undefined,
          members: [client.userID],
        } as any
      );

      await newChannel.watch();

      setActiveServer?.({
        name: trimmedServer,
        image: serverImage.trim() || "",
      });
      setActiveChannel?.(newChannel);

      if (onClose) {
        onClose();
      } else {
        window.history.replaceState({}, "", "/");
      }
    } catch (error) {
      console.error("Failed to create server:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.history.replaceState({}, "", "/");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white text-zinc-800 shadow-2xl border border-emerald-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-xl font-bold text-zinc-900">Create a Leafsty Server</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-700 text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        <p className="px-6 text-sm text-zinc-500 mb-4">
          Give your new server a name and an optional icon URL.
        </p>

        <form onSubmit={handleCreateServer} className="space-y-4">
          <div className="px-6">
            <label className="block text-xs font-bold uppercase tracking-wide text-emerald-800 mb-1.5">
              Server Name
            </label>
            <input
              type="text"
              required
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="jacob and jed talk"
              className="w-full rounded-xl bg-[#f7faf8] border border-emerald-200 px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="px-6">
            <label className="block text-xs font-bold uppercase tracking-wide text-emerald-800 mb-1.5">
              Server Icon URL (Optional)
            </label>
            <input
              type="url"
              value={serverImage}
              onChange={(e) => setServerImage(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-xl bg-[#f7faf8] border border-emerald-200 px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 bg-[#f4f7f5] border-t border-emerald-100 px-6 py-4 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:underline cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !serverName.trim()}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white transition cursor-pointer"
            >
              {loading ? "Creating..." : "Create Server"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
