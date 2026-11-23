"use client";

import React, { useEffect, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../../../types/DiscordContext";
import * as e2ee from "../../../lib/e2ee";
import {
  CornerUpLeft,
  Lock,
  Pencil,
  SmilePlus,
  Check,
  CheckCheck,
  X,
  FileText,
  Download,
} from "lucide-react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "👀", "💀"];

export interface ReplyTarget {
  id: string;
  text: string;
  userName?: string;
}

export interface CustomMessageProps {
  message?: any;
  isLastOwnMessage?: boolean;
  onReply?: (target: ReplyTarget) => void;
  onSelectUser?: (user: { id: string; name: string; image?: string }) => void;
}

export default function CustomMessage({
  message,
  onReply,
  onSelectUser,
}: CustomMessageProps) {
  const { client } = useChatContext() as any;
  const discordCtx = useDiscordContext() as any;
  const activeChannel = discordCtx?.activeChannel || null;

  const [decryptedText, setDecryptedText] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const [showReactBar, setShowReactBar] = useState(false);
  const [localReactions, setLocalReactions] = useState<Record<string, number>>(
    {}
  );
  const [myReactions, setMyReactions] = useState<Record<string, boolean>>({});
  const [, setReadTick] = useState(0);

  const currentUserId = String(client?.userID || client?.user?.id || "");
  const myUsername = String(
    (client?.user as any)?.name || currentUserId || ""
  ).toLowerCase();

  const msgUser = message?.user || {};
  const senderId = String(msgUser.id || "");
  const senderName = msgUser.name || senderId || "LeafyUser";
  const senderImage = msgUser.image || "";
  const isOwn = senderId === currentUserId;

  const rawText = typeof message?.text === "string" ? message.text : "";
  const cidParts = String(message?.cid || "").split(":");
  const roomId = cidParts.at(1) || "leafsty-default-room";

  useEffect(() => {
    if (!activeChannel?.on) return;
    const bump = () => setReadTick((t) => t + 1);
    const sub = activeChannel.on("message.read", bump);
    return () => sub?.unsubscribe?.();
  }, [activeChannel]);

  useEffect(() => {
    let cancelled = false;
    if (!rawText) {
      setDecryptedText("");
      return;
    }

    (async () => {
      try {
        const mod = e2ee as any;
        const decryptFn =
          mod.decryptRoomText ||
          mod.decryptMessage ||
          mod.decryptText ||
          mod.decrypt;
        const plain =
          typeof decryptFn === "function"
            ? await decryptFn(rawText, roomId)
            : rawText;
        if (!cancelled) {
          setDecryptedText(typeof plain === "string" && plain ? plain : rawText);
        }
      } catch {
        if (!cancelled) {
          setDecryptedText(rawText);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rawText, roomId]);

  useEffect(() => {
    const counts: Record<string, number> = {};
    const mine: Record<string, boolean> = {};

    if (message?.reaction_counts && typeof message.reaction_counts === "object") {
      for (const [k, v] of Object.entries(message.reaction_counts)) {
        if (typeof v === "number" && v > 0) counts[k] = v;
      }
    }
    if (Array.isArray(message?.own_reactions)) {
      for (const r of message.own_reactions) {
        if (r?.type) mine[String(r.type)] = true;
      }
    }
    setLocalReactions(counts);
    setMyReactions(mine);
  }, [message?.id, message?.reaction_counts, message?.own_reactions]);

  if (!message) return null;

  const formattedTime = (() => {
    const rawDate =
      message.created_at ?? message.createdAt ?? message.updated_at;
    if (!rawDate) return "";
    const parsed =
      rawDate instanceof Date
        ? rawDate
        : typeof rawDate === "number"
        ? new Date(rawDate)
        : new Date(String(rawDate));
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  })();

  const seenByUsers = (() => {
    if (!isOwn || !activeChannel?.state?.read || !message.created_at) return [];
    const msgTime = new Date(message.created_at).getTime();
    if (Number.isNaN(msgTime)) return [];

    const stateMessages: any[] = Array.isArray(activeChannel.state.messages)
      ? activeChannel.state.messages
      : [];
    const nextOwnMsg = stateMessages.find(
      (m: any) =>
        String(m?.user?.id || "") === currentUserId &&
        new Date(m?.created_at || 0).getTime() > msgTime
    );
    const nextOwnTime = nextOwnMsg
      ? new Date(nextOwnMsg.created_at).getTime()
      : Infinity;

    const readers: Array<{ id: string; name: string; image?: string }> = [];
    for (const [uid, entry] of Object.entries(
      activeChannel.state.read as Record<string, any>
    )) {
      if (!uid || uid === currentUserId) continue;
      const readTime = entry?.last_read
        ? new Date(entry.last_read).getTime()
        : 0;
      if (readTime >= msgTime && readTime < nextOwnTime) {
        readers.push({
          id: uid,
          name: entry?.user?.name || uid,
          image: entry?.user?.image,
        });
      }
    }
    return readers;
  })();

  const attachments = Array.isArray(message.attachments)
    ? message.attachments
    : [];

  const hasMediaAttachment = attachments.some((att: any) =>
    Boolean(att?.image_url || att?.thumb_url || att?.asset_url)
  );

  const displayBody = (decryptedText || rawText).trim();
  const shouldShowText =
    Boolean(displayBody) &&
    !(displayBody.toUpperCase() === "GIF" && hasMediaAttachment);

  const isEdited = Boolean(
    message.message_text_updated_at ||
      (message.updated_at &&
        message.created_at &&
        new Date(message.updated_at).getTime() -
          new Date(message.created_at).getTime() >
          2000)
  );

  const handleToggleReaction = async (emoji: string) => {
    setShowReactBar(false);
    const already = Boolean(myReactions[emoji]);

    setMyReactions((prev) => ({ ...prev, [emoji]: !already }));
    setLocalReactions((prev) => {
      const nextCount = Math.max(0, (prev[emoji] || 0) + (already ? -1 : 1));
      const copy = { ...prev };
      if (nextCount === 0) delete copy[emoji];
      else copy[emoji] = nextCount;
      return copy;
    });

    try {
      if (already) {
        await activeChannel?.deleteReaction?.(message.id, emoji);
      } else {
        await activeChannel?.sendReaction?.(message.id, { type: emoji });
      }
    } catch {}
  };

  const handleSaveEdit = async () => {
    const nextText = editDraft.trim();
    if (!nextText || nextText === displayBody) {
      setIsEditing(false);
      return;
    }
    setDecryptedText(nextText);
    setIsEditing(false);
    try {
      await client?.updateMessage?.({
        id: message.id,
        text: nextText,
      });
    } catch {}
  };

  const renderFormattedText = (text: string) => {
    const tokens = text.split(/(https?:\/\/[^\s]+|@[a-zA-Z0-9_.-]+)/g);
    return tokens.map((part, i) => {
      if (!part) return null;

      if (/^https?:\/\//.test(part)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 underline hover:text-emerald-200 break-all"
          >
            {part}
          </a>
        );
      }

      if (/^@[a-zA-Z0-9_.-]+$/.test(part)) {
        const handle = part.slice(1).toLowerCase();
        const isMe =
          handle === "everyone" ||
          handle === "here" ||
          (myUsername && handle === myUsername) ||
          (currentUserId && handle === currentUserId.toLowerCase());

        return (
          <span
            key={i}
            className={`inline-block px-1.5 py-0.2 rounded-md font-bold transition ${
              isMe
                ? "bg-amber-400/25 text-amber-200 border border-amber-400/40"
                : "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
            }`}
          >
            {part}
          </span>
        );
      }

      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

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
