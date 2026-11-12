"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../../../types/DiscordContext";

interface UserObject {
  id: string;
  name?: string;
}

export default function CreateChannelForm() {
  const { client } = useChatContext();
  const { activeServer, setActiveChannel } = useDiscordContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const showCreateChannel = searchParams.get("createChannel") === "true";
  const defaultCategory = searchParams.get("category") || "TEXT CHANNELS";

  const [channelName, setChannelName] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [users, setUsers] = useState<UserObject[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCategory(defaultCategory);
  }, [defaultCategory]);

  useEffect(() => {
    if (!showCreateChannel || !client) return;

    const loadUsers = async () => {
      try {
        const response = await client.queryUsers({
          payload: {
            filter_conditions: {},
          },
        });
        const list = (response.users || []).map((u: any) => ({
          id: u.id,
          name: u.name || u.id,
        }));
        setUsers(list);
        if (client.userID) {
          setSelectedUsers([client.userID]);
        }
      } catch (err) {
        console.error("Failed to load users:", err);
      }
    };

    loadUsers();
  }, [showCreateChannel, client]);

  if (!showCreateChannel) return null;

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleClose = () => {
    setChannelName("");
    router.replace("/");
  };

  const createClicked = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = channelName.trim();
    if (!trimmed || !client?.userID) return;

    try {
      setLoading(true);
      const safeName =
        trimmed.toLowerCase().replace(/[^a-z0-9!_-]/g, "-") || "general";
      const members = Array.from(new Set([client.userID, ...selectedUsers]));

      const newChannel = client.channel(
        "messaging",
        `${safeName}-${Date.now()}`,
        {
          name: trimmed,
          category: category.trim() || "TEXT CHANNELS",
          server: activeServer?.name || "Home",
          members,
        } as any
      );

      await newChannel.watch();
      setActiveChannel(newChannel);
      handleClose();
    } catch (error) {
      console.error("Failed to create channel:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-[#313338] text-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-xl font-bold">Create Channel</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-zinc-400 hover:text-white text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        <p className="px-6 text-xs uppercase font-semibold text-zinc-400 mb-4">
          in {category}
        </p>

        <form onSubmit={createClicked} className="space-y-4">
          <div className="px-6">
            <label className="block text-xs font-bold uppercase tracking-wide text-zinc-300 mb-2">
              Channel Name
            </label>
            <div className="flex items-center rounded bg-[#1e1f22] px-3 py-2">
              <span className="text-zinc-400 mr-2">#</span>
              <input
                type="text"
                required
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="new-channel"
                className="w-full bg-transparent text-sm text-white outline-none"
              />
            </div>
          </div>

          <div className="px-6">
            <label className="block text-xs font-bold uppercase tracking-wide text-zinc-300 mb-2">
              Members
            </label>
            <div className="max-h-40 overflow-y-auto space-y-1.5 rounded bg-[#1e1f22] p-2">
              {users.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#2b2d31] cursor-pointer text-sm"
                >
                  <span>{u.name || u.id}</span>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(u.id)}
                    onChange={() => toggleUser(u.id)}
                    className="accent-[#5865F2] cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 bg-[#2b2d31] px-6 py-4 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:underline cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !channelName.trim()}
              className="rounded bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white transition cursor-pointer"
            >
              {loading ? "Creating..." : "Create Channel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
