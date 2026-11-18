"use client";

import React, { useState } from "react";
import { useChatContext } from "stream-chat-react";
import ServerList from "./ServerList";
import CustomChannelList  from "./CustomChannelList";
import UserSettingsModal from "./UserSettingsModal";
import { useDiscordContext } from "../types/DiscordContext";

export default function MyChat() {
  const { client } = useChatContext() as any;
  const { activeChannel } = useDiscordContext() as any;
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#071410] text-emerald-50">
      {/* <ServerList /> */}

      {/* <CustomChannelList onOpenSettings={() => setShowSettings(true)} /> */}

      <main className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center bg-[#0a1d17] text-emerald-50">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center shadow-lg mb-4">
          L
        </div>
        <h1 className="text-xl font-extrabold text-emerald-50">
          Your Leafsty Space
        </h1>
        <p className="text-sm text-emerald-300/70 mt-1 max-w-sm">
          {client?.user?.id
            ? `Connected cleanly as ${client.user.name || client.user.id}!`
            : "Main canvas loaded safely without crashing."}
        </p>
        {activeChannel?.id && (
          <p className="text-xs text-emerald-400 mt-2">
            Active channel: {activeChannel.id}
          </p>
        )}
      </main>

      {showSettings && (
        <UserSettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
