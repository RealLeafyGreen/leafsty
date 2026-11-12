"use client";

import React from "react";
import { useChatContext } from "stream-chat-react";
import type { Channel } from "stream-chat";

interface CustomChannelPreviewProps {
  channel: Channel;
}

export default function CustomChannelPreview({
  channel,
}: CustomChannelPreviewProps) {
  const { channel: activeChannel, setActiveChannel } = useChatContext() as any;
  const isSelected = activeChannel?.id === channel.id;
  const channelName = (channel.data as any)?.name || channel.id || "general";

  const handleSelectChannel = async () => {
    try {
      await channel.watch();
      setActiveChannel?.(channel);
    } catch (err) {
      console.error("Failed to open channel:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSelectChannel}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm font-medium transition cursor-pointer ${
        isSelected
          ? "bg-zinc-300/80 text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900"
      }`}
    >
      <span className="text-zinc-500 text-base leading-none">#</span>
      <span className="truncate">{channelName}</span>
    </button>
  );
}
