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

interface EmojiEntry {
  char: string;
  name: string;
  shortcode: string;
  cat: "Smileys" | "Hands" | "Nature" | "Food" | "Objects" | "Symbols";
  skinTones?: boolean;
}

const EMOJI_SET: EmojiEntry[] = [
  { char: "😀", name: "grinning face smile happy", shortcode: "grinning", cat: "Smileys" },
  { char: "😂", name: "joy laugh tears lol", shortcode: "joy", cat: "Smileys" },
  { char: "🤣", name: "rofl rolling laughing", shortcode: "rofl", cat: "Smileys" },
  { char: "🥹", name: "holding back tears proud", shortcode: "holding_back_tears", cat: "Smileys" },
  { char: "😊", name: "blush smiling happy", shortcode: "blush", cat: "Smileys" },
  { char: "😍", name: "heart eyes love", shortcode: "heart_eyes", cat: "Smileys" },
  { char: "🥰", name: "smiling hearts love", shortcode: "smiling_hearts", cat: "Smileys" },
  { char: "😎", name: "sunglasses cool", shortcode: "sunglasses", cat: "Smileys" },
  { char: "🥳", name: "partying celebrate birthday", shortcode: "partying_face", cat: "Smileys" },
  { char: "🤔", name: "thinking hmm", shortcode: "thinking", cat: "Smileys" },
  { char: "😴", name: "sleeping tired zzz", shortcode: "sleeping", cat: "Smileys" },
  { char: "😭", name: "sob crying sad", shortcode: "sob", cat: "Smileys" },
  { char: "😱", name: "scream shocked", shortcode: "scream", cat: "Smileys" },
  { char: "🤯", name: "exploding head mind blown", shortcode: "exploding_head", cat: "Smileys" },
  { char: "🥶", name: "cold freezing", shortcode: "cold_face", cat: "Smileys" },
  { char: "🥵", name: "hot sweating", shortcode: "hot_face", cat: "Smileys" },
  { char: "🫠", name: "melting face", shortcode: "melting_face", cat: "Smileys" },
  { char: "🫡", name: "saluting face respect", shortcode: "saluting_face", cat: "Smileys" },
  { char: "🤡", name: "clown", shortcode: "clown", cat: "Smileys" },
  { char: "👻", name: "ghost spooky", shortcode: "ghost", cat: "Smileys" },
  { char: "💀", name: "skull dead", shortcode: "skull", cat: "Smileys" },
  { char: "👍", name: "thumbs up like yes", shortcode: "thumbsup", cat: "Hands", skinTones: true },
  { char: "👎", name: "thumbs down dislike no", shortcode: "thumbsdown", cat: "Hands", skinTones: true },
  { char: "👏", name: "clap applause", shortcode: "clap", cat: "Hands", skinTones: true },
  { char: "🙌", name: "raised hands hooray", shortcode: "raised_hands", cat: "Hands", skinTones: true },
  { char: "🤝", name: "handshake deal", shortcode: "handshake", cat: "Hands" },
  { char: "✌️", name: "peace victory", shortcode: "v", cat: "Hands", skinTones: true },
  { char: "🤞", name: "crossed fingers luck", shortcode: "crossed_fingers", cat: "Hands", skinTones: true },
  { char: "🫶", name: "heart hands love", shortcode: "heart_hands", cat: "Hands", skinTones: true },
  { char: "👋", name: "wave hello hi bye", shortcode: "wave", cat: "Hands", skinTones: true },
  { char: "💪", name: "muscle strong flex", shortcode: "muscle", cat: "Hands", skinTones: true },
  { char: "🙏", name: "pray please thanks", shortcode: "pray", cat: "Hands", skinTones: true },
  { char: "👀", name: "eyes look watching", shortcode: "eyes", cat: "Hands" },
  { char: "🌿", name: "herb leaf green leafsty", shortcode: "herb", cat: "Nature" },
  { char: "🍃", name: "leaves wind flutter", shortcode: "leaves", cat: "Nature" },
  { char: "🌱", name: "seedling sprout plant", shortcode: "seedling", cat: "Nature" },
  { char: "🌲", name: "evergreen pine tree", shortcode: "evergreen_tree", cat: "Nature" },
  { char: "🍀", name: "four leaf clover lucky", shortcode: "four_leaf_clover", cat: "Nature" },
  { char: "🐱", name: "cat kitty", shortcode: "cat", cat: "Nature" },
  { char: "🐶", name: "dog puppy", shortcode: "dog", cat: "Nature" },
  { char: "🦊", name: "fox", shortcode: "fox", cat: "Nature" },
  { char: "🐸", name: "frog", shortcode: "frog", cat: "Nature" },
  { char: "🌙", name: "moon night", shortcode: "crescent_moon", cat: "Nature" },
  { char: "⭐", name: "star", shortcode: "star", cat: "Nature" },
  { char: "✨", name: "sparkles magic shine", shortcode: "sparkles", cat: "Nature" },
  { char: "🔥", name: "fire flame lit", shortcode: "fire", cat: "Nature" },
  { char: "🥬", name: "leafy green kale", shortcode: "leafy_green", cat: "Food" },
  { char: "🍕", name: "pizza", shortcode: "pizza", cat: "Food" },
  { char: "🍔", name: "hamburger burger", shortcode: "hamburger", cat: "Food" },
  { char: "🍣", name: "sushi", shortcode: "sushi", cat: "Food" },
  { char: "🍩", name: "donut doughnut", shortcode: "doughnut", cat: "Food" },
  { char: "☕", name: "coffee hot", shortcode: "coffee", cat: "Food" },
  { char: "🧋", name: "bubble tea boba", shortcode: "bubble_tea", cat: "Food" },
  { char: "🎮", name: "video game controller", shortcode: "video_game", cat: "Objects" },
  { char: "🎧", name: "headphones music", shortcode: "headphones", cat: "Objects" },
  { char: "🏆", name: "trophy winner", shortcode: "trophy", cat: "Objects" },
  { char: "🎉", name: "party popper tada", shortcode: "tada", cat: "Objects" },
  { char: "💻", name: "laptop computer code", shortcode: "computer", cat: "Objects" },
  { char: "🔒", name: "lock encrypted secure", shortcode: "lock", cat: "Objects" },
  { char: "🚀", name: "rocket launch", shortcode: "rocket", cat: "Objects" },
  { char: "💎", name: "gem diamond", shortcode: "gem", cat: "Objects" },
  { char: "❤️", name: "red heart love", shortcode: "heart", cat: "Symbols" },
  { char: "💚", name: "green heart leafsty", shortcode: "green_heart", cat: "Symbols" },
  { char: "💯", name: "100 hundred perfect", shortcode: "100", cat: "Symbols" },
  { char: "⚡", name: "zap lightning bolt", shortcode: "zap", cat: "Symbols" },
];

const SKIN_TONES = [
  { id: "default", label: "Default", mod: "", swatch: "#facc15" },
  { id: "light", label: "Light", mod: "\u{1F3FB}", swatch: "#f7d7c4" },
  { id: "med-light", label: "Medium-Light", mod: "\u{1F3FC}", swatch: "#d8b094" },
  { id: "medium", label: "Medium", mod: "\u{1F3FD}", swatch: "#bb9167" },
  { id: "med-dark", label: "Medium-Dark", mod: "\u{1F3FE}", swatch: "#8e562e" },
  { id: "dark", label: "Dark", mod: "\u{1F3FF}", swatch: "#5a3825" },
];

const RECENT_KEY = "leafsty_recent_emojis";
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
  const [emojiTab, setEmojiTab] = useState<
    "Recent" | "Smileys" | "Hands" | "Nature" | "Food" | "Objects" | "Symbols"
  >("Smileys");
  const [skinIdx, setSkinIdx] = useState(0);
  const [hoveredEmoji, setHoveredEmoji] = useState<EmojiEntry | null>(null);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([
    "🌿",
    "😂",
    "🔥",
    "👍",
    "💚",
    "💀",
    "👀",
    "🥳",
  ]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENT_KEY) || "null");
      if (Array.isArray(saved) && saved.length > 0) setRecentEmojis(saved);
    } catch {}
  }, []);

  const skinMod = SKIN_TONES.at(skinIdx)?.mod || "";

  const applyTone = (item: EmojiEntry) =>
    item.skinTones && skinMod
      ? `${item.char.replace(/\uFE0F/g, "")}${skinMod}`
      : item.char;

  const sendPayload = async (rawText: string, attachments: any[] = []) => {
    const trimmed = rawText.trim();
    if ((!trimmed && attachments.length === 0) || !channel) return;

    const currentUserId = String(
      client?.userID || (client?.user as any)?.id || ""
    );

    const tempId = `temp-${Date.now()}`;
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
      created_at: new Date().toISOString(),
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

  const handleInsertEmoji = (char: string) => {
    setText((prev) => `${prev}${char}`);
    setRecentEmojis((prev) => {
      const next = [char, ...prev.filter((e) => e !== char)].slice(0, 21);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    inputRef.current?.focus();
  };

  const displayedEmojis = useMemo(() => {
    const q = emojiSearch.trim().toLowerCase().replace(/^:|:$/g, "");
    if (q) {
      return EMOJI_SET.filter(
        (e) => e.name.includes(q) || e.shortcode.includes(q)
      );
    }
    if (emojiTab === "Recent") {
      return recentEmojis.map((ch) => {
        const match = EMOJI_SET.find((e) => e.char === ch);
        return (
          match || {
            char: ch,
            name: "recent",
            shortcode: "recent",
            cat: "Smileys" as const,
          }
        );
      });
    }
    return EMOJI_SET.filter((e) => e.cat === emojiTab);
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
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-emerald-400/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                  placeholder={
                    hoveredEmoji
                      ? `:${hoveredEmoji.shortcode}:`
                      : "Search emojis..."
                  }
                  autoFocus
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

              <div className="flex items-center gap-1 bg-[#0d261e] px-1.5 py-1 rounded-lg border border-emerald-500/20">
                {SKIN_TONES.map((st, idx) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSkinIdx(idx)}
                    title={st.label}
                    style={{ backgroundColor: st.swatch }}
                    className={`w-3 h-3 rounded-full transition cursor-pointer ${
                      skinIdx === idx
                        ? "ring-2 ring-white scale-110"
                        : "opacity-75 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="p-1 rounded-lg text-emerald-300/60 hover:text-emerald-50 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {!emojiSearch.trim() && (
              <div className="flex flex-wrap items-center gap-1">
                {(
                  [
                    "Recent",
                    "Smileys",
                    "Hands",
                    "Nature",
                    "Food",
                    "Objects",
                    "Symbols",
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setEmojiTab(tab)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      emojiTab === tab
                        ? "bg-emerald-600 text-white"
                        : "text-emerald-300/70 hover:text-emerald-50 hover:bg-emerald-500/15"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-2.5 h-48 overflow-y-auto grid grid-cols-7 gap-1 content-start">
            {displayedEmojis.length === 0 ? (
              <div className="col-span-7 py-8 text-center text-xs text-emerald-300/60">
                No matching emojis found.
              </div>
            ) : (
              displayedEmojis.map((item, idx) => {
                const ch = applyTone(item);
                return (
                  <button
                    key={`${item.shortcode}-${idx}`}
                    type="button"
                    onMouseEnter={() => setHoveredEmoji(item)}
                    onMouseLeave={() => setHoveredEmoji(null)}
                    onClick={() => handleInsertEmoji(ch)}
                    className="text-xl p-1 rounded-lg hover:bg-emerald-500/20 hover:scale-110 transition cursor-pointer flex items-center justify-center"
                  >
                    {ch}
                  </button>
                );
              })
            )}
          </div>

          <div className="px-3 py-1.5 bg-[#04120e] border-t border-emerald-500/15 text-[11px] text-emerald-300/80 flex items-center justify-between">
            {hoveredEmoji ? (
              <span className="font-mono font-bold text-emerald-200">
                {applyTone(hoveredEmoji)} :{hoveredEmoji.shortcode}:
              </span>
            ) : (
              <span className="text-emerald-400/70">Click emoji to insert</span>
            )}
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
            title="Emojis"
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
