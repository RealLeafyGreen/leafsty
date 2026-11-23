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
  X,
} from "lucide-react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "👀", "💀"];

export interface ReplyTarget {
  id: string;
  text: string;
  userName?: string;
}

export interface CustomMessageProps {
  message?: any;
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

  const currentUserId = String(client?.userID || client?.user?.id || "");
  const msgUser = message?.user || {};
  const senderId = String(msgUser.id || "");
  const senderName = msgUser.name || senderId || "LeafyUser";
  const senderImage = msgUser.image || "";
  const isOwn = senderId === currentUserId;

  const rawText = typeof message?.text === "string" ? message.text : "";
  const cidParts = String(message?.cid || "").split(":");
  const roomId = cidParts || "leafsty-default-room";

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
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    return parts.map((part, i) =>
      /^https?:\/\//.test(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-300 underline hover:text-emerald-200 break-all"
        >
          {part}
        </a>
      ) : (
        <TwemojiText key={i} text={part} />
      )
    );
  };
  return (
    <div className="group relative flex items-start gap-3 px-2 py-1.5 rounded-xl hover:bg-emerald-500/5 transition">
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
        <div className="flex items-center gap-2">
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

          {formattedTime && (
            <span className="text-[10px] text-emerald-300/50">
              {formattedTime}
            </span>
          )}

          <Lock className="w-2.5 h-2.5 text-emerald-400/40" />

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
                    text: shouldShowText ? displayBody : "GIF",
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
                className="hover:scale-125 transition-transform p-1 cursor-pointer flex items-center justify-center"
              >
                <TwemojiChar emoji={emoji} className="w-5 h-5" />
              </button>
            ))}
          </div>
        )}

        {message.quoted_message && (
          <div className="mt-1 mb-1.5 pl-2.5 border-l-2 border-emerald-400/50 text-[11px] text-emerald-300/70 truncate">
            <span className="font-bold text-emerald-200">
              {message.quoted_message.user?.name || "Reply"}:{" "}
            </span>
            <span>{message.quoted_message.text || "GIF"}</span>
          </div>
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
              const src = att?.image_url || att?.thumb_url || att?.asset_url;
              if (!src) return null;
              return (
                <img
                  key={idx}
                  src={src}
                  alt={att?.title || "GIF"}
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
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                  myReactions[emoji]
                    ? "bg-emerald-500/25 border-emerald-400/50 text-emerald-100"
                    : "bg-[#0d261e] border-emerald-500/20 text-emerald-200/80 hover:border-emerald-400/40"
                }`}
              >
                <TwemojiChar emoji={emoji} className="w-4 h-4" />
                <span className="text-[11px]">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
