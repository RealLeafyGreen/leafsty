"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Channel, useChatContext } from "stream-chat-react";
import ServerList from "./ServerList";
import CustomChannelList from "./CustomChannelList";
import CustomMessage, { ReplyTarget } from "./MessageList/CustomMessage/CustomMessage";
import CustomMessageComposer from "./MessageList/MessageComposer/MessageComposer";
import { useDiscordContext } from "../types/DiscordContext";
import {
  AtSign,
  Hash,
  Lock,
  Phone,
  Search,
  Users,
  Video,
  X,
} from "lucide-react";

export default function MyChat() {
  const { client } = useChatContext() as any;
  const discordCtx = useDiscordContext() as any;
  const activeChannel = discordCtx?.activeChannel || null;
  const activeServer = discordCtx?.activeServer || discordCtx?.server || null;

  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMembers, setShowMembers] = useState(true);
  const [, setMsgTick] = useState(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = String(client?.user?.id || client?.userID || "");
  useEffect(() => {
    setReplyTo(null);
    setSearchQuery("");
    if (!activeChannel) return;

    const bump = () => setMsgTick((t) => t + 1);
    activeChannel.on?.("message.new", bump);
    activeChannel.on?.("message.updated", bump);
    activeChannel.on?.("message.deleted", bump);
    activeChannel.on?.("reaction.new", bump);
    activeChannel.on?.("reaction.deleted", bump);

    return () => {
      activeChannel.off?.("message.new", bump);
      activeChannel.off?.("message.updated", bump);
      activeChannel.off?.("message.deleted", bump);
      activeChannel.off?.("reaction.new", bump);
      activeChannel.off?.("reaction.deleted", bump);
    };
  }, [activeChannel]);

  const rawMessages = activeChannel?.state?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rawMessages.length, activeChannel?.id]);

  const channelTitle = useMemo(() => {
    if (!activeChannel) return "";
    if (activeChannel.data?.name) return activeChannel.data.name;
    const membersObj = activeChannel.state?.members || {};
    const other: any = Object.values(membersObj).find(
      (m: any) => String(m?.user?.id || m?.user_id) !== currentUserId
    );
    return (
      other?.user?.name ||
      other?.user_id ||
      activeChannel.id ||
      "Encrypted Chat"
    );
  }, [activeChannel, currentUserId]);

  const membersList = useMemo(() => {
    if (!activeChannel?.state?.members) return [];
    return Object.values(activeChannel.state.members);
  }, [activeChannel]);

  const visibleMessages = useMemo(() => {
    const recent = rawMessages.slice(-100);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recent;
    return recent.filter((m: any) =>
      String(m?.text || "").toLowerCase().includes(q)
    );
  }, [rawMessages, searchQuery]);

  const isDm =
    !activeServer?.id &&
    !activeChannel?.data?.serverId &&
    !activeChannel?.data?.server;
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#071410] text-emerald-50">
      <ServerList />

      <CustomChannelList />

      <main className="flex-1 h-full flex flex-col bg-[#0a1d17] text-emerald-50 min-w-0">
        {!activeChannel ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0a1d17]">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center shadow-lg shadow-emerald-950/60 mb-4">
              L
            </div>
            <h1 className="text-xl font-extrabold text-emerald-50">
              Your Leafsty Space
            </h1>
            <p className="text-sm text-emerald-300/70 mt-1 max-w-sm">
              Pick a channel or DM from the sidebar to start chatting.
            </p>
          </div>
        ) : (
          <>
            <header className="h-14 px-4 border-b border-emerald-500/15 bg-[#081914] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {isDm ? (
                  <AtSign className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Hash className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <h2 className="text-sm font-extrabold text-emerald-50 truncate">
                  {channelTitle}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">
                  <Lock className="w-2.5 h-2.5" /> E2EE
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Voice Call"
                  className="p-2 rounded-lg text-emerald-300/75 hover:text-emerald-50 hover:bg-emerald-500/15 transition cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Video Call"
                  className="p-2 rounded-lg text-emerald-300/75 hover:text-emerald-50 hover:bg-emerald-500/15 transition cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowMembers((v) => !v)}
                  title="Toggle Members"
                  className={`p-2 rounded-lg transition cursor-pointer ${
                    showMembers
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "text-emerald-300/75 hover:text-emerald-50 hover:bg-emerald-500/15"
                  }`}
                >
                  <Users className="w-4 h-4" />
                </button>

                <div className="relative hidden md:block w-44">
                  <Search className="w-3.5 h-3.5 text-emerald-400/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-8 pr-6 py-1 rounded-lg bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/45 focus:outline-none focus:border-emerald-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-300/60 hover:text-emerald-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </header>

            <div className="flex-1 flex min-h-0">
              <div className="flex-1 flex flex-col min-w-0 h-full bg-[#0a1d17]">
                <Channel channel={activeChannel}>
                  <div className="flex-1 flex flex-col justify-between h-full min-h-0">
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                      {/* Channel / DM Welcome Header */}
                      <div className="pb-4 mb-4 border-b border-emerald-500/15">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 flex items-center justify-center mb-3">
                          {isDm ? (
                            <AtSign className="w-6 h-6" />
                          ) : (
                            <Hash className="w-6 h-6" />
                          )}
                        </div>
                        <h3 className="text-lg font-extrabold text-emerald-50">
                          {isDm
                            ? `Welcome to your DM with ${channelTitle}`
                            : `Welcome to #${channelTitle}!`}
                        </h3>
                        <p className="text-xs text-emerald-300/70 mt-1 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            {isDm
                              ? `This is the start of your end-to-end encrypted conversation with ${channelTitle}.`
                              : `This is the start of the #${channelTitle} encrypted channel.`}
                          </span>
                        </p>
                      </div>

                      {visibleMessages.map((msg: any) => (
                        <CustomMessage
                          key={msg.id}
                          message={msg}
                          onReply={setReplyTo}
                        />
                      ))}
                      <div ref={bottomRef} />
                    </div>

                    <CustomMessageComposer
                      replyTarget={replyTo}
                      onCancelReply={() => setReplyTo(null)}
                    />
                  </div>
                </Channel>
              </div>

              {showMembers && (
                <aside className="w-60 h-full border-l border-emerald-500/15 bg-[#081914] p-3 overflow-y-auto shrink-0 hidden lg:block">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/70 mb-3 px-1">
                    Room Members — {membersList.length}
                  </div>
                  <div className="space-y-1.5">
                    {membersList.map((member: any, idx: number) => {
                      const mUser = member?.user || {};
                      const mName = mUser.name || member?.user_id || "Member";
                      const mImg = mUser.image || "";

                      return (
                        <div
                          key={mUser.id || member?.user_id || idx}
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-emerald-500/10 transition"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center overflow-hidden shrink-0">
                            {mImg ? (
                              <img
                                src={mImg}
                                alt={mName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              mName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-emerald-50 truncate">
                              {mName}
                            </div>
                            <div className="text-[10px] text-emerald-400/75 truncate">
                              E2EE verified
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </aside>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
