"use client";

import React, { useState } from "react";
import type { Channel } from "stream-chat";
import { encryptE2EEText } from "@/lib/e2ee";

interface CustomMessageComposerProps {
  channel: Channel;
}

export default function CustomMessageComposer({
  channel,
}: CustomMessageComposerProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const channelName =
    (channel?.data as any)?.name || channel?.id || "channel";

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !channel || sending) return;

    try {
      setSending(true);
      const cipherText = await encryptE2EEText(trimmed, channel.id || "leafsty");
           await channel.sendMessage({
        message: {
          text: cipherText,
        },
      } as any);
      setText("");
    } catch (error) {
      console.warn("Failed to send encrypted message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSend}
      className="px-4 py-3 bg-white border-t border-emerald-100"
    >
      <div className="flex items-center gap-2 rounded-2xl bg-[#f4f7f5] border border-emerald-200/80 px-4 py-2.5 focus-within:border-emerald-500 transition">
        <span
          title="End-to-End Encrypted"
          className="text-emerald-600 text-sm shrink-0"
        >
          🔒
        </span>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message #${channelName} (E2EE active)...`}
          className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
        />

        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 px-4 py-1.5 text-xs font-semibold text-white transition cursor-pointer shrink-0"
        >
          {sending ? "Encrypting..." : "Send"}
        </button>
      </div>
    </form>
  );
}
