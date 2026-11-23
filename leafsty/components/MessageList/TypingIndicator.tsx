"use client";

import React, { useEffect, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../../types/DiscordContext";

interface TypingUser {
  id: string;
  name: string;
}

export default function TypingIndicator() {
  const { client } = useChatContext();
  const discordCtx = useDiscordContext() as any;
  const channel = discordCtx?.activeChannel || null;

  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    setTypingUsers([]);
    if (!channel || typeof channel.on !== "function") return;

    const currentUserId = String(
      client?.userID || (client?.user as any)?.id || ""
    );

    const handleTypingStart = (event: any) => {
      const user = event?.user;
      const uid = String(user?.id || "");
      if (!uid || uid === currentUserId) return;

      const displayName = user?.name || uid;
      setTypingUsers((prev) => {
        if (prev.some((u) => u.id === uid)) return prev;
        return [...prev, { id: uid, name: displayName }];
      });
    };

    const handleTypingStop = (event: any) => {
      const uid = String(event?.user?.id || "");
      if (!uid) return;
      setTypingUsers((prev) => prev.filter((u) => u.id !== uid));
    };

    const subStart = channel.on("typing.start", handleTypingStart);
    const subStop = channel.on("typing.stop", handleTypingStop);

    return () => {
      subStart?.unsubscribe?.();
      subStop?.unsubscribe?.();
    };
  }, [channel?.cid, client]);

  if (typingUsers.length === 0) {
    return <div className="h-5 shrink-0 bg-[#081914]" />;
  }

  const label =
    typingUsers.length === 1
      ? `${typingUsers.at(0)?.name} is typing`
      : typingUsers.length === 2
      ? `${typingUsers.at(0)?.name} and ${typingUsers.at(1)?.name} are typing`
      : `${typingUsers.at(0)?.name}, ${typingUsers.at(1)?.name}, and ${
          typingUsers.length - 2
        } more are typing`;

  return (
    <div className="h-5 px-4 shrink-0 bg-[#081914] flex items-center gap-2 text-[11px] text-emerald-300/85 select-none">
      <span className="inline-flex items-center gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
      </span>
      <span className="font-semibold truncate">{label}...</span>
    </div>
  );
}
