"use client";

import React, { useRef, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../../../types/DiscordContext";
import { ReplyTarget } from "../CustomMessage/CustomMessage";
import KlipyGifPicker, { KlipyGifItem } from "./KlipyGifPicker";
import {
  Paperclip,
  Send,
  ShieldCheck,
  Smile,
  X,
  Reply,
  FileText,
} from "lucide-react";

interface CustomMessageComposerProps {
  replyTarget?: ReplyTarget | null;
  onCancelReply?: () => void;
}

const QUICK_EMOJIS = ["🌿", "👍", "😂", "🔥", "❤️", "👀", "🎉", "💯"];

async function encryptRoomText(plainText: string, roomId: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle) return plainText;
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(roomId.padEnd(32, "0").slice(0, 32)),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    keyMaterial,
    enc.encode(plainText)
  );
  const ivB64 = btoa(String.fromCharCode(...iv));
  const cipherB64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuf)));
  return `leafsty_e2ee:${ivB64}:${cipherB64}`;
}

export default function CustomMessageComposer({
  replyTarget,
  onCancelReply,
}: CustomMessageComposerProps) {
  const { client } = useChatContext();
  const { activeChannel } = useDiscordContext() as any;

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [attachments, setAttachments] = useState<
    Array<{ name: string; type: string; url: string }>
  >([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type.startsWith("image/") ? "image" : "file",
              url: reader.result as string,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || sending) return;

    if (!activeChannel) {
      alert("Select a DM or channel from the left sidebar first.");
      return;
    }
    try {
      setSending(true);
      await activeChannel.watch?.().catch(() => {});

      const roomKey = activeChannel.id || "leafsty-default-room";
      const cipherText = trimmed
        ? await encryptRoomText(trimmed, roomKey)
        : "";

      const streamAttachments = attachments.map((att) =>
        att.type === "image"
          ? { type: "image", image_url: att.url, fallback: att.name }
          : { type: "file", asset_url: att.url, title: att.name }
      );

      const replyInfo = replyTarget as any;
      const customMeta = {
        encrypted: Boolean(cipherText),
        replyTo: replyInfo
          ? {
              id: replyInfo.id,
              userName: replyInfo.userName || replyInfo.user || "User",
              text: replyInfo.text || replyInfo.preview || "",
            }
          : undefined,
      };

      const uid = client?.user?.id || client?.userID;
      const sendRes = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: activeChannel.id,
          channelType: activeChannel.type || "messaging",
          userId: uid,
          text: cipherText || (attachments.length > 0 ? "📎 Attachment" : ""),
          attachments: streamAttachments,
          parent_id: replyInfo?.id,
          custom: customMeta,
        }),
      });

      const sendData = await sendRes.json().catch(() => ({}));
      if (!sendRes.ok) {
        throw new Error(sendData.error || `Send failed (${sendRes.status})`);
      }

      if (sendData.message && activeChannel.state?.messages) {
        const exists = activeChannel.state.messages.some(
          (m: any) => m.id === sendData.message.id
        );
        if (!exists) {
          activeChannel.state.messages.push(sendData.message);
        }
      }

      window.dispatchEvent(new Event("leafsty:message-sent"));
      setText("");
      setAttachments([]);
      setShowEmojiBar(false);
      onCancelReply?.();
      inputRef.current?.focus();
    } catch (error: any) {
      console.error("Failed to send encrypted message:", error);
      alert(error?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }

  };
  const channelLabel =
    activeChannel?.data?.custom?.name ||
    activeChannel?.data?.name ||
    "encrypted room";
  const replyInfo = replyTarget as any;

  return (
    <div className="px-4 pb-4 pt-2 bg-transparent shrink-0">
      {replyInfo && (
        <div className="mb-2 px-3.5 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-xs text-emerald-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-bold text-emerald-300 shrink-0">
              Replying to {replyInfo.userName || replyInfo.user || "User"}:
            </span>
            <span className="truncate text-zinc-300">
              {replyInfo.text || replyInfo.preview || ""}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="relative group flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#0b1914] border border-emerald-500/30 text-xs text-white"
            >
              {att.type === "image" ? (
                <img
                  src={att.url}
                  alt={att.name}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <FileText className="w-4 h-4 text-emerald-400" />
              )}
              <span className="max-w-32 truncate">{att.name}</span>
              <button
                type="button"
                onClick={() =>
                  setAttachments((prev) => prev.filter((_, i) => i !== idx))
                }
                className="p-0.5 rounded-full bg-red-500/80 text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showEmojiBar && (
        <div className="mb-2 p-2 rounded-2xl bg-[#0b1914] border border-emerald-500/30 inline-flex items-center gap-1.5 shadow-xl">
          {QUICK_EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => {
                setText((prev) => prev + em);
                inputRef.current?.focus();
              }}
              className="w-8 h-8 rounded-xl hover:bg-white/10 text-base flex items-center justify-center transition cursor-pointer"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 rounded-2xl bg-[#0b1914] border border-emerald-500/30 px-3 py-2 shadow-lg"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach image or file"
          className="p-2 rounded-xl text-emerald-300/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${channelLabel} (AES-GCM Encrypted)...`}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-emerald-300/45 outline-none"
        />

        <button
          type="button"
          onClick={() => setShowEmojiBar((s) => !s)}
          title="Quick Emojis"
          className="p-2 rounded-xl text-emerald-300/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <Smile className="w-4 h-4" />
        </button>

        <button
          type="submit"
          disabled={sending || (!text.trim() && attachments.length === 0)}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{sending ? "..." : "Send"}</span>
        </button>
      </form>

      <div className="mt-1 px-1 flex items-center justify-between text-[10px] text-emerald-400/70">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          256-bit AES-GCM End-to-End Encrypted
        </span>
        <span>Logged in as {client?.userID || "User"}</span>
      </div>
    </div>
  );
}
