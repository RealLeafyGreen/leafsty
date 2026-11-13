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
      const inMemoryChannels = Object.values(
        (client as any).activeChannels || {}
      );

      const allItems = [...(response.channels || []), ...inMemoryChannels];

      allItems.forEach((item: any) => {
        const ch = item.channel || item;
        const custom = ch.custom || ch.data?.custom || ch.data || {};
        const serverName = custom.server || ch.data?.server || ch.server;

        if (serverName && !serversMap.has(serverName)) {
          serversMap.set(serverName, {
            name: serverName,
            image: ch.image || ch.data?.image || custom.image || "",
          });
        }
      });

      const uniqueServers = Array.from(serversMap.values());
      setServerList(uniqueServers);
    } catch (error) {
      console.error("Error loading server list:", error);
    }
  }, [client]);

  useEffect(() => {
    loadServerList();
    if (!client) return;

    const subAdded = client.on("notification.added_to_channel", loadServerList);
    const subCreated = client.on("channel.created", loadServerList);
    window.addEventListener("leafsty:server-updated", loadServerList);

    return () => {
      subAdded.unsubscribe();
      subCreated.unsubscribe();
      window.removeEventListener("leafsty:server-updated", loadServerList);
    };
  }, [client, showCreateServer, loadServerList]);

  return (
    <aside className="w-[74px] bg-[#0f241d] border-r border-emerald-950 flex flex-col items-center py-4 select-none shrink-0 z-20">
      {/* Home / Direct Messages Button */}
      <button
        type="button"
        onClick={() => {
          updateServer?.(null);
          setActiveChannel?.(null);
        }}
        title="Home & Direct Messages"
        className="relative group mb-2 cursor-pointer"
      >
        <span
          className={`absolute -left-3.5 top-1/2 -translate-y-1/2 w-1.5 rounded-r-full bg-emerald-400 transition-all ${
            !activeServer ? "h-7 opacity-100" : "h-0 opacity-0 group-hover:h-4 group-hover:opacity-70"
          }`}
        />
        <div
          className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-sm ${
            !activeServer
              ? "bg-emerald-500 text-white shadow-emerald-500/30"
              : "bg-[#18352b] text-emerald-200 hover:bg-emerald-600 hover:text-white"
          }`}
        >
          <img
            src="/logo.png"
            alt="Leafsty"
            className="w-7 h-7 object-contain"
          />
        </div>
      </button>

      <div className="w-7 h-[1px] bg-emerald-800/70 my-2" />

      {/* Server Icons List */}
      <div className="flex-1 w-full flex flex-col items-center space-y-2.5 overflow-y-auto py-1">
        {serverList.map((srv) => {
          const isSelected = activeServer?.name === srv.name;
          const initials = (srv.name || "Server")
            .split(" ")
            .filter(Boolean)
            .map((w: string) => w)
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
              className="relative group cursor-pointer"
            >
              <span
                className={`absolute -left-3.5 top-1/2 -translate-y-1/2 w-1.5 rounded-r-full bg-emerald-400 transition-all ${
                  isSelected
                    ? "h-7 opacity-100"
                    : "h-0 opacity-0 group-hover:h-4 group-hover:opacity-70"
                }`}
              />
              {srv.image ? (
                <img
                  src={srv.image}
                  alt={srv.name}
                  className={`w-12 h-12 object-cover rounded-2xl transition-all ${
                    isSelected
                      ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0f241d]"
                      : "opacity-85 group-hover:opacity-100"
                  }`}
                />
              ) : (
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-2xl font-bold text-sm transition-all ${
                    isSelected
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                      : "bg-[#18352b] text-emerald-100 hover:bg-emerald-600 hover:text-white"
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
          title="Create a New Server"
          className="pt-1"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-2xl border border-dashed border-emerald-600/70 bg-[#142d24] text-emerald-400 hover:bg-emerald-600 hover:border-emerald-500 hover:text-white transition-all">
            <span className="text-2xl leading-none font-light">+</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
