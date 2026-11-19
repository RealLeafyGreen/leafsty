"use client";

import React, { useEffect, useState } from "react";
import { useChatContext } from "stream-chat-react";
import * as e2ee from "../../../lib/e2ee";
import { CornerUpLeft, Lock } from "lucide-react";

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
  const [decryptedText, setDecryptedText] = useState<string>("");

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
  if (!message) return null;

  const formattedTime = (() => {
    const rawDate = message.created_at || message.createdAt;
    if (!rawDate) return "";
    try {
      return new Date(rawDate).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
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

  const handleOpenUser = () => {
    if (!senderId) return;
    onSelectUser?.({
      id: senderId,
      name: senderName,
      image: senderImage || undefined,
    });
  };
  return (
    <div className="group flex items-start gap-3 px-2 py-1.5 rounded-xl hover:bg-emerald-500/5 transition">
      <button
        type="button"
        onClick={handleOpenUser}
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
            onClick={handleOpenUser}
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
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-emerald-300/60 hover:text-emerald-50 hover:bg-emerald-500/15 transition cursor-pointer ml-auto"
            >
              <CornerUpLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {message.quoted_message && (
          <div className="mt-1 mb-1.5 pl-2.5 border-l-2 border-emerald-400/50 text-[11px] text-emerald-300/70 truncate">
            <span className="font-bold text-emerald-200">
              {message.quoted_message.user?.name || "Reply"}:{" "}
            </span>
            <span>{message.quoted_message.text || "GIF"}</span>
          </div>
        )}

        {shouldShowText && (
          <p className="mt-0.5 text-sm text-emerald-50/95 whitespace-pre-wrap break-words leading-relaxed">
            {displayBody}
          </p>
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
      </div>
    </div>
  );
}
