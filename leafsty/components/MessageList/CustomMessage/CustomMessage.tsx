"use client";

import React, { useEffect, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../../../types/DiscordContext";
import * as e2ee from "../../../lib/e2ee";
import VoiceNotePlayer from "../VoiceNotePlayer";
import PollCard from "../PollCard";
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

function formatMessageDateTime(rawDate: any): string {
  if (rawDate === undefined || rawDate === null || rawDate === "") return "";

  let parsed: Date;
  if (rawDate instanceof Date) {
    parsed = rawDate;
  } else if (typeof rawDate === "number") {
    parsed = new Date(rawDate < 1e12 ? rawDate * 1000 : rawDate);
  } else {
    const asNum = Number(rawDate);
    if (!Number.isNaN(asNum) && String(rawDate).trim() !== "") {
      parsed = new Date(asNum < 1e12 ? asNum * 1000 : asNum);
    } else {
      parsed = new Date(String(rawDate));
    }
  }

  if (Number.isNaN(parsed.getTime())) return "";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMsg = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  );
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfMsg.getTime()) / (1000 * 60 * 60 * 24)
  );

  const timeStr = parsed.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (diffDays === 0) return `Today at ${timeStr}`;
  if (diffDays === 1) return `Yesterday at ${timeStr}`;

  const dateStr = parsed.toLocaleDateString([], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${dateStr} ${timeStr}`;
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
        if (k.startsWith("poll_vote_")) continue;
        if (typeof v === "number" && v > 0) counts[k] = v;
      }
    }
    if (Array.isArray(message?.own_reactions)) {
      for (const r of message.own_reactions) {
        if (r?.type && !String(r.type).startsWith("poll_vote_")) {
          mine[String(r.type)] = true;
        }
      }
    }
    setLocalReactions(counts);
    setMyReactions(mine);
  }, [message?.id, message?.reaction_counts, message?.own_reactions]);

  if (!message) return null;

  const formattedDateTime = formatMessageDateTime(
    message.created_at ??
      message.createdAt ??
      message.updated_at ??
      message.timestamp ??
      Date.now()
  );

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
    Boolean(
      att?.image_url ||
        att?.thumb_url ||
        att?.asset_url ||
        att?.type === "leafsty_poll" ||
        att?.type === "leafsty_voice"
    )
  );

  const hasPollAttachment = attachments.some(
    (att: any) => att?.type === "leafsty_poll"
  );

  const displayBody = (decryptedText || rawText).trim();
  const shouldShowText =
    Boolean(displayBody) &&
    !hasPollAttachment &&
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
    const tokenRegex =
      /(https?:\/\/[^\s]+|@[a-zA-Z0-9_.-]+|\*\*\*[^*\n]+?\*\*\*|\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|~~[^~\n]+?~~|`[^`\n]+?`|\|\|[^|\n]+?\|\|)/g;

    const tokens = text.split(tokenRegex);
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

      if (part.startsWith("***") && part.endsWith("***") && part.length > 6) {
        return (
          <strong key={i} className="font-extrabold italic text-white">
            {part.slice(3, -3)}
          </strong>
        );
      }

      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return (
          <strong key={i} className="font-extrabold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return (
          <em key={i} className="italic text-emerald-100">
            {part.slice(1, -1)}
          </em>
        );
      }

      if (part.startsWith("~~") && part.endsWith("~~") && part.length > 4) {
        return (
          <del key={i} className="line-through text-emerald-300/60">
            {part.slice(2, -2)}
          </del>
        );
      }

      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded-md bg-[#04120e] border border-emerald-500/25 font-mono text-xs text-emerald-200"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      if (part.startsWith("||") && part.endsWith("||") && part.length > 4) {
        return (
          <span
            key={i}
            onClick={(e) => {
              e.currentTarget.classList.remove("bg-emerald-950", "text-transparent");
              e.currentTarget.classList.add("bg-emerald-500/20", "text-emerald-100");
            }}
            title="Click to reveal spoiler"
            className="px-1.5 py-0.5 rounded-md bg-emerald-950 text-transparent select-none cursor-pointer transition"
          >
            {part.slice(2, -2)}
          </span>
        );
      }

      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  return (
    <div
      id={`msg-${message.id}`}
      className="group relative flex items-start gap-3 px-2 py-1.5 rounded-xl hover:bg-emerald-500/5 transition-colors duration-300"
    >
      <button
        type="button"
        onClick={() =>
          senderId &&
          onSelectUser?.({
            id: senderId,
            name: senderName,
            image: senderImage || undefined,
          })
        }
        className="w-9 h-9 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center overflow-hidden shrink-0 mt-0.5 cursor-pointer hover:ring-2 hover:ring-emerald-400/50 transition"
      >
        {senderImage ? (
          <img
            src={senderImage}
            alt={senderName}
            className="w-full h-full object-cover"
          />
        ) : (
          senderName.charAt(0).toUpperCase()
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              senderId &&
              onSelectUser?.({
                id: senderId,
                name: senderName,
                image: senderImage || undefined,
              })
            }
            className={`text-xs font-extrabold hover:underline cursor-pointer ${
              isOwn ? "text-emerald-300" : "text-emerald-50"
            }`}
          >
            {senderName}
          </button>

          {formattedDateTime && (
            <span className="text-[10px] text-emerald-300/55 font-medium">
              {formattedDateTime}
            </span>
          )}

          <Lock className="w-2.5 h-2.5 text-emerald-400/40" />

          {isOwn && seenByUsers.length > 0 && (
            <span
              title={`Seen by ${seenByUsers.map((u) => u.name).join(", ")}`}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Seen</span>
            </span>
          )}

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-auto bg-[#081914] border border-emerald-500/20 rounded-lg px-1 py-0.5 transition">
            <button
              type="button"
              onClick={() => setShowReactBar((v) => !v)}
              title="Add Reaction"
              className="p-1 rounded text-emerald-300/75 hover:text-emerald-50 hover:bg-emerald-500/15 cursor-pointer"
            >
              <SmilePlus className="w-3.5 h-3.5" />
            </button>

            {onReply && (
              <button
                type="button"
                onClick={() =>
                  onReply({
                    id: String(message.id),
                    text: shouldShowText
                      ? displayBody
                      : hasPollAttachment
                      ? "Live Poll"
                      : "Attachment",
                    userName: senderName,
                  })
                }
                title="Reply"
                className="p-1 rounded text-emerald-300/75 hover:text-emerald-50 hover:bg-emerald-500/15 cursor-pointer"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {isOwn && shouldShowText && !isEditing && (
              <button
                type="button"
                onClick={() => {
                  setEditDraft(displayBody);
                  setIsEditing(true);
                }}
                title="Edit Message"
                className="p-1 rounded text-emerald-300/75 hover:text-emerald-50 hover:bg-emerald-500/15 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {showReactBar && (
          <div className="mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-[#061410] border border-emerald-500/30 shadow-lg">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleToggleReaction(emoji)}
                className="text-base hover:scale-125 transition-transform px-1 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {message.quoted_message && (
          <button
            type="button"
            onClick={() => {
              const targetEl = document.getElementById(
                `msg-${message.quoted_message.id}`
              );
              if (targetEl) {
                targetEl.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                targetEl.classList.add("bg-emerald-500/20");
                setTimeout(
                  () => targetEl.classList.remove("bg-emerald-500/20"),
                  1400
                );
              }
            }}
            className="mt-1 mb-1.5 flex items-center gap-1.5 pl-2.5 py-1 pr-3 rounded-lg bg-[#0d261e]/80 border-l-2 border-emerald-400 text-[11px] text-emerald-300/80 hover:text-emerald-100 hover:bg-[#0d261e] max-w-full transition cursor-pointer text-left"
          >
            <CornerUpLeft className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="font-extrabold text-emerald-200 shrink-0">
              @{message.quoted_message.user?.name || "Reply"}
            </span>
            <span className="truncate opacity-85">
              {message.quoted_message.text || "Attachment"}
            </span>
          </button>
        )}

        {isEditing ? (
          <div className="mt-1.5 flex items-center gap-1.5">
            <input
              type="text"
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") setIsEditing(false);
              }}
              autoFocus
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#0d261e] border border-emerald-400 text-sm text-emerald-50 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveEdit}
              title="Save Edit"
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              title="Cancel"
              className="p-1.5 rounded-lg bg-[#0d261e] text-emerald-300 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          shouldShowText && (
            <p className="mt-0.5 text-sm text-emerald-50/95 whitespace-pre-wrap break-words leading-relaxed">
              {renderFormattedText(displayBody)}
              {isEdited && (
                <span className="ml-1.5 text-[10px] text-emerald-300/45">
                  (edited)
                </span>
              )}
            </p>
          )
        )}
        {attachments.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {attachments.map((att: any, idx: number) => {
              if (att?.type === "leafsty_poll" && Array.isArray(att?.options)) {
                return (
                  <PollCard
                    key={idx}
                    message={message}
                    question={String(att.question || "Poll")}
                    options={att.options.map(String)}
                    activeChannel={activeChannel}
                  />
                );
              }

              if (att?.type === "leafsty_voice" && att?.asset_url) {
                return (
                  <VoiceNotePlayer
                    key={idx}
                    src={att.asset_url}
                    duration={Number(att.duration || 0)}
                    waveform={att.waveform}
                  />
                );
              }

              if (att?.type === "leafsty_call") {
                return (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-400/35 text-xs font-bold text-emerald-100"
                  >
                    <span>
                      {att.callerName || senderName} started a{" "}
                      {att.withVideo ? "video" : "voice"} call
                    </span>
                  </div>
                );
              }

              const imgSrc = att?.image_url || att?.thumb_url;
              const fileHref = att?.asset_url || imgSrc;
              if (!fileHref) return null;

              const isFileCard =
                att?.type === "file" || (!imgSrc && Boolean(att?.asset_url));

              if (isFileCard) {
                const sizeBytes = Number(att?.file_size || 0);
                const sizeLabel =
                  sizeBytes >= 1024 * 1024
                    ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                    : sizeBytes > 0
                    ? `${(sizeBytes / 1024).toFixed(1)} KB`
                    : "Attachment";

                return (
                  <a
                    key={idx}
                    href={fileHref}
                    download={att?.title || "attachment"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-[#0d261e] border border-emerald-500/25 hover:border-emerald-400/60 transition max-w-xs sm:max-w-sm"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-emerald-100 truncate">
                        {att?.title || "File Attachment"}
                      </div>
                      <div className="text-[10px] text-emerald-400/70">
                        {sizeLabel}
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-emerald-300/75 shrink-0" />
                  </a>
                );
              }

              return (
                <img
                  key={idx}
                  src={imgSrc}
                  alt={att?.title || "Attachment"}
                  loading="lazy"
                  className="max-w-xs sm:max-w-sm max-h-72 rounded-2xl border border-emerald-500/20 object-contain bg-[#061410]"
                />
              );
            })}
          </div>
        )}

        {Object.keys(localReactions).length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {Object.entries(localReactions).map(([emoji, count]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleToggleReaction(emoji)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                  myReactions[emoji]
                    ? "bg-emerald-500/25 border-emerald-400/50 text-emerald-100"
                    : "bg-[#0d261e] border-emerald-500/20 text-emerald-200/80 hover:border-emerald-400/40"
                }`}
              >
                <span>{emoji}</span>
                <span className="text-[11px]">{count}</span>
              </button>
            ))}
          </div>
        )}

        {isOwn && seenByUsers.length > 0 && (
          <div className="mt-1 flex items-center justify-end gap-1">
            {seenByUsers.map((reader) => (
              <div
                key={reader.id}
                title={`Seen by ${reader.name}`}
                className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[8px] font-extrabold flex items-center justify-center overflow-hidden ring-1 ring-[#0a1d17]"
              >
                {reader.image ? (
                  <img
                    src={reader.image}
                    alt={reader.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  reader.name.charAt(0).toUpperCase()
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
