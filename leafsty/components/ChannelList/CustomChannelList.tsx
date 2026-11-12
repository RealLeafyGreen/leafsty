"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../../types/DiscordContext";
import ChannelListTopBar from "./TopBar/ChannelListTopBar";
import CategoryItem from "./CategoryList/CategoryItem";
import CreateChannelForm from "./CreateChannelForm/CreateChannelForm";
import ChannelListBottomBar from "./BottomBar/ChannelListBottomBar";

export function CustomChannelList() {
  const { client } = useChatContext();
  const { activeServer, activeChannel, setActiveChannel } = useDiscordContext();
  const searchParams = useSearchParams();

  const showCreateServer = searchParams.get("createServer") === "true";
  const showCreateChannel = searchParams.get("createChannel") === "true";

  const [channelsByCategory, setChannelsByCategory] = useState<
    Record<string, any[]>
  >({});

  const loadChannels = useCallback(async () => {
    if (!client || !client.userID) return;

    try {
      const response = await client.queryChannels({
        filter_conditions: {
          type: "messaging",
          members: { $in: [client.userID] },
        },
      });

      const hydrated = (response.channels || []).map((item: any) => {
        const id = item.channel?.id || item.id;
        const type = item.channel?.type || item.type || "messaging";
        const ch = client.channel(type, id);
        // Merge summary data so server & category fields are immediately readable
        if (item.channel) {
          ch.data = { ...item.channel, ...ch.data };
        }
        return ch;
      });

      // Filter channels to match the currently selected server
      const serverChannels = activeServer?.name
        ? hydrated.filter(
            (ch: any) => ch.data?.server === activeServer.name
          )
        : hydrated;

      // Group channels by category (defaulting to "TEXT CHANNELS")
      const grouped: Record<string, any[]> = {};
      serverChannels.forEach((ch: any) => {
        const cat = (ch.data?.category || "TEXT CHANNELS").toUpperCase();
        if (!grouped[cat]) {
          grouped[cat] = [];
        }
        grouped[cat].push(ch);
      });

      // Always keep at least "TEXT CHANNELS" visible when a server is selected
      if (activeServer?.name && !grouped["TEXT CHANNELS"]) {
        grouped["TEXT CHANNELS"] = [];
      }

      setChannelsByCategory(grouped);

      // Auto-select the first channel in this server if none is selected
      if (!activeChannel && serverChannels.length > 0) {
        const first = serverChannels[0];
        await first.watch();
        setActiveChannel(first);
      }
    } catch (error) {
      console.error("Failed to load server channels:", error);
    }
  }, [client, activeServer, activeChannel, setActiveChannel]);

  // Reload channels whenever activeServer changes OR a server/channel modal closes
  useEffect(() => {
    if (!showCreateServer && !showCreateChannel) {
      loadChannels();
    }
  }, [showCreateServer, showCreateChannel, loadChannels]);

  return (
    <div className="w-60 bg-[#f4f7f5] flex flex-col h-full border-r border-emerald-100 select-none shrink-0">
      {/* Top Server Header Dropdown */}
      <ChannelListTopBar serverName={activeServer?.name || "Home"} />

      {/* Categorized Channels List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
        {Object.keys(channelsByCategory).length === 0 ? (
          <div className="px-2 py-4 text-center">
            <p className="text-xs text-zinc-500">
              No channels here yet. Click{" "}
              <span className="font-bold text-emerald-600">+</span> in the left
              bar to create a server.
            </p>
          </div>
        ) : (
          Object.entries(channelsByCategory).map(([category, chans]) => (
            <CategoryItem
              key={category}
              category={category}
              channels={chans}
            />
          ))
        )}
      </div>

      {/* Create Channel Modal */}
      <CreateChannelForm />

      {/* Bottom Leafsty User Bar & Profile Card */}
      <ChannelListBottomBar />
    </div>
  );
}

export default CustomChannelList;
