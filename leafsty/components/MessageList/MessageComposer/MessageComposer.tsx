"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Search,
} from "lucide-react";

type EmojiCategory =
  | "Recent"
  | "Smileys"
  | "People"
  | "Nature"
  | "Food"
  | "Activities"
  | "Objects"
  | "Symbols"
  | "Flags";

function expandRanges(ranges: Array<[number, number]>): string[] {
  const out: string[] = [];
  for (const [start, end] of ranges) {
    for (let cp = start; cp <= end; cp++) {
      try {
        out.push(String.fromCodePoint(cp));
      } catch {}
    }
  }
  return out;
}

function buildFlagEmojis(): string[] {
  const codes = [
    "AU", "US", "GB", "CA", "NZ", "JP", "KR", "DE", "FR", "BR",
    "IN", "IT", "ES", "MX", "SE", "NO", "FI", "NL", "CH", "SG",
    "PH", "ID", "TH", "VN", "AR", "CL", "CO", "ZA", "EG", "TR",
  ];
  return codes.map((iso) =>
    String.fromCodePoint(
      0x1f1e6 + (iso.charCodeAt(0) - 65),
      0x1f1e6 + (iso.charCodeAt(1) - 65)
    )
  );
}

const UNICODE_LIBRARY: Record<Exclude<EmojiCategory, "Recent">, string[]> = {
  Smileys: expandRanges([
    [0x1f600, 0x1f644],
    [0x1f910, 0x1f92f],
    [0x1f970, 0x1f97a],
    [0x1fae0, 0x1fae8],
  ]),
  People: expandRanges([
    [0x1f446, 0x1f450],
    [0x1f466, 0x1f487],
    [0x1f90c, 0x1f90f],
    [0x1f918, 0x1f91f],
    [0x1f9b8, 0x1f9df],
  ]),
  Nature: expandRanges([
    [0x1f331, 0x1f343],
    [0x1f319, 0x1f320],
    [0x1f400, 0x1f43e],
    [0x1f980, 0x1f9ae],
  ]),
  Food: expandRanges([
    [0x1f345, 0x1f37f],
    [0x1f950, 0x1f96f],
    [0x1f9c0, 0x1f9cb],
  ]),
  Activities: expandRanges([
    [0x1f380, 0x1f393],
    [0x1f3a0, 0x1f3ca],
    [0x1f3c0, 0x1f3c9],
    [0x1f947, 0x1f94f],
  ]),
  Objects: expandRanges([
    [0x1f4a0, 0x1f4ff],
    [0x1f50a, 0x1f52e],
    [0x1f680, 0x1f6a4],
    [0x1f9f0, 0x1f9ff],
  ]),
  Symbols: expandRanges([
    [0x2600, 0x2604],
    [0x2614, 0x2615],
    [0x2660, 0x2668],
    [0x2702, 0x2728],
    [0x2764, 0x2764],
    [0x1f493, 0x1f49f],
  ]),
  Flags: buildFlagEmojis(),
};

const RECENT_EMOJIS_KEY = "leafsty_recent_emojis";

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
  const [emojiSearch, setEmojiSearch] = useState("");
  const [emojiTab, setEmojiTab] = useState<EmojiCategory>("Smileys");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([
    "🌿",
    "😂",
    "🔥",
    "👍",
    "💚",
    "👀",
    "💀",
    "🥳",
  ]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(RECENT_EMOJIS_KEY) || "null"
      );
      if (Array.isArray(saved) && saved.length > 0) {
        setRecentEmojis(saved);
      }
    } catch {}
  }, []);
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
    setRecentEmojis((prev) => {
      const next = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 24);
      try {
        localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    inputRef.current?.focus();
  };

  const displayedEmojis = useMemo(() => {
    const q = emojiSearch.trim();
    if (q) {
      const all = Object.values(UNICODE_LIBRARY).flat();
      return all.filter((e) => e.includes(q));
    }
    if (emojiTab === "Recent") return recentEmojis;
    return UNICODE_LIBRARY[emojiTab] || [];
  }, [emojiSearch, emojiTab, recentEmojis]);

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
        <div className="absolute bottom-full right-14 mb-2 z-40 w-80 sm:w-96 rounded-2xl bg-[#081914] border border-emerald-500/25 shadow-2xl overflow-hidden">
          <div className="p-2.5 bg-[#061410] border-b border-emerald-500/15 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-emerald-400/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                  placeholder="Paste or filter Unicode emoji..."
                  className="w-full pl-8 pr-6 py-1 rounded-lg bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/45 focus:outline-none focus:border-emerald-400"
                />
                {emojiSearch && (
                  <button
                    type="button"
                    onClick={() => setEmojiSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-300/60 hover:text-emerald-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="p-1 rounded-lg text-emerald-300/60 hover:text-emerald-50 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {(
                [
                  "Recent",
                  "Smileys",
                  "People",
                  "Nature",
                  "Food",
                  "Activities",
                  "Objects",
                  "Symbols",
                  "Flags",
                ] as EmojiCategory[]
              ).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setEmojiSearch("");
                    setEmojiTab(tab);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                    emojiTab === tab && !emojiSearch
                      ? "bg-emerald-600 text-white"
                      : "text-emerald-300/70 hover:text-emerald-50 hover:bg-emerald-500/15"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2.5 h-56 overflow-y-auto grid grid-cols-8 gap-1 content-start">
            {displayedEmojis.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className="text-xl p-1 rounded-lg hover:bg-emerald-500/20 hover:scale-110 transition cursor-pointer flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="px-3 py-1.5 bg-[#04120e] border-t border-emerald-500/15 text-[10px] text-emerald-400/70 flex items-center justify-between">
            <span>{displayedEmojis.length} Unicode emojis</span>
            <span>Click to insert</span>
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
          title="GIFs & Favorites"
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
            title="Unicode Emojis"
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
