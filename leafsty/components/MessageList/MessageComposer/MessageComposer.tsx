"use client";

import React, { useRef, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../../../types/DiscordContext";
import { ReplyTarget } from "../CustomMessage/CustomMessage";
import KlipyGifPicker, { KlipyGifItem } from "./KlipyGifPicker";
import {
  Send,
  X,
  Lock,
  CornerUpLeft,
  Image as ImageIcon,
} from "lucide-react";

export interface CustomMessageComposerProps {
  replyTarget?: ReplyTarget | null;
  onCancelReply?: () => void;
}

export default function CustomMessageComposer({
  replyTarget,
  onCancelReply,
}: CustomMessageComposerProps) {
  const { client } = useChatContext();
  const discordCtx = useDiscordContext() as any;
  const channel = discordCtx?.activeChannel || null;

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sendPayload = async (
    rawText: string,
    attachments: any[] = []
  ) => {
    const trimmed = rawText.trim();
    if ((!trimmed && attachments.length === 0) || !channel || !client || sending) return;

    const currentUserId = String(
      client?.userID || (client?.user as any)?.id || ""
    );

    try {
      setSending(true);
      setSendError(null);

      const liveChannel = client.channel(
        channel.type || "messaging",
        channel.id
      );

      let sent = false;
      try {
               const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelType: liveChannel.type || "messaging",
            channelId: liveChannel.id,
            userId: currentUserId,
            text: trimmed || (attachments.length > 0 ? "GIF" : ""),
            attachments,
            parent_id: replyTarget?.id || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && (data?.message || data?.ok)) {
          sent = true;
        }
      } catch {}

      if (!sent) {
        const innerMessage: any = {
          text: trimmed || "GIF",
          attachments: Array.isArray(attachments) ? attachments : [],
        };
        if (replyTarget?.id) {
          innerMessage.parent_id = replyTarget.id;
          innerMessage.quoted_message_id = replyTarget.id;
        }
        try {
          await (liveChannel as any).sendMessage({ message: innerMessage });
        } catch {
          await (liveChannel as any).sendMessage(innerMessage);
        }
      }

      await liveChannel.watch({ state: true });
      discordCtx?.setActiveChannel?.(liveChannel);
      window.dispatchEvent(new Event("leafsty:message-sent"));

      setText("");
      onCancelReply?.();
      inputRef.current?.focus();
    } catch (err: any) {
      console.error("Failed to send message:", err);
      setSendError(err?.message || "Could not send message");
    } finally {
      setSending(false);
    }
  };


  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendPayload(text);
  };

  const handleSelectGif = async (gif: KlipyGifItem) => {
    setShowGifPicker(false);
    await sendPayload("", [
      {
        type: "image",
        image_url: gif.fullUrl,
        thumb_url: gif.previewUrl || gif.fullUrl,
        title: gif.title || "GIF",
      },
    ]);
  };

  const channelLabel =
    (channel?.data as any)?.name || channel?.id || "encrypted chat";
  return (
    <div className="relative shrink-0 bg-[#081914] border-t border-emerald-500/15 px-4 py-3 text-emerald-50">
      {showGifPicker && (
        <div className="absolute bottom-full right-4 mb-2 z-40">
          <KlipyGifPicker
            onSelectGif={handleSelectGif}
            onClose={() => setShowGifPicker(false)}
          />
        </div>
      )}

      {sendError && (
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-between text-xs text-red-300">
          <span>{sendError}</span>
          <button
            type="button"
            onClick={() => setSendError(null)}
            className="p-0.5 text-red-300 hover:text-red-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {replyTarget && (
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-[#0d261e] border border-emerald-500/20 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <CornerUpLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-emerald-300/80 shrink-0">
              Replying to{" "}
              <strong className="text-emerald-100">
                {replyTarget.userName || "message"}
              </strong>
              :
            </span>
            <span className="text-emerald-200/70 truncate">
              {replyTarget.text}
            </span>
          </div>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="p-0.5 rounded text-emerald-300/60 hover:text-emerald-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowGifPicker((v) => !v)}
          title="Send Klipy GIF"
          className={`px-2.5 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1 transition cursor-pointer shrink-0 ${
            showGifPicker
              ? "bg-emerald-500/25 border-emerald-400 text-emerald-100"
              : "bg-[#0d261e] border-emerald-500/25 text-emerald-300 hover:text-emerald-50 hover:border-emerald-400/50"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>GIF</span>
        </button>

        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message ${channelLabel} (E2EE)...`}
            disabled={sending}
            className="w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50 placeholder:text-emerald-300/45 focus:outline-none focus:border-emerald-400 disabled:opacity-60"
          />
          <Lock className="w-3.5 h-3.5 text-emerald-400/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <button
          type="submit"
          disabled={sending || !text.trim()}
          title="Send Encrypted Message"
          className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition cursor-pointer shrink-0 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
