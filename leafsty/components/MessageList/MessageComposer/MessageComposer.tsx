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
  Smile,
} from "lucide-react";

const UNICODE_EMOJI_GROUPS: Record<string, string[]> = {
  "Smileys & Vibes": [
    "😀", "😂", "🥹", "😍", "😎", "🥳", "🤔", "😴",
    "😭", "😱", "🤯", "🥶", "🥵", "🤡", "👻", "💀",
  ],
  "Hands & Reactions": [
    "👍", "👎", "👏", "🙌", "🤝", "✌️", "🤞", "🫶",
    "👋", "🫡", "💪", "🙏", "👀", "💯", "🔥", "⚡",
  ],
  "Leafsty & Nature": [
    "🌿", "🍃", "🌱", "🌲", "🍀", "🌵", "🌸", "🌙",
    "⭐", "✨", "🌈", "☀️", "🌊", "🪐", "🍄", "🦋",
  ],
  "Gaming & Objects": [
    "🎮", "🕹️", "🎧", "🎵", "🎬", "💻", "🔒", "🔑",
    "🚀", "💎", "🏆", "🎯", "🎲", "🍕", "☕", "🧋",
  ],
};

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
  const [sendError, setSendError] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiTab, setEmojiTab] = useState("Smileys & Vibes");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sendPayload = async (
    rawText: string,
    attachments: any[] = []
  ) => {
    const trimmed = rawText.trim();
    if ((!trimmed && attachments.length === 0) || !channel) return;

    const currentUserId = String(
      client?.userID || (client?.user as any)?.id || ""
    );

    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const optimisticMsg = {
      id: tempId,
      text: trimmed,
      attachments,
      type: "regular",
      cid: channel.cid || `${channel.type || "messaging"}:${channel.id}`,
      user: {
        id: currentUserId,
        name: (client?.user as any)?.name || currentUserId,
        image: (client?.user as any)?.image,
      },
      created_at: nowIso,
    };

    window.dispatchEvent(
      new CustomEvent("leafsty:message-sent", { detail: optimisticMsg })
    );
    setText("");
    setSendError(null);
    channel.stopTyping?.().catch(() => {});
    const savedReplyId = replyTarget?.id;
    onCancelReply?.();
    inputRef.current?.focus();

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelType: channel.type || "messaging",
          channelId: channel.id,
          userId: currentUserId,
          text: trimmed,
          attachments,
          parent_id: savedReplyId || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Send failed (${res.status})`);
      }

        if (data?.message) {
        window.dispatchEvent(
          new CustomEvent("leafsty:message-sent", {
            detail: { ...data.message, _replaceId: tempId },
          })
        );
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);
      setSendError(err?.message || "Could not send message");
    }
  };
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowEmojiPicker(false);
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

  const handleInsertEmoji = (emoji: string) => {
    setText((prev) => `${prev}${emoji}`);
    inputRef.current?.focus();
  };

  const channelLabel =
    (channel?.data as any)?.name || channel?.id || "encrypted chat";
  return (
    <div className="relative shrink-0 bg-[#081914] border-t border-emerald-500/15 px-4 py-3 text-emerald-50">
      {showGifPicker && (
        <div className="absolute bottom-full left-4 mb-2 z-40">
          <KlipyGifPicker
            onSelectGif={handleSelectGif}
            onClose={() => setShowGifPicker(false)}
          />
        </div>
      )}

      {showEmojiPicker && (
        <div className="absolute bottom-full right-14 mb-2 z-40 w-72 rounded-2xl bg-[#081914] border border-emerald-500/25 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-2.5 py-2 bg-[#061410] border-b border-emerald-500/15">
            <div className="flex items-center gap-1 overflow-x-auto">
              {Object.keys(UNICODE_EMOJI_GROUPS).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setEmojiTab(tab)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                    emojiTab === tab
                      ? "bg-emerald-600 text-white"
                      : "text-emerald-300/70 hover:text-emerald-50 hover:bg-emerald-500/15"
                  }`}
                >
                  {tab.split(" ")}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(false)}
              className="p-1 text-emerald-300/60 hover:text-emerald-50 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2.5 grid grid-cols-8 gap-1">
            {(UNICODE_EMOJI_GROUPS[emojiTab] || []).map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className="text-lg p-1 rounded-lg hover:bg-emerald-500/20 hover:scale-110 transition cursor-pointer flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
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
          onClick={() => {
            setShowEmojiPicker(false);
            setShowGifPicker((v) => !v);
          }}
          title="Send GIF"
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
            onChange={(e) => {
              const val = e.target.value;
              setText(val);
              if (val.trim()) {
                channel?.keystroke?.().catch(() => {});
              } else {
                channel?.stopTyping?.().catch(() => {});
              }
            }}
            placeholder={`Message ${channelLabel} (E2EE)...`}
            className="w-full pl-3.5 pr-16 py-2.5 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50 placeholder:text-emerald-300/45 focus:outline-none focus:border-emerald-400"
          />

          <button
            type="button"
            onClick={() => {
              setShowGifPicker(false);
              setShowEmojiPicker((v) => !v);
            }}
            title="Insert Emoji"
            className="p-1.5 rounded-lg text-emerald-300/70 hover:text-emerald-50 hover:bg-emerald-500/15 absolute right-8 top-1/2 -translate-y-1/2 transition cursor-pointer"
          >
            <Smile className="w-4 h-4" />
          </button>

          <Lock className="w-3.5 h-3.5 text-emerald-400/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <button
          type="submit"
          disabled={!text.trim()}
          title="Send Encrypted Message"
          className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition cursor-pointer shrink-0 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}