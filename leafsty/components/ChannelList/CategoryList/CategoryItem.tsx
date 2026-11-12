"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../../../types/DiscordContext";

export default function CategoryItem({ category, channels }: any) {
  const [isOpen, setIsOpen] = useState(true);
  const { client } = useChatContext();
  const { activeChannel, setActiveChannel } = useDiscordContext();

  const handleSelectChannel = async (ch: any) => {
    if (!client) return;
    try {
      const channelId = ch?.channel?.id || ch?.id;
      const channelType = ch?.channel?.type || ch?.type || "messaging";
      const hydrated =
        typeof ch?.watch === "function"
          ? ch
          : client.channel(channelType, channelId);

      await hydrated.watch();
      setActiveChannel(hydrated);
    } catch (err) {
      console.error("Failed to open channel:", err);
    }
  };

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between px-2 py-1 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-800">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 cursor-pointer"
        >
          <span>{isOpen ? "▾" : "▸"}</span>
          <span>{category}</span>
        </button>

        <Link
          href={`/?createChannel=true&category=${encodeURIComponent(
            category || "TEXT CHANNELS"
          )}`}
          title="Create Channel"
          className="text-base leading-none hover:text-zinc-900"
        >
          +
        </Link>
      </div>

      {isOpen && (
        <div className="mt-1 space-y-0.5">
          {(channels || []).map((ch: any) => {
            const id = ch?.channel?.id || ch?.id;
            const name =
              ch?.channel?.data?.name || ch?.data?.name || ch?.name || id;
            const isSelected = activeChannel?.id === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSelectChannel(ch)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm font-medium transition cursor-pointer ${
                  isSelected
                    ? "bg-zinc-300/80 text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900"
                }`}
              >
                <span className="text-zinc-500 text-base leading-none">#</span>
                <span className="truncate">{name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
