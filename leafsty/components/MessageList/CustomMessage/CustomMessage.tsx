"use client";

import React, { useEffect, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../../../types/DiscordContext";
import {
  Reply,
  Copy,
  Check,
  Trash2,
  ShieldCheck,
  FileText,
  CornerUpLeft,
} from "lucide-react";

export interface ReplyTarget {
  id: string;
  userName?: string;
  user?: string;
  text?: string;
  preview?: string;
}

interface CustomMessageProps {
  message: any;
  onReply?: (target: ReplyTarget) => void;
  onSelectUser?: (user: { id: string; name: string; image?: string }) => void;
}

async function decryptRoomText(rawText: string, roomId: string): Promise<string> {
  if (!rawText) return "";
  if (!rawText.startsWith("leafsty_e2ee:")) return rawText;
  try {
    const parts = rawText.split(":");
    const ivB64 = parts[1];
    const cipherB64 = parts[2];
    if (!ivB64 || !cipherB64 || typeof window === "undefined" || !window.crypto?.subtle) {
      return rawText;
    }
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(roomId.padEnd(32, "0").slice(0, 32)),
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
    const cipherBytes = Uint8Array.from(atob(cipherB64), (c) => c.charCodeAt(0));
    const plainBuf = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      keyMaterial,
      cipherBytes
    );
    return new TextDecoder().decode(plainBuf);
  } catch (err) {
    console.error("Failed to decrypt message:", err);
    return rawText;
  }
}

function renderTextWithMentions(text: string) {
  const parts = text.split(/(@[a-zA-Z0-9_.-]+)/g);
  return parts.map((part, idx) =>
    part.startsWith("@") && part.length > 1 ? (
      <span
        key={idx}
        className="px-1.5 py-0.5 rounded-md bg-emerald-500/25 text-emerald-300 font-bold"
      >
        {part}
      </span>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    )
  );
}
export default function CustomMessage({
  message,
  onReply,
  onSelectUser,
}: CustomMessageProps) {
  const { client } = useChatContext();
  const { activeChannel } = useDiscordContext() as any;

  const [decryptedText, setDecryptedText] = useState<string>(message?.text || "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const raw = String(message?.text || "");
    const roomId =
      activeChannel?.id ||
      (typeof message?.cid === "string" ? message.cid.split(":")[1] : "") ||
      "leafsty-default-room";

    if (!raw.startsWith("leafsty_e2ee:")) {
      setDecryptedText(raw);
      return;
    }

    decryptRoomText(raw, roomId).then((plain) => {
      if (!cancelled) setDecryptedText(plain);
    });

    return () => {
      cancelled = true;
    };
  }, [message?.text, message?.cid, activeChannel?.id]);

  if (!message) return null;

  const sender = message.user || {};
  const senderId = sender.id || message.user_id || "user";
  const senderName = sender.name || senderId;
  const senderAvatar = sender.image || "";
  const isOwn =
    String(senderId).toLowerCase() === String(client?.userID || "").toLowerCase();

  const myId = String(client?.userID || "").toLowerCase();
  const myName = String((client?.user as any)?.name || myId).toLowerCase();
  const lowerText = decryptedText.toLowerCase();
  const mentionsMe =
    Boolean(myId) &&
    !isOwn &&
    (lowerText.includes(`@${myId}`) ||
      lowerText.includes(`@${myName}`) ||
      lowerText.includes("@everyone"));

  const isEncrypted =
    Boolean(message?.custom?.encrypted) ||
    String(message?.text || "").startsWith("leafsty_e2ee:");

  const replyMeta = message?.custom?.replyTo;
  const attachments = Array.isArray(message.attachments) ? message.attachments : [];

      const formattedTime = (() => {
    const raw: any =
      message?.created_at ||
      (message as any)?.createdAt ||
      (message as any)?.timestamp;
    if (!raw) return "Just now";

    let d: Date;
    if (raw instanceof Date) {
      d = raw;
    } else if (typeof raw === "number" || /^\d+$/.test(String(raw))) {
      const num = Number(raw);
      // Handle nanoseconds (19 digits), microseconds (16 digits), milliseconds (13 digits), or seconds (10 digits)
      const ms =
        num > 1e17
          ? Math.floor(num / 1e6)
          : num > 1e14
          ? Math.floor(num / 1e3)
          : num < 1e11
          ? num * 1000
          : num;
      d = new Date(ms);
    } else {
      d = new Date(raw);
    }

    if (Number.isNaN(d.getTime())) return "Just now";

    const isToday = d.toDateString() === new Date().toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString([], { month: "short", day: "numeric" }) +
          " · " +
          d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  })();


  const handleCopy = () => {
    navigator.clipboard?.writeText(decryptedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleDelete = async () => {
    if (!client || !message.id) return;
    try {
      await (client as any).deleteMessage?.(message.id);
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };
  return (
    <div
      className={`group relative flex items-start gap-3 px-4 py-2 rounded-2xl transition ${
        mentionsMe
          ? "bg-amber-500/12 border-l-2 border-amber-400"
          : "hover:bg-emerald-500/5"
      }`}
    >
      <button
        type="button"
        onClick={() =>
          onSelectUser?.({
            id: senderId,
            name: senderName,
            image: senderAvatar || undefined,
          })
        }
        className="w-9 h-9 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center overflow-hidden shrink-0 mt-0.5 cursor-pointer"
      >
        {senderAvatar ? (
          <img
            src={senderAvatar}
            alt={senderName}
            className="w-full h-full object-cover"
          />
        ) : (
          senderName.charAt(0).toUpperCase()
        )}
      </button>

      <div className="min-w-0 flex-1">
        {replyMeta && (
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-emerald-300/75 bg-emerald-950/60 border border-emerald-500/20 rounded-lg px-2.5 py-1 max-w-md">
            <CornerUpLeft className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="font-bold text-emerald-300 shrink-0">
              {replyMeta.userName}:
            </span>
            <span className="truncate text-zinc-300">{replyMeta.text}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onSelectUser?.({
                id: senderId,
                name: senderName,
                image: senderAvatar || undefined,
              })
            }
            className="text-xs font-extrabold text-emerald-200 hover:underline cursor-pointer"
          >
            {senderName}
          </button>
          {formattedTime && (
            <span className="text-[10px] text-emerald-300/50">{formattedTime}</span>
          )}
          {isEncrypted && (
            <span
              title="256-bit AES-GCM Encrypted"
              className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400/80"
            >
              <ShieldCheck className="w-3 h-3" />
            </span>
          )}
        </div>

        {decryptedText && (
          <div className="mt-0.5 text-sm text-zinc-100 whitespace-pre-wrap break-words leading-relaxed">
            {renderTextWithMentions(decryptedText)}
          </div>
        )}

        {attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map((att: any, idx: number) =>
              att.type === "image" && att.image_url ? (
                <img
                  key={idx}
                  src={att.image_url}
                  alt={att.fallback || "attachment"}
                  className="max-h-60 rounded-xl border border-emerald-500/25 object-cover"
                />
              ) : (
                <a
                  key={idx}
                  href={att.asset_url || att.image_url || "#"}
                  download={att.title || "file"}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0b1914] border border-emerald-500/30 text-xs text-emerald-200 hover:bg-emerald-500/15"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>{att.title || "Download File"}</span>
                </a>
              )
            )}
          </div>
        )}
      </div>

      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 rounded-xl bg-[#0b1914] border border-emerald-500/30 p-1 shadow-lg transition">
        <button
          type="button"
          onClick={() =>
            onReply?.({
              id: message.id,
              userName: senderName,
              text: decryptedText,
            })
          }
          title="Reply"
          className="p-1.5 rounded-lg text-zinc-300 hover:text-emerald-300 hover:bg-white/10 transition cursor-pointer"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleCopy}
          title="Copy Text"
          className="p-1.5 rounded-lg text-zinc-300 hover:text-emerald-300 hover:bg-white/10 transition cursor-pointer"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        {isOwn && (
          <button
            type="button"
            onClick={handleDelete}
            title="Delete Message"
            className="p-1.5 rounded-lg text-zinc-300 hover:text-red-400 hover:bg-red-500/15 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
