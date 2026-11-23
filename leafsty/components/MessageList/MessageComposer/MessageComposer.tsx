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
  Paperclip,
  FileText,
  Loader2,
} from "lucide-react";

interface EmojiEntry {
  char: string;
  name: string;
  shortcode: string;
  cat: "Smileys" | "Hands" | "Nature" | "Food" | "Objects" | "Symbols";
  skinTones?: boolean;
}

interface PendingAttachment {
  id: string;
  file: File;
  name: string;
  size: number;
  isImage: boolean;
  previewUrl?: string;
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
const CATALOG_CACHE_KEY = "leafsty_full_twemoji_catalog_v3";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function compressImageUnder65KB(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 900;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.drawImage(img, 0, 0, width, height);

      for (const quality of [0.75, 0.55, 0.35]) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (dataUrl.length <= 65_000) {
          return resolve(dataUrl);
        }
      }
      reject(new Error("Image too large for inline fallback"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image"));
    };
    img.src = objectUrl;
  });
}

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
  const [fullCatalog, setFullCatalog] = useState<EmojiEntry[]>(EMOJI_SET);
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
  const [pendingFiles, setPendingFiles] = useState<PendingAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENT_KEY) || "null");
      if (Array.isArray(saved) && saved.length > 0) setRecentEmojis(saved);

      const cached = JSON.parse(
        localStorage.getItem(CATALOG_CACHE_KEY) || "null"
      );
      if (Array.isArray(cached) && cached.length > 500) {
        setFullCatalog(cached);
        return;
      }
    } catch {}

    let cancelled = false;
    fetch("/api/unicode-emojis")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data?.emojis)) return;
        if (data.emojis.length > 500) {
          setFullCatalog(data.emojis);
          try {
            localStorage.setItem(
              CATALOG_CACHE_KEY,
              JSON.stringify(data.emojis)
            );
          } catch {}
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const skinMod = SKIN_TONES.at(skinIdx)?.mod || "";

  const applyTone = (item: EmojiEntry) =>
    item.skinTones && skinMod
      ? `${item.char.replace(/\uFE0F/g, "")}${skinMod}`
      : item.char;

  const addFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    if (incoming.length === 0) return;

    const mapped: PendingAttachment[] = incoming.slice(0, 6).map((file) => {
      const isImage = file.type.startsWith("image/");
      return {
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        name: file.name,
        size: file.size,
        isImage,
        previewUrl: isImage ? URL.createObjectURL(file) : undefined,
      };
    });

    setPendingFiles((prev) => [...prev, ...mapped].slice(0, 6));
    setSendError(null);
    inputRef.current?.focus();
  };

  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };
  const uploadSingleAttachment = async (item: PendingAttachment) => {
    const liveChannel =
      typeof channel?.sendImage === "function" ||
      typeof channel?.sendFile === "function"
        ? channel
        : client && channel?.id
        ? client.channel(channel.type || "messaging", channel.id)
        : null;

    try {
      if (item.isImage && typeof liveChannel?.sendImage === "function") {
        const res = await liveChannel.sendImage(item.file);
        if (res?.file) {
          return {
            type: "image",
            image_url: res.file,
            thumb_url: res.file,
            title: item.name,
            file_size: item.size,
            mime_type: item.file.type,
          };
        }
      } else if (typeof liveChannel?.sendFile === "function") {
        const res = await liveChannel.sendFile(item.file);
        if (res?.file) {
          return {
            type: "file",
            asset_url: res.file,
            title: item.name,
            file_size: item.size,
            mime_type: item.file.type || "application/octet-stream",
          };
        }
      }
    } catch (err) {
      console.warn("Stream CDN upload fallback:", err);
    }

    if (item.isImage) {
      const compactUrl = await compressImageUnder65KB(item.file);
      return {
        type: "image",
        image_url: compactUrl,
        thumb_url: compactUrl,
        title: item.name,
        file_size: item.size,
        mime_type: "image/jpeg",
      };
    }

    throw new Error(
      `File upload failed for "${item.name}". Enable File Uploads in your Stream Chat Dashboard for files over 100 KB.`
    );
  };

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
    setMentionQuery(null);
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
    if (isUploading) return;
    setShowEmojiPicker(false);
    setMentionQuery(null);

    if (pendingFiles.length > 0) {
      setIsUploading(true);
      setSendError(null);
      try {
        const uploaded = await Promise.all(
          pendingFiles.map((item) => uploadSingleAttachment(item))
        );
        pendingFiles.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
        setPendingFiles([]);
        await sendPayload(text, uploaded);
      } catch (err: any) {
        setSendError(err?.message || "File upload failed");
      } finally {
        setIsUploading(false);
      }
      return;
    }

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
      return fullCatalog.filter(
        (e) => e.name.includes(q) || e.shortcode.includes(q)
      );
    }
    if (emojiTab === "Recent") {
      return recentEmojis.map((ch) => {
        const match = fullCatalog.find((e) => e.char === ch);
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
    return fullCatalog.filter((e) => e.cat === emojiTab);
  }, [emojiSearch, emojiTab, recentEmojis, fullCatalog]);

  const mentionCandidates = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();

    const memberMap = new Map<
      string,
      { id: string; name: string; image?: string; tag: string }
    >();

    const rawMembers = channel?.state?.members
      ? Object.values(channel.state.members)
      : [];
    for (const m of rawMembers as any[]) {
      const u = m?.user;
      if (!u?.id) continue;
      const name = String(u.name || u.id);
      memberMap.set(String(u.id), {
        id: String(u.id),
        name,
        image: u.image,
        tag: `@${name.replace(/\s+/g, "_")}`,
      });
    }

    const list = [
      ...Array.from(memberMap.values()),
      { id: "everyone", name: "everyone", tag: "@everyone" },
      { id: "here", name: "here", tag: "@here" },
    ];

    return list
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.tag.toLowerCase().includes(`@${q}`)
      )
      .slice(0, 7);
  }, [mentionQuery, channel?.state?.members]);

  const handleSelectMention = (tag: string) => {
    setText((prev) => prev.replace(/(^|\s)@[a-zA-Z0-9_.-]*$/, `$1${tag} `));
    setMentionQuery(null);
    setMentionIndex(0);
    inputRef.current?.focus();
  };

  const activePreview = hoveredEmoji || displayedEmojis.at(0) || null;
  const channelLabel =
    (channel?.data as any)?.name || channel?.id || "encrypted chat";
