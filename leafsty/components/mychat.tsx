"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Chat,
  Channel,
  LoadingIndicator,
  useCreateChatClient,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";

import { useDiscordContext } from "../types/DiscordContext";
import ServerList from "./ServerList";
import { CustomChannelList } from "./CustomChannelList";
import CreateServerForm from "./CreateServerForm";
import CustomMessageComposer from "./MessageList/MessageComposer/MessageComposer";
import CustomMessage from "./MessageList/CustomMessage/CustomMessage";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

function ChatContent({ chatClient }: { chatClient: any }) {
  const { activeServer, activeChannel } = useDiscordContext() as any;
  const searchParams = useSearchParams();
  const router = useRouter();
  const showCreateServer = searchParams.get("createServer") === "true";

  const [messages, setMessages] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeChannel) {
      setMessages([]);
      return;
    }

    let isMounted = true;

    const initMessages = async () => {
      try {
        const res = (await activeChannel.watch()) as any;
        const state = activeChannel.state as any;
        const initialList =
          res?.messages || state?.messages || state?.latestMessages || [];

        if (isMounted) {
          setMessages([...initialList]);
        }
      } catch (err) {
        console.error("Failed to load channel messages:", err);
      }
    };

    initMessages();

    const handleNewMessage = (event: any) => {
      if (!event?.message) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === event.message.id)) return prev;
        return [...prev, event.message];
      });
    };

    const subNew = activeChannel.on("message.new", handleNewMessage);

    return () => {
      isMounted = false;
      subNew.unsubscribe();
    };
  }, [activeChannel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("stream_user");
      localStorage.removeItem("stream_token");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      await chatClient?.disconnectUser();
    } catch (error) {
      console.error("Error disconnecting user:", error);
    } finally {
      window.location.replace("/");
    }
  };

  const activeCustom =
    activeChannel?.custom ||
    activeChannel?.data?.custom ||
    activeChannel?.data ||
    {};
  const cleanChannelName =
    activeCustom.name ||
    activeChannel?.data?.name ||
    activeChannel?.name ||
    activeChannel?.id;

  return (
    <section className="flex h-screen w-screen overflow-hidden bg-[#f4f8f6] text-zinc-900 relative">
      <ServerList />
      <CustomChannelList />

      {showCreateServer && (
        <CreateServerForm
          onClose={() => {
            router.replace("/");
          }}
        />
      )}

      {activeChannel ? (
        <Channel channel={activeChannel}>
          <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
            {/* Original Leafsty Top Header */}
            <header className="h-14 px-6 border-b border-emerald-100 bg-white/90 backdrop-blur flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm flex items-center justify-center">
                  #
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-zinc-900 truncate">
                    {cleanChannelName}
                  </h2>
                  {activeServer?.name && (
                    <p className="text-[11px] text-emerald-700 font-medium truncate">
                      {activeServer.name} &bull; AES-256 Encrypted
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  E2EE Verified
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-zinc-200 hover:border-red-200 hover:bg-red-50 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-red-600 transition cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </header>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 bg-gradient-to-b from-[#fafdfb] to-white">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold mb-3">
                    #
                  </div>
                  <h3 className="text-base font-bold text-zinc-800 mb-1">
                    Welcome to #{cleanChannelName}
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-xs">
                    Messages in this channel are encrypted end-to-end before
                    leaving your browser.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <CustomMessage
                    key={msg.id}
                    msg={msg}
                    isMine={msg.user?.id === chatClient?.userID}
                  />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <CustomMessageComposer channel={activeChannel} />
          </div>
        </Channel>
      ) : (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-[#f6faf8] via-white to-[#eef6f2] relative">
          <div className="h-14 px-6 border-b border-emerald-100/80 flex items-center justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-zinc-200 hover:border-red-200 hover:bg-red-50 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-red-600 transition cursor-pointer"
            >
              Log Out
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-emerald-600/20 mb-4">
              L
            </div>
            <h2 className="text-xl font-extrabold text-zinc-900 mb-1.5">
              {activeServer?.name
                ? `Welcome to ${activeServer.name}`
                : "Your Leafsty Space"}
            </h2>
            <p className="text-sm text-zinc-500 max-w-sm">
              Pick a text channel from the left sidebar or click{" "}
              <span className="font-bold text-emerald-700">+</span> to start a
              new encrypted room.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default function MyChat() {
  const { user, token } = React.useMemo(() => {
    if (typeof window === "undefined") {
      return { user: undefined, token: "" };
    }
    const rawUser = localStorage.getItem("stream_user");
    const rawToken = localStorage.getItem("stream_token") || "";
    return {
      user: rawUser ? JSON.parse(rawUser) : undefined,
      token: rawToken,
    };
  }, []);

  const chatClient = useCreateChatClient({
    apiKey,
    userData: user,
    tokenOrProvider: token,
  });

  if (!chatClient) {
    return <LoadingIndicator />;
  }

  return (
    <Chat client={chatClient} theme="str-chat__theme-light">
      <ChatContent chatClient={chatClient} />
    </Chat>
  );
}
