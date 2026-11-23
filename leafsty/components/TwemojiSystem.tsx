"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  X,
  Clock,
  Smile,
  Hand,
  Leaf,
  Pizza,
  Gamepad2,
  Lightbulb,
  Hash,
} from "lucide-react";

export interface TwemojiEntry {
  char: string;
  hex: string;
  name: string;
  shortcode: string;
  cat:
    | "Smileys"
    | "People"
    | "Nature"
    | "Food"
    | "Activities"
    | "Objects"
    | "Symbols";
  skinTones?: boolean;
}

export const TWEMOJI_CATALOG: TwemojiEntry[] = [
  { char: "😀", hex: "1f600", name: "grinning face smile happy", shortcode: "grinning", cat: "Smileys" },
  { char: "😂", hex: "1f602", name: "joy laugh tears lol", shortcode: "joy", cat: "Smileys" },
  { char: "🤣", hex: "1f923", name: "rofl rolling laughing", shortcode: "rofl", cat: "Smileys" },
  { char: "😊", hex: "1f60a", name: "blush smiling happy", shortcode: "blush", cat: "Smileys" },
  { char: "😍", hex: "1f60d", name: "heart eyes love", shortcode: "heart_eyes", cat: "Smileys" },
  { char: "🥰", hex: "1f970", name: "smiling hearts love", shortcode: "smiling_face_with_3_hearts", cat: "Smileys" },
  { char: "😎", hex: "1f60e", name: "sunglasses cool", shortcode: "sunglasses", cat: "Smileys" },
  { char: "🥳", hex: "1f973", name: "partying celebrate birthday", shortcode: "partying_face", cat: "Smileys" },
  { char: "🤔", hex: "1f914", name: "thinking hmm", shortcode: "thinking", cat: "Smileys" },
  { char: "😴", hex: "1f634", name: "sleeping tired zzz", shortcode: "sleeping", cat: "Smileys" },
  { char: "😭", hex: "1f62d", name: "sob crying sad", shortcode: "sob", cat: "Smileys" },
  { char: "😱", hex: "1f631", name: "scream shocked", shortcode: "scream", cat: "Smileys" },
  { char: "🤯", hex: "1f92f", name: "exploding head mind blown", shortcode: "exploding_head", cat: "Smileys" },
  { char: "🥶", hex: "1f976", name: "cold freezing", shortcode: "cold_face", cat: "Smileys" },
  { char: "🥵", hex: "1f975", name: "hot sweating", shortcode: "hot_face", cat: "Smileys" },
  { char: "🤡", hex: "1f921", name: "clown", shortcode: "clown", cat: "Smileys" },
  { char: "👻", hex: "1f47b", name: "ghost spooky", shortcode: "ghost", cat: "Smileys" },
  { char: "💀", hex: "1f480", name: "skull dead", shortcode: "skull", cat: "Smileys" },
  { char: "👍", hex: "1f44d", name: "thumbs up like yes", shortcode: "thumbsup", cat: "People", skinTones: true },
  { char: "👎", hex: "1f44e", name: "thumbs down dislike no", shortcode: "thumbsdown", cat: "People", skinTones: true },
  { char: "👏", hex: "1f44f", name: "clap applause", shortcode: "clap", cat: "People", skinTones: true },
  { char: "🙌", hex: "1f64c", name: "raised hands hooray", shortcode: "raised_hands", cat: "People", skinTones: true },
  { char: "🤝", hex: "1f91d", name: "handshake deal", shortcode: "handshake", cat: "People" },
  { char: "✌️", hex: "270c", name: "peace victory", shortcode: "v", cat: "People", skinTones: true },
  { char: "🤞", hex: "1f91e", name: "crossed fingers luck", shortcode: "crossed_fingers", cat: "People", skinTones: true },
  { char: "👋", hex: "1f44b", name: "wave hello hi bye", shortcode: "wave", cat: "People", skinTones: true },
  { char: "💪", hex: "1f4aa", name: "muscle strong flex", shortcode: "muscle", cat: "People", skinTones: true },
  { char: "🙏", hex: "1f64f", name: "pray please thanks", shortcode: "pray", cat: "People", skinTones: true },
  { char: "👀", hex: "1f440", name: "eyes look watching", shortcode: "eyes", cat: "People" },
  { char: "🌿", hex: "1f33f", name: "herb leaf green leafsty", shortcode: "herb", cat: "Nature" },
  { char: "🍃", hex: "1f343", name: "leaves wind flutter", shortcode: "leaves", cat: "Nature" },
  { char: "🌱", hex: "1f331", name: "seedling sprout plant", shortcode: "seedling", cat: "Nature" },
  { char: "🌲", hex: "1f332", name: "evergreen pine tree", shortcode: "evergreen_tree", cat: "Nature" },
  { char: "🍀", hex: "1f340", name: "four leaf clover lucky", shortcode: "four_leaf_clover", cat: "Nature" },
  { char: "🐱", hex: "1f431", name: "cat kitty", shortcode: "cat", cat: "Nature" },
  { char: "🐶", hex: "1f436", name: "dog puppy", shortcode: "dog", cat: "Nature" },
  { char: "🦊", hex: "1f98a", name: "fox", shortcode: "fox", cat: "Nature" },
  { char: "🐸", hex: "1f438", name: "frog", shortcode: "frog", cat: "Nature" },
  { char: "🌙", hex: "1f319", name: "moon night", shortcode: "crescent_moon", cat: "Nature" },
  { char: "⭐", hex: "2b50", name: "star", shortcode: "star", cat: "Nature" },
  { char: "✨", hex: "2728", name: "sparkles magic shine", shortcode: "sparkles", cat: "Nature" },
  { char: "🔥", hex: "1f525", name: "fire flame lit", shortcode: "fire", cat: "Nature" },
  { char: "🥬", hex: "1f96c", name: "leafy green kale", shortcode: "leafy_green", cat: "Food" },
  { char: "🍕", hex: "1f355", name: "pizza", shortcode: "pizza", cat: "Food" },
  { char: "🍔", hex: "1f354", name: "hamburger burger", shortcode: "hamburger", cat: "Food" },
  { char: "🍣", hex: "1f363", name: "sushi", shortcode: "sushi", cat: "Food" },
  { char: "🍩", hex: "1f369", name: "donut doughnut", shortcode: "doughnut", cat: "Food" },
  { char: "☕", hex: "2615", name: "coffee hot", shortcode: "coffee", cat: "Food" },
  { char: "🧋", hex: "1f9cb", name: "bubble tea boba", shortcode: "bubble_tea", cat: "Food" },
  { char: "🎮", hex: "1f3ae", name: "video game controller", shortcode: "video_game", cat: "Activities" },
  { char: "🎧", hex: "1f3a7", name: "headphones music", shortcode: "headphones", cat: "Activities" },
  { char: "🏆", hex: "1f3c6", name: "trophy winner", shortcode: "trophy", cat: "Activities" },
  { char: "🎉", hex: "1f389", name: "party popper tada", shortcode: "tada", cat: "Activities" },
  { char: "💻", hex: "1f4bb", name: "laptop computer code", shortcode: "computer", cat: "Objects" },
  { char: "🔒", hex: "1f512", name: "lock encrypted secure", shortcode: "lock", cat: "Objects" },
  { char: "🚀", hex: "1f680", name: "rocket launch", shortcode: "rocket", cat: "Objects" },
  { char: "💎", hex: "1f48e", name: "gem diamond", shortcode: "gem", cat: "Objects" },
  { char: "❤️", hex: "2764", name: "red heart love", shortcode: "heart", cat: "Symbols" },
  { char: "💚", hex: "1f49a", name: "green heart leafsty", shortcode: "green_heart", cat: "Symbols" },
  { char: "💯", hex: "1f4af", name: "100 hundred perfect", shortcode: "100", cat: "Symbols" },
  { char: "⚡", hex: "26a1", name: "zap lightning bolt", shortcode: "zap", cat: "Symbols" },
];

export function emojiToTwemojiHex(emoji: string): string {
  const found = TWEMOJI_CATALOG.find((e) => e.char === emoji);
  if (found) return found.hex;

  const cps: string[] = [];
  for (const sym of Array.from(emoji)) {
    const cp = sym.codePointAt(0);
    if (!cp) continue;
    if (cp === 0xfe0f && !emoji.includes("\u200d")) continue;
    cps.push(cp.toString(16).toLowerCase());
  }
  return cps.join("-");
}

export function TwemojiImg({
  emoji,
  hexOverride,
  className = "w-6 h-6 inline-block",
}: {
  emoji: string;
  hexOverride?: string;
  className?: string;
}) {
  const hex = hexOverride || emojiToTwemojiHex(emoji);
  const [step, setStep] = useState(0);

  if (!hex) return null;

  const sources = [
    `https://twimg.com{hex}.svg`,
    `https://twimg.com{hex}.png`,
  ];

  const src = sources[Math.min(step, sources.length - 1)];

  return (
    <img
      src={src}
      alt={emoji}
      draggable={false}
      loading="lazy"
      onError={() => {
        if (step < sources.length - 1) setStep((s) => s + 1);
      }}
      className={className}
    />
  );
}

export function TwemojiMessageText({ text }: { text: string }) {
  const parts = text.split(
    /(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|\p{Emoji_Modifier})*)/gu
  );

  return (
    <>
      {parts.map((part, idx) => {
        if (!part) return null;
        if (/\p{Extended_Pictographic}/u.test(part)) {
          return (
            <TwemojiImg
              key={idx}
              emoji={part}
              className="inline-block w-5 h-5 align-[-0.25em] mx-0.5 select-all"
            />
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </>
  );
}
const SKIN_TONES = [
  { id: "default", label: "Default", hexMod: "", charMod: "", swatch: "#facc15" },
  { id: "light", label: "Light", hexMod: "-1f3fb", charMod: "\u{1F3FB}", swatch: "#f7d7c4" },
  { id: "med-light", label: "Medium-Light", hexMod: "-1f3fc", charMod: "\u{1F3FC}", swatch: "#d8b094" },
  { id: "medium", label: "Medium", hexMod: "-1f3fd", charMod: "\u{1F3FD}", swatch: "#bb9167" },
  { id: "med-dark", label: "Medium-Dark", hexMod: "-1f3fe", charMod: "\u{1F3FE}", swatch: "#8e562e" },
  { id: "dark", label: "Dark", hexMod: "-1f3ff", charMod: "\u{1F3FF}", swatch: "#5a3825" },
];

export function TwemojiPicker({
  onSelectEmoji,
  onClose,
}: {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("Smileys");
  const [skinIdx, setSkinIdx] = useState(0);
  const [hovered, setHovered] = useState<TwemojiEntry | null>(null);
  const [recent, setRecent] = useState<string[]>([
    "🌿",
    "😂",
    "🔥",
    "👍",
    "💚",
    "💀",
    "👀",
    "🥳",
  ]);

  const tone = SKIN_TONES[skinIdx] || SKIN_TONES;

  const resolveChar = (item: TwemojiEntry) =>
    item.skinTones && tone.charMod
      ? `${item.char.replace(/\uFE0F/g, "")}${tone.charMod}`
      : item.char;

  const resolveHex = (item: TwemojiEntry) =>
    item.skinTones && tone.hexMod ? `${item.hex}${tone.hexMod}` : item.hex;

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^:|:$/g, "");
    if (q) {
      return TWEMOJI_CATALOG.filter(
        (e) => e.name.includes(q) || e.shortcode.includes(q)
      );
    }
    if (activeCat === "Recent") {
      return recent.map((ch) => {
        const match = TWEMOJI_CATALOG.find((e) => e.char === ch);
        return (
          match || {
            char: ch,
            hex: emojiToTwemojiHex(ch),
            name: "recent",
            shortcode: "recent",
            cat: "Smileys" as const,
          }
        );
      });
    }
    return TWEMOJI_CATALOG.filter((e) => e.cat === activeCat);
  }, [query, activeCat, recent]);

  const navCats = [
    { id: "Recent", icon: <Clock className="w-4 h-4" /> },
    { id: "Smileys", icon: <Smile className="w-4 h-4" /> },
    { id: "People", icon: <Hand className="w-4 h-4" /> },
    { id: "Nature", icon: <Leaf className="w-4 h-4" /> },
    { id: "Food", icon: <Pizza className="w-4 h-4" /> },
    { id: "Activities", icon: <Gamepad2 className="w-4 h-4" /> },
    { id: "Objects", icon: <Lightbulb className="w-4 h-4" /> },
    { id: "Symbols", icon: <Hash className="w-4 h-4" /> },
  ];

  return (
    <div className="w-80 sm:w-96 rounded-2xl bg-[#081914] border border-emerald-500/25 shadow-2xl overflow-hidden text-emerald-50 flex flex-col">
      <div className="p-2.5 bg-[#061410] border-b border-emerald-500/15 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-emerald-400/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={hovered ? `:${hovered.shortcode}:` : "Search Twemoji..."}
            autoFocus
            className="w-full pl-8 pr-6 py-1.5 rounded-lg bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/45 focus:outline-none focus:border-emerald-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
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
          onClick={onClose}
          className="p-1 rounded-lg text-emerald-300/60 hover:text-emerald-50 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex h-60">
        <div className="w-10 bg-[#05110d] border-r border-emerald-500/15 py-2 flex flex-col items-center gap-1 shrink-0">
          {navCats.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCat(c.id);
              }}
              title={c.id}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                activeCat === c.id && !query
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-300/65 hover:text-emerald-50 hover:bg-emerald-500/15"
              }`}
            >
              {c.icon}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2 grid grid-cols-7 gap-1 content-start">
          {visibleItems.map((item, idx) => {
            const ch = resolveChar(item);
            const hx = resolveHex(item);
            return (
              <button
                key={`${item.shortcode}-${idx}`}
                type="button"
                onMouseEnter={() => setHovered(item)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => {
                  onSelectEmoji(ch);
                  setRecent((prev) =>
                    [ch, ...prev.filter((x) => x !== ch)].slice(0, 21)
                  );
                }}
                className="p-1.5 rounded-lg hover:bg-emerald-500/20 hover:scale-110 transition cursor-pointer flex items-center justify-center"
              >
                <TwemojiImg
                  emoji={ch}
                  hexOverride={hx}
                  className="w-6 h-6 pointer-events-none"
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-3 py-1.5 bg-[#04120e] border-t border-emerald-500/15 flex items-center justify-between text-[11px] text-emerald-300/80">
        {hovered ? (
          <div className="flex items-center gap-2">
            <TwemojiImg
              emoji={resolveChar(hovered)}
              hexOverride={resolveHex(hovered)}
              className="w-5 h-5"
            />
            <span className="font-mono font-bold text-emerald-200">
              :{hovered.shortcode}:
            </span>
          </div>
        ) : (
          <span className="text-emerald-400/70">Twemoji Vector Set</span>
        )}
      </div>
    </div>
  );
}
