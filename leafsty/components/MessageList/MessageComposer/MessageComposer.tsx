"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../../../types/DiscordContext";
import { ReplyTarget } from "../CustomMessage/CustomMessage";
import KlipyGifPicker, { KlipyGifItem } from "./KlipyGifPicker";
import LeafstyGamesModal from "../../LeafstyGamesModal";
import { enqueueOfflineMessage } from "../../LeafstyOfflineManager";
import {
  ADMIN_SLASH_COMMANDS,
  executeAdminCommand,
  isLeafstyAdmin,
} from "../../../utils/adminCommands";
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
  Mic,
  Square,
  Trash2,
  Gamepad2,
  Slash,
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

const SLASH_COMMANDS = [
  {
    cmd: "/poll",
    usage: "/poll Best snack? | Pizza | Sushi | Boba",
    desc: "Create a live interactive poll in chat",
    template: "/poll ",
  },
  {
    cmd: "/roll",
    usage: "/roll",
    desc: "Roll a random 1–100 number",
    template: "/roll",
  },
  {
    cmd: "/coinflip",
    usage: "/coinflip",
    desc: "Flip a coin (Heads or Tails)",
    template: "/coinflip",
  },
  {
    cmd: "/shrug",
    usage: "/shrug [message]",
    desc: "Append ¯\\_(ツ)_/¯ to your message",
    template: "/shrug ",
  },
  {
    cmd: "/tableflip",
    usage: "/tableflip [message]",
    desc: "Append (╯°□°)╯︵ ┻━┻ to your message",
    template: "/tableflip ",
  },
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
  const [showGames, setShowGames] = useState(false);
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
  const [slashIndex, setSlashIndex] = useState(0);

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [liveLevels, setLiveLevels] = useState<number[]>(Array(24).fill(22));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sampledWaveRef = useRef<number[]>([]);
  const recordStartRef = useRef<number>(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
    const sendingRef = useRef(false);
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
  const currentUserId = String(
    client?.userID || (client?.user as any)?.id || ""
  );
  const resolvedChannelId = String(
    channel?.id || channel?.cid?.split(":").at(1) || ""
  );

  // 1. Server-side /api/upload first (bypasses browser permission restrictions)
  if (resolvedChannelId && currentUserId) {
    try {
      const fd = new FormData();
      fd.append("file", item.file);
      fd.append("channelType", String(channel?.type || "messaging"));
      fd.append("channelId", resolvedChannelId);
      fd.append("userId", currentUserId);
      fd.append("kind", item.isImage ? "image" : "file");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.url) {
        return item.isImage
          ? {
              type: "image",
              image_url: data.url,
              thumb_url: data.url,
              title: item.name,
              file_size: item.size,
              mime_type: item.file.type,
            }
          : {
              type: "file",
              asset_url: data.url,
              title: item.name,
              file_size: item.size,
              mime_type: item.file.type || "application/octet-stream",
            };
      }
    } catch {}
  }

  // 2. Fallback to browser Stream SDK
  const liveChannel =
    typeof channel?.sendImage === "function" ||
    typeof channel?.sendFile === "function"
      ? channel
      : client && resolvedChannelId
      ? client.channel(channel.type || "messaging", resolvedChannelId)
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
  } catch {}

  // 3. Final inline image fallback
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

  throw new Error(`Could not upload "${item.name}". Please try a smaller file.`);
};

  const sendPayload = async (rawText: string, attachments: any[] = []) => {
  const trimmed = rawText.trim();
  if ((!trimmed && attachments.length === 0) || !channel) return;
  if (sendingRef.current) return;
  sendingRef.current = true;

  try {
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
        window.dispatchEvent(
      new CustomEvent("leafsty:message-sent", { detail: optimisticMsg })
    );
    window.dispatchEvent(
      new CustomEvent("leafsty:lan-send", { detail: optimisticMsg })
    );
    setText("");
    setMentionQuery(null);
    setSendError(null);
    channel.stopTyping?.().catch(() => {});
    const savedReplyId = replyTarget?.id;
    onCancelReply?.();
    inputRef.current?.focus();

      if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineMessage({
        channelType: channel.type || "messaging",
        channelId: String(channel.id),
        userId: currentUserId,
        text: trimmed,
        attachments,
        parent_id: savedReplyId || undefined,
      });
      return;
    }

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
      const errStr = String(data?.error || `Send failed (${res.status})`);
      if (data?.banned || errStr.toLowerCase().includes("banned")) {
        window.dispatchEvent(
          new CustomEvent("leafsty:banned", {
            detail: {
              reason: data?.reason || "Violation of Leafsty community rules",
              expiresAt: data?.expiresAt || null,
            },
          })
        );
        return;
      }
      throw new Error(errStr);
    }

    if (data?.message) {
      window.dispatchEvent(
        new CustomEvent("leafsty:message-sent", {
          detail: { ...data.message, _replaceId: tempId },
        })
      );
    }
  } catch (err: any) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const currentUserId = String(
        client?.userID || (client?.user as any)?.id || ""
      );
      enqueueOfflineMessage({
        channelType: channel.type || "messaging",
        channelId: String(channel.id),
        userId: currentUserId,
        text: trimmed,
        attachments,
      });
      return;
    }
    const rawErr = String(err?.message || "Could not send message");
    if (rawErr.toLowerCase().includes("banned")) {
      window.dispatchEvent(
        new CustomEvent("leafsty:banned", {
          detail: {
            reason: "Violation of Leafsty community rules",
            expiresAt: null,
          },
        })
      );
      return;
    }
    const cleanErr = rawErr
      .replace(/stream error(\s*code\s*\d+:)?/gi, "")
      .trim();
    setSendError(cleanErr || "Could not send message");
  } finally {
    sendingRef.current = false;
  }
};

  const cleanupAudioMonitor = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (analyserFrameRef.current) cancelAnimationFrame(analyserFrameRef.current);
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  const startRecording = async () => {
    if (isRecording || isUploading) return;
    setSendError(null);
    setShowEmojiPicker(false);
    setShowGifPicker(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
  ? "audio/webm;codecs=opus"
  : MediaRecorder.isTypeSupported("audio/webm")
  ? "audio/webm"
  : "";

const recorder = mimeType
  ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 24000 })
  : new MediaRecorder(stream, { audioBitsPerSecond: 24000 });

      audioChunksRef.current = [];
      sampledWaveRef.current = [];
      recordStartRef.current = Date.now();
      setRecordSeconds(0);
      setIsRecording(true);

      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      const dataArr = new Uint8Array(analyser.frequencyBinCount);

      const tickWave = () => {
        analyser.getByteFrequencyData(dataArr);
        let sum = 0;
        for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
        const avg = sum / Math.max(1, dataArr.length);
        const pct = Math.max(18, Math.min(100, Math.round((avg / 140) * 100)));
        sampledWaveRef.current.push(pct);
        setLiveLevels((prev) => [...prev.slice(1), pct]);
        analyserFrameRef.current = requestAnimationFrame(tickWave);
      };
      tickWave();

      recordTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordStartRef.current) / 1000);
        setRecordSeconds(elapsed);
        if (elapsed >= 60) {
          stopAndSendRecording();
        }
      }, 250);

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(200);
    } catch {
      setSendError("Microphone permission denied or unavailable.");
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    cleanupAudioMonitor();
    const rec = mediaRecorderRef.current;
    if (rec) {
      rec.onstop = null;
      rec.stream?.getTracks().forEach((t) => t.stop());
      if (rec.state !== "inactive") rec.stop();
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const stopAndSendRecording = () => {
    const rec = mediaRecorderRef.current;
    if (!rec) return;

    cleanupAudioMonitor();
    const durationSec = Math.max(
      1,
      Math.round((Date.now() - recordStartRef.current) / 1000)
    );

    const rawSamples = sampledWaveRef.current;
    const targetBars = 26;
    const waveform: number[] = [];
    if (rawSamples.length === 0) {
      for (let i = 0; i < targetBars; i++) waveform.push(35);
    } else {
      for (let i = 0; i < targetBars; i++) {
        const idx = Math.min(
          rawSamples.length - 1,
          Math.floor((i / targetBars) * rawSamples.length)
        );
        waveform.push(rawSamples[idx]);
      }
    }

    rec.onstop = async () => {
      rec.stream?.getTracks().forEach((t) => t.stop());
      const blob = new Blob(audioChunksRef.current, {
        type: rec.mimeType || "audio/webm",
      });
      audioChunksRef.current = [];
      setIsRecording(false);
      setRecordSeconds(0);

      if (blob.size < 400) return;

      setIsUploading(true);
      setSendError(null);
      try {
        const file = new File([blob], `voice-note-${Date.now()}.webm`, {
          type: blob.type || "audio/webm",
        });

        const liveChannel =
          typeof channel?.sendFile === "function"
            ? channel
            : client && channel?.id
            ? client.channel(channel.type || "messaging", channel.id)
            : null;

        const currentUserId = String(
          client?.userID || (client?.user as any)?.id || ""
        );
        const resolvedChannelId = String(
          channel?.id || channel?.cid?.split(":").at(1) || ""
        );

        let assetUrl = "";

        // 1. Upload via server-side /api/upload first
        if (resolvedChannelId && currentUserId) {
          try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("channelType", String(channel?.type || "messaging"));
            fd.append("channelId", resolvedChannelId);
            fd.append("userId", currentUserId);
            fd.append("kind", "voice");

            const upRes = await fetch("/api/upload", {
              method: "POST",
              body: fd,
            });
            const upData = await upRes.json().catch(() => ({}));
            if (upRes.ok && upData?.url) {
              assetUrl = upData.url;
            }
          } catch {}
        }

        // 2. Fallback to browser channel.sendFile
        if (!assetUrl) {
          const liveChannel =
            typeof channel?.sendFile === "function"
              ? channel
              : client && resolvedChannelId
              ? client.channel(channel.type || "messaging", resolvedChannelId)
              : null;

          try {
            if (typeof liveChannel?.sendFile === "function") {
              const res = await liveChannel.sendFile(file);
              if (res?.file) assetUrl = res.file;
            }
          } catch {}
        }

        // 3. Final inline fallback for short clips
        if (!assetUrl && blob.size <= 65_000) {
          assetUrl = await new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result || ""));
            r.readAsDataURL(blob);
          });
        }

        try {
          if (typeof liveChannel?.sendFile === "function") {
            const res = await liveChannel.sendFile(file);
            if (res?.file) assetUrl = res.file;
          }
        } catch {}

        if (!assetUrl && blob.size <= 65_000) {
          assetUrl = await new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result || ""));
            r.readAsDataURL(blob);
          });
        }

        if (!assetUrl) {
          throw new Error(
            "Voice upload failed (enable File Uploads in Stream Dashboard for long recordings)."
          );
        }

        await sendPayload("", [
          {
            type: "leafsty_voice",
            asset_url: assetUrl,
            duration: durationSec,
            waveform,
            title: "Voice Message",
          },
        ]);
      } catch (err: any) {
        setSendError(err?.message || "Could not send voice message");
      } finally {
        setIsUploading(false);
      }
    };

    if (rec.state !== "inactive") {
      rec.stop();
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

    const trimmed = text.trim();
    if (trimmed.startsWith("/")) {
  const currentUserId = String(
    client?.userID || (client?.user as any)?.id || ""
  );
  const adminResult = await executeAdminCommand({
    rawText: trimmed,
    channel,
    client,
    currentUserId,
    sendAnnouncement: async (msg) => {
      await sendPayload(msg);
    },
  });
  if (adminResult.handled) {
    if (adminResult.error) {
      setSendError(adminResult.error);
    } else {
      setText("");
    }
    return;
  }
}
    if (trimmed.toLowerCase().startsWith("/poll")) {
      const rawPoll = trimmed.slice(5).trim();
      const parts = rawPoll
        .split("|")
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length < 3) {
        setSendError(
          "Format: /poll Question? | Option 1 | Option 2 (at least 2 options)"
        );
        return;
      }
      const [question, ...options] = parts;
      await sendPayload(`📊 ${question}`, [
        {
          type: "leafsty_poll",
          question,
          options: options.slice(0, 6),
        },
      ]);
      return;
    }

    if (trimmed.toLowerCase() === "/roll") {
      const rolled = Math.floor(Math.random() * 100) + 1;
      await sendPayload(`🎲 Rolled **${rolled}** (1–100)`);
      return;
    }

    if (trimmed.toLowerCase() === "/coinflip") {
      const side = Math.random() < 0.5 ? "Heads" : "Tails";
      await sendPayload(`🪙 Flipped **${side}**!`);
      return;
    }

    if (trimmed.toLowerCase().startsWith("/shrug")) {
      const rest = trimmed.slice(6).trim();
      await sendPayload(`${rest ? `${rest} ` : ""}¯\\_(ツ)_/¯`);
      return;
    }

    if (trimmed.toLowerCase().startsWith("/tableflip")) {
      const rest = trimmed.slice(10).trim();
      await sendPayload(`${rest ? `${rest} ` : ""}(╯°□°)╯︵ ┻━┻`);
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

   const [showSlashMenu, setShowSlashMenu] = useState(false);

  const canAdmin = useMemo(() => {
    const currentUserId = String(
      client?.userID || (client?.user as any)?.id || ""
    );
    const currentUserName = String((client?.user as any)?.name || "");
    return isLeafstyAdmin(
      currentUserId,
      String((client?.user as any)?.role || ""),
      [currentUserName]
    );
  }, [client]);

  const slashMatches = useMemo(() => {
    const trimmed = text.trimStart();
    if (!showSlashMenu && !trimmed.startsWith("/")) return [];

    if (showSlashMenu && !trimmed.startsWith("/")) {
      return canAdmin ? ADMIN_SLASH_COMMANDS : [];
    }

    const allCommands = canAdmin
      ? [...SLASH_COMMANDS, ...ADMIN_SLASH_COMMANDS]
      : SLASH_COMMANDS;

    const cmdToken = trimmed.split(/\s+/).at(0)?.toLowerCase() || "";
    const hasSpace = trimmed.includes(" ");
    if (hasSpace) {
      return allCommands.filter((c) => c.cmd === cmdToken);
    }
    return allCommands.filter((c) => c.cmd.startsWith(cmdToken));
  }, [text, canAdmin, showSlashMenu]);



  const handleSelectMention = (tag: string) => {
    setText((prev) => prev.replace(/(^|\s)@[a-zA-Z0-9_.-]*$/, `$1${tag} `));
    setMentionQuery(null);
    setMentionIndex(0);
    inputRef.current?.focus();
  };

  const activePreview = hoveredEmoji || displayedEmojis.at(0) || null;
  const channelLabel =
    (channel?.data as any)?.name || channel?.id || "encrypted chat";
  return (
    <div className="relative shrink-0 bg-[#081914] border-t border-emerald-500/15 px-4 py-3 text-emerald-50">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />

      {showGifPicker && (
        <div className="absolute bottom-full left-4 mb-2 z-40">
          <KlipyGifPicker
            onSelectGif={handleSelectGif}
            onClose={() => setShowGifPicker(false)}
          />
        </div>
      )}

         {showGames && (
     <div className="absolute bottom-full right-4 mb-2 z-40">
       <LeafstyGamesModal
         onClose={() => setShowGames(false)}
         onShareResult={async (summaryText) => {
           await sendPayload(summaryText);
         }}
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
                    activePreview
                      ? `:${activePreview.shortcode}:`
                      : `Search ${fullCatalog.length.toLocaleString()} emojis...`
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

          <div className="p-2.5 h-52 overflow-y-auto grid grid-cols-7 gap-1 content-start">
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
                    onFocus={() => setHoveredEmoji(item)}
                    onClick={() => handleInsertEmoji(ch)}
                    className="text-xl p-1 rounded-lg hover:bg-emerald-500/20 hover:scale-110 transition cursor-pointer flex items-center justify-center"
                  >
                    {ch}
                  </button>
                );
              })
            )}
          </div>

          <div className="px-3 py-2 bg-[#04120e] border-t border-emerald-500/15 flex items-center justify-between gap-2.5 min-h-[40px]">
            {activePreview ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-2xl leading-none">
                  {applyTone(activePreview)}
                </span>
                <div className="min-w-0">
                  <div className="font-mono text-xs font-bold text-emerald-200 truncate">
                    :{activePreview.shortcode}:
                  </div>
                  <div className="text-[10px] text-emerald-400/65 truncate capitalize">
                    {activePreview.name}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-[11px] text-emerald-400/70">
                Click an emoji to insert
              </span>
            )}
            <span className="text-[10px] text-emerald-400/55 shrink-0 font-mono">
              {fullCatalog.length.toLocaleString()}
            </span>
          </div>
        </div>
      )}

         {slashMatches.length > 0 && (
     <div className="mb-2 rounded-2xl bg-[#061410] border border-emerald-500/30 shadow-2xl overflow-hidden">
       <div className="px-3 py-1.5 bg-[#04120e] border-b border-emerald-500/15 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-emerald-400/80">
         <span>Leafsty Slash Commands</span>
         <span>Tab to autocomplete</span>
       </div>
       <div className="p-1.5 space-y-1">
         {slashMatches.map((item, idx) => {
           const tokens = item.usage.split(/\s+/).slice(1);
           return (
             <button
               key={item.cmd}
               type="button"
               onMouseEnter={() => setSlashIndex(idx)}
               onClick={() => {
                 setText(item.template);
                 inputRef.current?.focus();
               }}
               className={`w-full flex flex-col gap-1 px-2.5 py-2 rounded-xl text-left text-xs transition cursor-pointer ${
                 idx === slashIndex
                   ? "bg-emerald-500/25 text-white"
                   : "text-emerald-100/85 hover:bg-emerald-500/15"
               }`}
             >
               <div className="flex flex-wrap items-center gap-1.5">
                 <span className="font-mono font-extrabold text-emerald-300">
                   {item.cmd}
                 </span>
                 {tokens.map((tok, tIdx) => (
                   <span
                     key={tIdx}
                     className="px-1.5 py-0.5 rounded-md bg-[#0d261e] border border-emerald-400/35 font-mono text-[10px] font-bold text-emerald-200"
                   >
                     {tok.replace(/[\[\]]/g, "")}
                   </span>
                 ))}
               </div>
               <div className="text-[11px] text-emerald-200/75">
                 {item.desc}
               </div>
             </button>
           );
         })}

         {/* Quick member pills when typing /ban or /kick */}
         {(/^\/(ban|kick|unban)\s+/i.test(text.trimStart())) && (
           <div className="pt-1.5 mt-1 border-t border-emerald-500/15 px-2 pb-1 flex flex-wrap items-center gap-1.5">
             <span className="text-[10px] font-bold uppercase text-emerald-400/75">
               Select user:
             </span>
             {Object.values(channel?.state?.members || {})
               .map((m: any) => m?.user)
               .filter(
                 (u: any) =>
                   u?.id &&
                   String(u.id) !==
                     String(client?.userID || (client?.user as any)?.id || "")
               )
               .slice(0, 6)
               .map((u: any) => {
                 const cmdPrefix = text.trimStart().split(/\s+/)[0];
                 return (
                   <button
                     key={u.id}
                     type="button"
                     onClick={() => {
                       setText(`${cmdPrefix} ${u.id} `);
                       inputRef.current?.focus();
                     }}
                     className="px-2 py-0.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-400/30 text-[11px] font-bold text-emerald-100 cursor-pointer"
                   >
                     @{u.name || u.id}
                   </button>
                 );
               })}
           </div>
         )}
       </div>
     </div>
   )}


      {mentionQuery !== null && mentionCandidates.length > 0 && (
        <div className="mb-2 rounded-2xl bg-[#061410] border border-emerald-500/30 shadow-2xl overflow-hidden">
          <div className="px-3 py-1.5 bg-[#04120e] border-b border-emerald-500/15 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400/80">
            Members Matching @{mentionQuery}
          </div>
          <div className="p-1.5 space-y-0.5 max-h-48 overflow-y-auto">
            {mentionCandidates.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setMentionIndex(idx)}
                onClick={() => handleSelectMention(item.tag)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-xs transition cursor-pointer ${
                  idx === mentionIndex
                    ? "bg-emerald-500/25 text-white"
                    : "text-emerald-100/85 hover:bg-emerald-500/15"
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] flex items-center justify-center overflow-hidden shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    item.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="font-bold truncate">{item.name}</span>
                <span className="ml-auto font-mono text-[11px] text-emerald-400/80">
                  {item.tag}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      {pendingFiles.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-2 p-2 rounded-xl bg-[#061410] border border-emerald-500/20">
          {pendingFiles.map((item) => (
            <div
              key={item.id}
              className="relative group flex items-center gap-2 bg-[#0d261e] border border-emerald-500/25 rounded-xl p-1.5 pr-7 max-w-[200px]"
            >
              {item.isImage && item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-100 truncate">
                  {item.name}
                </div>
                <div className="text-[10px] text-emerald-400/70">
                  {formatFileSize(item.size)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removePendingFile(item.id)}
                title="Remove attachment"
                className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
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

         {isRecording ? (
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#0d261e] border border-red-400/50">
          <button
            type="button"
            onClick={cancelRecording}
            title="Discard Voice Note"
            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/35 text-red-300 transition cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-extrabold text-red-300 shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            {Math.floor(recordSeconds / 60)}:
            {recordSeconds % 60 < 10 ? "0" : ""}
            {recordSeconds % 60}
          </span>

          <div className="flex-1 flex items-center justify-center gap-1 h-7 overflow-hidden">
            {liveLevels.map((lvl, i) => (
              <span
                key={i}
                style={{ height: `${lvl}%` }}
                className="w-1 rounded-full bg-emerald-400 transition-all duration-75"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={stopAndSendRecording}
            title="Send Voice Message"
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Send</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Files or Images"
            className="p-2.5 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-emerald-300 hover:text-emerald-50 hover:border-emerald-400/50 transition cursor-pointer shrink-0 flex items-center justify-center"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onPaste={(e) => {
                const items = e.clipboardData?.files;
                if (items && items.length > 0) {
                  e.preventDefault();
                  addFiles(items);
                }
              }}
              onKeyDown={(e) => {
                if (slashMatches.length > 0) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSlashIndex((i) => (i + 1) % slashMatches.length);
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSlashIndex(
                      (i) =>
                        (i - 1 + slashMatches.length) % slashMatches.length
                    );
                    return;
                  }
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const picked = slashMatches.at(slashIndex);
                    if (picked) {
                      setText(picked.template);
                      setShowSlashMenu(false);
                    }
                    return;
                  }
                }
                if (mentionQuery !== null && mentionCandidates.length > 0) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setMentionIndex((i) => (i + 1) % mentionCandidates.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setMentionIndex(
                      (i) =>
                        (i - 1 + mentionCandidates.length) %
                        mentionCandidates.length
                    );
                  } else if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    const chosen = mentionCandidates.at(mentionIndex);
                    if (chosen) handleSelectMention(chosen.tag);
                  } else if (e.key === "Escape") {
                    setMentionQuery(null);
                  }
                }
              }}
              onChange={(e) => {
                const val = e.target.value;
                setText(val);
                setSlashIndex(0);
                const match = val.match(/(?:^|\s)@([a-zA-Z0-9_.-]*)$/);
                if (match) {
                  setMentionQuery(match.at(1) ?? "");
                  setMentionIndex(0);
                } else {
                  setMentionQuery(null);
                }
                if (val.trim()) {
                  channel?.keystroke?.().catch(() => {});
                } else {
                  channel?.stopTyping?.().catch(() => {});
                }
              }}
              placeholder={`Message ${channelLabel} or type /poll...`}
              className="w-full pl-3.5 pr-40 py-2.5 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50 placeholder:text-emerald-300/45 focus:outline-none focus:border-emerald-400"
            />

            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker(false);
                  setShowGifPicker(false);
                  setShowSlashMenu(false);
                  setShowGames((v) => !v);
                }}
                title="Leafsty Arcade Games"
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                  showGames
                    ? "bg-emerald-500/25 text-emerald-100"
                    : "text-emerald-300/70 hover:text-emerald-50 hover:bg-emerald-500/15"
                }`}
              >
                <Gamepad2 className="w-4 h-4" />
              </button>

                            {canAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setShowEmojiPicker(false);
                    setShowGifPicker(false);
                    setShowGames(false);
                    setShowSlashMenu((v) => !v);
                    setSlashIndex(0);
                    inputRef.current?.focus();
                  }}
                  title="Admin Slash Commands (/)"
                  className={`w-7 h-7 rounded-lg border font-mono text-xs font-extrabold flex items-center justify-center transition cursor-pointer ${
                    showSlashMenu || text.trimStart().startsWith("/")
                      ? "bg-emerald-500/30 border-emerald-400 text-emerald-100"
                      : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:text-emerald-50 hover:bg-emerald-500/25 hover:border-emerald-400/60"
                  }`}
                >
                  /
                </button>
              )}


              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker(false);
                  setShowGames(false);
                  setShowSlashMenu(false);
                  setShowGifPicker((v) => !v);
                }}
                title="GIFs & Favorites"
                className={`w-7 h-7 rounded-lg border text-[10px] font-extrabold tracking-tight flex items-center justify-center transition cursor-pointer ${
                  showGifPicker
                    ? "bg-emerald-500/30 border-emerald-400 text-emerald-100"
                    : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:text-emerald-50 hover:bg-emerald-500/25 hover:border-emerald-400/60"
                }`}
              >
                GIF
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowGifPicker(false);
                  setShowGames(false);
                  setShowSlashMenu(false);
                  setShowEmojiPicker((v) => !v);
                }}
                title="Emojis"
                className="w-7 h-7 rounded-lg text-emerald-300/70 hover:text-emerald-50 hover:bg-emerald-500/15 flex items-center justify-center transition cursor-pointer"
              >
                <Smile className="w-4 h-4" />
              </button>

              <Lock className="w-3.5 h-3.5 text-emerald-400/50 ml-0.5 pointer-events-none" />
            </div>
          </div>

          <button
            type="button"
            onClick={startRecording}
            disabled={isUploading}
            title="Record Voice Message"
            className="p-2.5 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-emerald-300 hover:text-emerald-50 hover:border-emerald-400/50 disabled:opacity-40 transition cursor-pointer shrink-0 flex items-center justify-center"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={isUploading || (!text.trim() && pendingFiles.length === 0)}
            title="Send Encrypted Message"
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition cursor-pointer shrink-0 flex items-center justify-center"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      )}
    </div>
  );
}
