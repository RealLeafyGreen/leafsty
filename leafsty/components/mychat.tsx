"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Chat,
  Channel,
  ChannelHeader,
  LoadingIndicator,
  useCreateChatClient,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";

import { useDiscordContext } from "../types/DiscordContext";
import ServerList from "./ServerList";
import { CustomChannelList } from "./ChannelList/CustomChannelList";
import CreateServerForm from "./CreateServerForm";
import CustomMessageComposer from "./MessageList/MessageComposer/MessageComposer";
import CustomMessage from "./MessageList/CustomMessage/CustomMessage";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

function ChatContent({ chatClient }: { chatClient: any }) {
  const { activeChannel } = useDiscordContext();
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
          res?.messages ||
          state?.messages ||
          state?.latestMessages ||
                  
          res?.messages ||
          state?.messages ||
          state?.latestMessages ||
          [];

          [];

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

  return (
    <section className="flex h-screen w-screen overflow-hidden relative">
      <button
        type="button"
        onClick={handleLogout}
        className="fixed top-3 right-4 z-50 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-700 cursor-pointer"
      >
        Log Out
      </button>

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
            <ChannelHeader />

            <div className="flex-1 overflow-y-auto py-4 space-y-1">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-zinc-400">
                  No messages yet. Say hello with end-to-end encryption!
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
        <div className="flex-1 flex flex-col items-center justify-center bg-white text-zinc-500 p-6 text-center">
          <h2 className="text-lg font-semibold text-zinc-800 mb-1">
            No Channel Selected
          </h2>
          <p className="text-sm max-w-sm">
            Click a channel on the left or click the{" "}
            <span className="font-bold text-emerald-600">+</span> button to
            create your first server and channel.
          </p>
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
