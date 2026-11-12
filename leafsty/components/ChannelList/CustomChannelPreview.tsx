"use client";

import React from "react";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../../types/DiscordContext";

interface CustomChannelPreviewProps {
  channel: any;
}

export function CustomChannelPreview({ channel }: CustomChannelPreviewProps) {
  const { client } = useChatContext();
  const { activeChannel, setActiveChannel } = useDiscordContext();

  const channelId = channel?.channel?.id || channel?.id || "general";
  const channelName =
    channel?.channel?.data?.name ||
    channel?.data?.name ||
    channel?.name ||
    channelId;
  const isSelected = activeChannel?.id === channelId;

  const handleSelectChannel = async () => {
    if (!client) return;
    try {
      const channelType =
        channel?.channel?.type || channel?.type || "messaging";
      const hydrated =
        typeof channel?.watch === "function"
          ? channel
          : client.channel(channelType, channelId);

      await hydrated.watch();
      setActiveChannel(hydrated);
    } catch (error) {
      console.error("Failed to open channel:", error);
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

export default CustomChannelPreview;
