"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext, ServerObject } from "../types/DiscordContext";

export default function ServerList() {
  const { client } = useChatContext();
  const { activeServer, setActiveServer, changeServer, setActiveChannel } =
    useDiscordContext() as any;
  const updateServer = changeServer || setActiveServer;

  const [serverList, setServerList] = useState<ServerObject[]>([]);
  const searchParams = useSearchParams();
  const showCreateServer = searchParams.get("createServer") === "true";

  const loadServerList = useCallback(async () => {
    if (!client || !client.userID) return;

    try {
      const response = await client.queryChannels({
        filter_conditions: {
          type: "messaging",
          members: { $in: [client.userID] },
        },
      });

      const serversMap = new Map<string, ServerObject>();

      (response.channels || []).forEach((item: any) => {
        const data = item.channel?.data || item.data || {};
        const serverName = data.server;
        if (serverName && !serversMap.has(serverName)) {
          serversMap.set(serverName, {
            name: serverName,
            image: data.image || "",
          });
        }
      });

      const uniqueServers = Array.from(serversMap.values());
      setServerList(uniqueServers);

      if (!activeServer && uniqueServers.length > 0) {
        updateServer?.(uniqueServers[0]);
      }
    } catch (error) {
      console.error("Error loading server list:", error);
    }
  }, [client, activeServer, updateServer]);

  // Reload server icons on mount AND whenever the Create Server modal closes
  useEffect(() => {
    if (!showCreateServer) {
      loadServerList();
    }
  }, [showCreateServer, loadServerList]);

  return (
    <aside className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 select-none shrink-0 z-20">
      {/* Home / Direct Messages Button */}
      <button
        type="button"
        onClick={() => {
          updateServer?.(null);
          setActiveChannel?.(null);
        }}
        title="Home"
        className={`sidebar-icon py-1 ${
          !activeServer && serverList.length > 0 ? "selected-icon" : ""
        }`}
      >
        <div
          className={`w-12 h-12 flex items-center justify-center rounded-icon transition-colors ${
            !activeServer && serverList.length > 0
              ? "bg-[#5865F2] text-white"
              : "bg-[#313338] hover:bg-[#5865F2] text-white"
          }`}
        >
          <img
            src="/logo.png"
            alt="Leafsty Logo"
            className="w-8 h-8 object-contain"
          />
        </div>
      </button>

      <div className="w-8 h-[2px] bg-zinc-700/80 rounded-full my-2" />

      {/* Server Icons List */}
      <div className="flex-1 w-full flex flex-col items-center space-y-2">
        {serverList.map((srv) => {
          const isSelected = activeServer?.name === srv.name;
          const initials = (srv.name || "Server")
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <button
              key={srv.name}
              type="button"
              onClick={() => {
                updateServer?.(srv);
                setActiveChannel?.(null);
              }}
              title={srv.name}
              className={`sidebar-icon py-1 ${isSelected ? "selected-icon" : ""}`}
            >
              {srv.image ? (
                <img
                  src={srv.image}
                  alt={srv.name}
                  className="w-12 h-12 object-cover rounded-icon shadow-md"
                />
              ) : (
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-icon font-semibold text-sm shadow-md ${
                    isSelected
                      ? "bg-[#5865F2] text-white"
                      : "bg-[#313338] text-zinc-200 hover:bg-[#5865F2] hover:text-white"
                  }`}
                >
                  {initials}
                </div>
              )}
            </button>
          );
        })}

        {/* Add Server (+) Button */}
        <Link
          href="/?createServer=true"
          title="Add a Server"
          className="sidebar-icon py-1"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-icon bg-[#313338] text-[#23a559] hover:bg-[#23a559] hover:text-white shadow-md">
            <span className="text-2xl leading-none font-light">+</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
