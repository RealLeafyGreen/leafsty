"use client";

import React, { useEffect, useRef, useState } from "react";
import { Chat, useCreateChatClient } from "stream-chat-react";
import ServerList from "./ServerList";
import { CustomChannelList } from "./CustomChannelList";
import CustomMessage, { ReplyTarget } from "./MessageList/CustomMessage/CustomMessage";
import CustomMessageComposer from "./MessageList/MessageComposer/MessageComposer";
import CreateServerForm from "./CreateServerForm";
import LeafstyCallStage from "./LeafstyCallStage";
import IncomingCallBanner from "./IncomingCallBanner";
import InviteJoinModal from "./InviteJoinModal";
import LeafstyLoader from "./LeafstyLoader";
import UnreadFaviconUpdater from "./UnreadFaviconUpdater";
import UserContextMenu, { ContextTargetUser } from "./UserContextMenu";
import { DiscordContextProvider, useDiscordContext } from "../types/DiscordContext";
import { Hash, AtSign, Phone, Video, Users, Search, LogOut, UserPlus, Check } from "lucide-react";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || "mmhfdzb5evj2";

function ChatContent({ chatClient }: { chatClient: any }) {
  const { activeChannel, setActiveChannel, activeServer } = useDiscordContext() as any;
  const [, setChatRenderTick] = useState(0);

  useEffect(() => {
    const refreshChat = () => setChatRenderTick((t) => t + 1);
    window.addEventListener("leafsty:message-sent", refreshChat);
    activeChannel?.on?.("message.new", refreshChat);
    return () => {
      window.removeEventListener("leafsty:message-sent", refreshChat);
      activeChannel?.off?.("message.new", refreshChat);
    };
  }, [activeChannel]);

  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [messageSearch, setMessageSearch] = useState("");
  const [showMemberList, setShowMemberList] = useState(true);
  const [callMode, setCallMode] = useState<"voice" | "video" | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);

  const [inviteServer, setInviteServer] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("invite");
  });
  const [copiedInvite, setCopiedInvite] = useState(false);

  const [ctxUser, setCtxUser] = useState<ContextTargetUser | null>(null);
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showCreateServer =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("createServer") === "true";

  useEffect(() => {
    setCallMode(null);
    setReplyTo(null);
    setTypingUsers({});
    if (!activeChannel) {
      setMessages([]);
      return;
    }

    const syncMessages = () => {
      setMessages([...(activeChannel.state?.messages || [])]);
    };

    syncMessages();

    const subNew = activeChannel.on("message.new", syncMessages);
    const subUpd = activeChannel.on("message.updated", syncMessages);
    const subDel = activeChannel.on("message.deleted", syncMessages);
    const subReactNew = activeChannel.on("reaction.new", syncMessages);
    const subReactDel = activeChannel.on("reaction.deleted", syncMessages);

    const subTypeStart = activeChannel.on("typing.start", (e: any) => {
      const uid = e?.user?.id;
      if (!uid || uid === chatClient?.userID || e?.signalType === "webrtc") return;
      setTypingUsers((prev) => ({ ...prev, [uid]: e.user?.name || uid }));
    });

    const subTypeStop = activeChannel.on("typing.stop", (e: any) => {
      const uid = e?.user?.id;
      if (!uid) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[uid];
        return next;
      });
    });

    return () => {
      subNew?.unsubscribe?.();
      subUpd?.unsubscribe?.();
      subDel?.unsubscribe?.();
      subReactNew?.unsubscribe?.();
      subReactDel?.unsubscribe?.();
      subTypeStart?.unsubscribe?.();
      subTypeStop?.unsubscribe?.();
    };
  }, [activeChannel, chatClient?.userID]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);
  const isDM =
    String(activeChannel?.id || "").startsWith("dm-") ||
    String(activeChannel?.id || "").startsWith("!members-") ||
    Boolean((activeChannel?.data as any)?.custom?.is_dm);

  const otherDmMember = isDM
    ? (Object.values(activeChannel?.state?.members || {}) as any[]).find(
        (m: any) =>
          (m?.user_id || m?.user?.id || "").toLowerCase() !==
          (chatClient?.userID || "").toLowerCase()
      )
    : null;

  const cleanChannelName = isDM
    ? otherDmMember?.user?.name || otherDmMember?.user_id || "Direct Message"
    : (activeChannel?.data as any)?.custom?.name ||
      (activeChannel?.data as any)?.name ||
      activeChannel?.id ||
      "general";

  const currentServerName =
    activeServer?.name || (activeChannel?.data as any)?.custom?.server || "";

  const channelMembers = Object.values(activeChannel?.state?.members || {}) as any[];
  const activeTypers = Object.values(typingUsers);
  const typingBannerText =
    activeTypers.length === 1
      ? `${activeTypers} is typing...`
      : activeTypers.length > 1
      ? `${activeTypers.join(", ")} are typing...`
      : "";

  const startQuickDM = async (targetUserId: string) => {
    if (!chatClient?.userID || !targetUserId || targetUserId === chatClient.userID) return;
    const pair = [chatClient.userID.toLowerCase(), targetUserId.toLowerCase()].sort();
    const dmChannel = chatClient.channel("messaging", `dm-${pair.join("-")}`, {
      members: [chatClient.userID, targetUserId],
      custom: { is_dm: true },
    });
    await dmChannel.watch();
    setActiveChannel?.(dmChannel);
  };

  const handleLogout = () => {
    localStorage.removeItem("stream_user");
    localStorage.removeItem("stream_token");
    window.location.href = "/";
  };

  if (showCreateServer) {
    return (
      <CreateServerForm
        onClose={() => {
          window.history.replaceState({}, "", "/");
          window.location.reload();
        }}
      />
    );
  }
  return (
    <section className="flex h-screen w-screen overflow-hidden bg-[#f6faf8] text-zinc-900">
      <ServerList />
      <CustomChannelList />

      <div className="flex-1 flex h-full min-w-0">
        {activeChannel ? (
          <>
            <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
              <header className="h-14 px-4 border-b border-emerald-100 flex items-center justify-between gap-3 bg-white shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                    {isDM ? <AtSign className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                  </span>
                  <h2 className="font-extrabold text-sm text-zinc-900 truncate">
                    {cleanChannelName}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!isDM && currentServerName && (
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/?invite=${encodeURIComponent(currentServerName)}`;
                        navigator.clipboard?.writeText(url);
                        setCopiedInvite(true);
                        setTimeout(() => setCopiedInvite(false), 2000);
                      }}
                      title="Copy Shareable Server Invite Link"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-extrabold transition cursor-pointer"
                    >
                      {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      <span>{copiedInvite ? "Copied!" : "Invite"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setCallMode(callMode === "voice" ? null : "voice")}
                    title="Voice Call"
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      callMode === "voice"
                        ? "bg-emerald-600 text-white"
                        : "text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCallMode(callMode === "video" ? null : "video")}
                    title="Video Call"
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      callMode === "video"
                        ? "bg-emerald-600 text-white"
                        : "text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    <Video className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMemberList((s) => !s)}
                    title="Toggle Members"
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      showMemberList
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-zinc-500 hover:bg-zinc-100"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-[#f3f8f5] border border-emerald-100 px-2.5 py-1.5">
                    <Search className="w-3.5 h-3.5 text-zinc-400" />
                    <input
                      type="text"
                      value={messageSearch}
                      onChange={(e) => setMessageSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-28 bg-transparent text-xs outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </header>

              {callMode ? (
                <LeafstyCallStage
                  channel={activeChannel}
                  currentUserId={chatClient?.userID || "user"}
                  currentUserImage={chatClient?.user?.image || ""}
                  peerName={isDM ? cleanChannelName : undefined}
                  peerImage={otherDmMember?.user?.image || ""}
                  roomLabel={isDM ? `@ ${cleanChannelName}` : `# ${cleanChannelName}`}
                  startWithVideo={callMode === "video"}
                  onLeave={() => setCallMode(null)}
                />
              ) : (
                <>
                              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {messages.map((msg: any) => (
                <CustomMessage
                  key={msg.id}
                  message={msg}
                  onReply={setReplyTo}
                />
              ))}
            </div>

                  {typingBannerText && (
                    <div className="px-5 py-1.5 bg-white border-t border-emerald-50 flex items-center gap-2 text-xs font-semibold text-emerald-700 shrink-0">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                      </span>
                      <span>{typingBannerText}</span>
                    </div>
                  )}

                 <CustomMessageComposer
  replyTarget={replyTo}
  onCancelReply={() => setReplyTo(null)}
/>
                </>
              )}
            </div>
            {showMemberList && (
              <aside className="hidden lg:flex w-60 h-full bg-[#f3f8f5] border-l border-emerald-100 flex-col p-3 overflow-y-auto shrink-0 select-none">
                <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-900/60">
                  Room Members — {channelMembers.length}
                </div>
                <div className="space-y-1 mt-1">
                  {channelMembers.map((member: any) => {
                    const u = member.user || {};
                    const uid = member.user_id || u.id || "member";
                    const displayName = u.name || uid;
                    return (
                      <button
                        key={uid}
                        type="button"
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setCtxUser({ id: uid, name: displayName, image: u.image });
                          setCtxPos({ x: e.clientX, y: e.clientY });
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-emerald-100/70 transition text-left cursor-pointer"
                      >
                        {u.image ? (
                          <img src={u.image} alt={displayName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-zinc-800 truncate">{displayName}</div>
                          <div className="text-[10px] text-emerald-700 truncate">
                            {typingUsers[uid] ? "Typing..." : u.custom?.status || "E2EE Verified"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#f6faf8] via-white to-[#eef6f2]">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md mb-4">
              L
            </div>
            <h2 className="text-xl font-extrabold text-zinc-900 mb-1.5">
              {activeServer?.name ? `Welcome to ${activeServer.name}` : "Your Leafsty Space"}
            </h2>
            <p className="text-sm text-zinc-500 max-w-sm">
              Pick a channel or DM from the sidebar to start chatting.
            </p>
          </div>
        )}
      </div>

      <UserContextMenu
        user={ctxUser}
        position={ctxPos}
        onClose={() => { setCtxUser(null); setCtxPos(null); }}
        onViewProfile={(u) => alert(`${u.name} (@${u.id}) • E2EE Verified`)}
        onMention={(u) => navigator.clipboard?.writeText(`@${u.id} `)}
        onMessage={(u) => startQuickDM(u.id)}
        onPoke={(u) => alert(`🌿 You sent a Leaf Poke to ${u.name}!`)}
      />

      <IncomingCallBanner
        currentUserId={chatClient?.userID || "user"}
        activeCallChannelId={callMode ? activeChannel?.id : null}
        onAccept={async (alert) => {
          const ch = chatClient?.channel("messaging", alert.channelId);
          if (ch) {
            await ch.watch();
            setActiveChannel?.(ch);
            setCallMode(alert.withVideo ? "video" : "voice");
          }
        }}
      />

      {inviteServer && chatClient?.userID && (
        <InviteJoinModal
          serverName={inviteServer}
          userId={chatClient.userID}
          onDismiss={() => {
            setInviteServer(null);
            window.history.replaceState({}, "", "/");
          }}
          onJoined={async (channelId) => {
            setInviteServer(null);
            window.history.replaceState({}, "", "/");
            if (channelId) {
              const ch = chatClient.channel("messaging", channelId);
              await ch.watch();
              setActiveChannel?.(ch);
            }
            window.location.reload();
          }}
        />
      )}
    </section>
  );
}

export default function MyChat() {
  const { user, token } = React.useMemo(() => {
    if (typeof window === "undefined") return { user: undefined, token: "" };
    const rawUser = localStorage.getItem("stream_user");
    return {
      user: rawUser ? JSON.parse(rawUser) : undefined,
      token: localStorage.getItem("stream_token") || "",
    };
  }, []);

  const [minDelayDone, setMinDelayDone] = useState(() => {
    if (typeof window === "undefined") return false;
    const prefs = JSON.parse(localStorage.getItem("leafsty_app_prefs") || "{}");
    return prefs.loadingAnimation === false;
  });

  useEffect(() => {
    if (minDelayDone) return;
    const timer = setTimeout(() => setMinDelayDone(true), 1800);
    return () => clearTimeout(timer);
  }, [minDelayDone]);

  const chatClient = useCreateChatClient({ apiKey, tokenOrProvider: token, userData: user });

  if (!chatClient || !minDelayDone) {
    return <LeafstyLoader src="/loadingLeafsty.mp4" label="Connecting to Leafsty..." loop={false} />;
  }

  return (
    <DiscordContextProvider>
      <Chat client={chatClient}>
        <UnreadFaviconUpdater baseIconSrc="/logo-hover.png" baseTitle="Leafsty" />
        <ChatContent chatClient={chatClient} />
      </Chat>
    </DiscordContextProvider>
  );
}
