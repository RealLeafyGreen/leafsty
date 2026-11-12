"use client";

import React, { createContext, useContext, useState } from "react";
import type { Channel } from "stream-chat";

export interface ServerObject {
  name: string;
  image?: string;
}

interface DiscordContextType {
  server: ServerObject | null;
  activeServer: ServerObject | null;
  changeServer: (server: ServerObject | null) => void;
  setActiveServer: (server: ServerObject | null) => void;
  activeChannel: Channel | null;
  setActiveChannel: (channel: Channel | null) => void;
}

const DiscordContext = createContext<DiscordContextType>({
  server: null,
  activeServer: null,
  changeServer: () => {},
  setActiveServer: () => {},
  activeChannel: null,
  setActiveChannel: () => {},
});

export const DiscordContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [activeServer, setActiveServer] = useState<ServerObject | null>(null);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  return (
    <DiscordContext.Provider
      value={{
        server: activeServer,
        activeServer,
        changeServer: setActiveServer,
        setActiveServer,
        activeChannel,
        setActiveChannel,
      }}
    >
      {children}
    </DiscordContext.Provider>
  );
};

export const useDiscordContext = () => useContext(DiscordContext);
