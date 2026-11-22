"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, X, Clock, Smile, Hand, Leaf, Pizza, Gamepad2, Lightbulb, Hash, Flag } from "lucide-react";

export interface UnicodeEmojiItem {
  char: string;
  name: string;
  shortcode: string;
  category: string;
  skinTones?: boolean;
}

interface UnicodeEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const SKIN_TONES = [
  { id: "default", label: "Default", mod: "", swatch: "#facc15" },
  { id: "light", label: "Light", mod: "\u{1F3FB}", swatch: "#f7d7c4" },
  { id: "med-light", label: "Medium-Light", mod: "\u{1F3FC}", swatch: "#d8b094" },
  { id: "medium", label: "Medium", mod: "\u{1F3FD}", swatch: "#bb9167" },
  { id: "med-dark", label: "Medium-Dark", mod: "\u{1F3FE}", swatch: "#8e562e" },
  { id: "dark", label: "Dark", mod: "\u{1F3FF}", swatch: "#5a3825" },
];

const RECENT_KEY = "leafsty_recent_emojis";
const CACHE_KEY = "leafsty_unicode_catalog_v1";

const SEED_EMOJIS: UnicodeEmojiItem[] = [
  { char: "😀", name: "grinning face happy smile", shortcode: "grinning", category: "Smileys" },
  { char: "😂", name: "face with tears of joy laugh lol", shortcode: "joy", category: "Smileys" },
  { char: "🥹", name: "face holding back tears proud", shortcode: "face_holding_back_tears", category: "Smileys" },
  { char: "😍", name: "smiling face with heart eyes love", shortcode: "heart_eyes", category: "Smileys" },
  { char: "😎", name: "smiling face with sunglasses cool", shortcode: "sunglasses", category: "Smileys" },
  { char: "🥳", name: "partying face celebrate birthday", shortcode: "partying_face", category: "Smileys" },
  { char: "🤔", name: "thinking face hmm", shortcode: "thinking", category: "Smileys" },
  { char: "😴", name: "sleeping face tired zzz", shortcode: "sleeping", category: "Smileys" },
  { char: "😭", name: "loudly crying face sob sad", shortcode: "sob", category: "Smileys" },
  { char: "😱", name: "face screaming in fear shocked", shortcode: "scream", category: "Smileys" },
  { char: "🤯", name: "exploding head mind blown", shortcode: "exploding_head", category: "Smileys" },
  { char: "🥶", name: "cold face freezing", shortcode: "cold_face", category: "Smileys" },
  { char: "🥵", name: "hot face sweating", shortcode: "hot_face", category: "Smileys" },
  { char: "🤡", name: "clown face", shortcode: "clown", category: "Smileys" },
  { char: "👻", name: "ghost spooky halloween", shortcode: "ghost", category: "Smileys" },
  { char: "💀", name: "skull dead skeleton", shortcode: "skull", category: "Smileys" },
  { char: "🫠", name: "melting face", shortcode: "melting_face", category: "Smileys" },
  { char: "🫡", name: "saluting face respect", shortcode: "saluting_face", category: "Smileys" },
  { char: "👍", name: "thumbs up like yes approve", shortcode: "thumbsup", category: "People", skinTones: true },
  { char: "👎", name: "thumbs down dislike no", shortcode: "thumbsdown", category: "People", skinTones: true },
  { char: "👏", name: "clapping hands applause", shortcode: "clap", category: "People", skinTones: true },
  { char: "🙌", name: "raising hands hooray celebrate", shortcode: "raised_hands", category: "People", skinTones: true },
  { char: "🤝", name: "handshake deal agree", shortcode: "handshake", category: "People" },
  { char: "✌️", name: "victory hand peace", shortcode: "v", category: "People", skinTones: true },
  { char: "🤞", name: "crossed fingers luck", shortcode: "crossed_fingers", category: "People", skinTones: true },
  { char: "🫶", name: "heart hands love", shortcode: "heart_hands", category: "People", skinTones: true },
  { char: "👋", name: "waving hand hello hi bye", shortcode: "wave", category: "People", skinTones: true },
  { char: "💪", name: "flexed biceps strong muscle", shortcode: "muscle", category: "People", skinTones: true },
  { char: "🙏", name: "folded hands pray please thanks", shortcode: "pray", category: "People", skinTones: true },
  { char: "👀", name: "eyes look watching see", shortcode: "eyes", category: "People" },
  { char: "🌿", name: "herb leaf green leafsty", shortcode: "herb", category: "Nature" },
  { char: "🍃", name: "leaf fluttering in wind", shortcode: "leaves", category: "Nature" },
  { char: "🌱", name: "seedling sprout plant", shortcode: "seedling", category: "Nature" },
  { char: "🌲", name: "evergreen tree pine forest", shortcode: "evergreen_tree", category: "Nature" },
  { char: "🍀", name: "four leaf clover lucky", shortcode: "four_leaf_clover", category: "Nature" },
  { char: "🐱", name: "cat face kitty", shortcode: "cat", category: "Nature" },
  { char: "🐶", name: "dog face puppy", shortcode: "dog", category: "Nature" },
  { char: "🦊", name: "fox", shortcode: "fox", category: "Nature" },
  { char: "🐸", name: "frog", shortcode: "frog", category: "Nature" },
  { char: "🌙", name: "crescent moon night", shortcode: "crescent_moon", category: "Nature" },
  { char: "⭐", name: "star", shortcode: "star", category: "Nature" },
  { char: "✨", name: "sparkles magic shine", shortcode: "sparkles", category: "Nature" },
  { char: "🔥", name: "fire flame lit hot", shortcode: "fire", category: "Nature" },
  { char: "🥬", name: "leafy green salad kale", shortcode: "leafy_green", category: "Food" },
  { char: "🍕", name: "pizza", shortcode: "pizza", category: "Food" },
  { char: "🍔", name: "hamburger burger", shortcode: "hamburger", category: "Food" },
  { char: "🍣", name: "sushi", shortcode: "sushi", category: "Food" },
  { char: "🍩", name: "doughnut donut", shortcode: "doughnut", category: "Food" },
  { char: "☕", name: "hot beverage coffee tea", shortcode: "coffee", category: "Food" },
  { char: "🧋", name: "bubble tea boba", shortcode: "bubble_tea", category: "Food" },
  { char: "🎮", name: "video game controller gaming", shortcode: "video_game", category: "Activities" },
  { char: "🎧", name: "headphone music audio", shortcode: "headphones", category: "Activities" },
  { char: "🏆", name: "trophy winner champion", shortcode: "trophy", category: "Activities" },
  { char: "🎉", name: "party popper tada celebrate", shortcode: "tada", category: "Activities" },
  { char: "💻", name: "laptop computer code", shortcode: "computer", category: "Objects" },
  { char: "🔒", name: "locked encrypted secure privacy", shortcode: "lock", category: "Objects" },
  { char: "🚀", name: "rocket launch space", shortcode: "rocket", category: "Objects" },
  { char: "💎", name: "gem stone diamond", shortcode: "gem", category: "Objects" },
  { char: "❤️", name: "red heart love", shortcode: "heart", category: "Symbols" },
  { char: "💚", name: "green heart leafsty", shortcode: "green_heart", category: "Symbols" },
  { char: "💯", name: "hundred points 100 perfect", shortcode: "100", category: "Symbols" },
  { char: "⚡", name: "high voltage lightning zap", shortcode: "zap", category: "Symbols" },
  { char: "🇦🇺", name: "flag australia", shortcode: "flag_au", category: "Flags" },
  { char: "🇺🇸", name: "flag united states usa", shortcode: "flag_us", category: "Flags" },
  { char: "🇬🇧", name: "flag united kingdom uk", shortcode: "flag_gb", category: "Flags" },
  { char: "🇯🇵", name: "flag japan", shortcode: "flag_jp", category: "Flags" },
];

export default function UnicodeEmojiPicker({
  onSelectEmoji,
  onClose,
}: UnicodeEmojiPickerProps) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("Smileys");
  const [skinMod, setSkinMod] = useState("");
  const [hovered, setHovered] = useState<UnicodeEmojiItem | null>(null);
  const [catalog, setCatalog] = useState<UnicodeEmojiItem[]>(SEED_EMOJIS);
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
  useEffect(() => {
    try {
      const savedRecent = JSON.parse(localStorage.getItem(RECENT_KEY) || "null");
      if (Array.isArray(savedRecent) && savedRecent.length > 0) {
        setRecent(savedRecent);
      }
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (Array.isArray(cached) && cached.length > 100) {
        setCatalog(cached);
        return;
      }
    } catch {}

    // Fetch full official Unicode emoji-datasource JSON from jsDelivr CDN (zero repo disk space)
    let cancelled = false;
    fetch(
      "https://jsdelivr.net"
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((rows) => {
        if (cancelled || !Array.isArray(rows)) return;
        const catMap: Record<string, string> = {
          "Smileys & Emotion": "Smileys",
          "People & Body": "People",
          "Animals & Nature": "Nature",
          "Food & Drink": "Food",
          Activities: "Activities",
          "Travel & Places": "Objects",
          Objects: "Objects",
          Symbols: "Symbols",
          Flags: "Flags",
        };
        const parsed: UnicodeEmojiItem[] = rows
          .filter((item: any) => item?.unified && catMap[item.category])
          .map((item: any) => {
            const cps = String(item.unified)
              .split("-")
              .map((h) => parseInt(h, 16));
            const char = String.fromCodePoint(...cps);
            const shortName = String(item.short_name || "emoji");
            return {
              char,
              name: `${String(item.name || shortName).toLowerCase()} ${shortName.replace(/_/g, " ")}`,
              shortcode: shortName,
              category: catMap[item.category],
              skinTones: Boolean(item.skin_variations),
            };
          });
        if (parsed.length > 100) {
          setCatalog(parsed);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
          } catch {}
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const applySkinTone = (item: UnicodeEmojiItem) => {
    if (!skinMod || !item.skinTones) return item.char;
    return `${item.char.replace(/\uFE0F/g, "")}${skinMod}`;
  };

  const handlePick = (item: UnicodeEmojiItem) => {
    const finalChar = applySkinTone(item);
    onSelectEmoji(finalChar);
    setRecent((prev) => {
      const next = [finalChar, ...prev.filter((e) => e !== finalChar)].slice(0, 24);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const visibleList = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^:|:$/g, "");
    if (q) {
      return catalog.filter(
        (item) => item.name.includes(q) || item.shortcode.includes(q)
      );
    }
    if (activeCat === "Recent") {
      return recent.map((ch) => ({
        char: ch,
        name: "recently used",
        shortcode: "recent",
        category: "Recent",
      }));
    }
    return catalog.filter((item) => item.category === activeCat);
  }, [query, activeCat, catalog, recent]);

  const catIcons = [
    { id: "Recent", icon: <Clock className="w-4 h-4" /> },
    { id: "Smileys", icon: <Smile className="w-4 h-4" /> },
    { id: "People", icon: <Hand className="w-4 h-4" /> },
    { id: "Nature", icon: <Leaf className="w-4 h-4" /> },
    { id: "Food", icon: <Pizza className="w-4 h-4" /> },
    { id: "Activities", icon: <Gamepad2 className="w-4 h-4" /> },
    { id: "Objects", icon: <Lightbulb className="w-4 h-4" /> },
    { id: "Symbols", icon: <Hash className="w-4 h-4" /> },
    { id: "Flags", icon: <Flag className="w-4 h-4" /> },
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
            placeholder={
              hovered ? `:${hovered.shortcode}:` : "Search emojis (e.g. fire, cat, laugh)..."
            }
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
          {SKIN_TONES.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setSkinMod(st.mod)}
              title={st.label}
              style={{ backgroundColor: st.swatch }}
              className={`w-3 h-3 rounded-full transition cursor-pointer ${
                skinMod === st.mod ? "ring-2 ring-white scale-110" : "opacity-75 hover:opacity-100"
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

      <div className="flex flex-1 min-h-0 h-64">
        <div className="w-10 bg-[#05110d] border-r border-emerald-500/15 py-2 flex flex-col items-center gap-1 shrink-0">
          {catIcons.map((c) => (
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
          {visibleList.length === 0 ? (
            <div className="col-span-7 py-12 text-center text-xs text-emerald-300/60">
              No emojis match &ldquo;{query}&rdquo;
            </div>
          ) : (
            visibleList.map((item, idx) => {
              const displayChar = applySkinTone(item);
              return (
                <button
                  key={`${item.shortcode}-${idx}`}
                  type="button"
                  onMouseEnter={() => setHovered(item)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handlePick(item)}
                  className="text-xl p-1 rounded-lg hover:bg-emerald-500/20 hover:scale-110 transition cursor-pointer flex items-center justify-center"
                >
                  {displayChar}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="px-3 py-1.5 bg-[#04120e] border-t border-emerald-500/15 flex items-center justify-between text-[11px] text-emerald-300/80">
        {hovered ? (
          <div className="flex items-center gap-2 truncate">
            <span className="text-base">{applySkinTone(hovered)}</span>
            <span className="font-mono font-bold text-emerald-200 truncate">
              :{hovered.shortcode}:
            </span>
          </div>
        ) : (
          <span className="text-emerald-400/70">
            {catalog.length.toLocaleString()} Unicode emojis ready
          </span>
        )}
      </div>
    </div>
  );
}
