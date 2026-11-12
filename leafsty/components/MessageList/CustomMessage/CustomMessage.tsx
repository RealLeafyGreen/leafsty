"use client";

import React, { useEffect, useState } from "react";
import { useDiscordContext } from "../../../types/DiscordContext";
import { decryptE2EEText } from "@/lib/e2ee";

export default function CustomMessage({
  msg,
  isMine,
}: {
  msg: any;
  isMine: boolean;
}) {
  const { activeChannel } = useDiscordContext();
  const [decryptedText, setDecryptedText] = useState<string>("");

  const rawText = msg?.text || "";
  const isEncrypted = rawText.startsWith("E2EE:");

  useEffect(() => {
    let active = true;

    async function runDecrypt() {
      if (!rawText) {
        setDecryptedText("");
        return;
      }
      if (!isEncrypted) {
        setDecryptedText(rawText);
        return;
      }
      try {
        const plain = await decryptE2EEText(
          rawText,
          activeChannel?.id || "leafsty"
        );
        if (active) setDecryptedText(plain);
      } catch (err) {
        console.warn("Skipping legacy encrypted message:", err);
        if (active) setDecryptedText("🔒 Encrypted with an earlier key");
      }
    }

    runDecrypt();
    return () => {
      active = false;
    };
  }, [rawText, isEncrypted, activeChannel?.id]);

  const senderName = msg?.user?.name || msg?.user?.id || "User";
  const initial = senderName.charAt(0).toUpperCase();

  return (
    <div
      className={`flex items-start gap-3 px-4 py-2 hover:bg-emerald-50/40 transition ${
        isMine ? "flex-row-reverse" : ""
      }`}
    >
      {msg?.user?.image ? (
        <img
          src={msg.user.image}
          alt={senderName}
          className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
          {initial}
        </div>
      )}

      <div
        className={`max-w-[70%] flex flex-col ${
          isMine ? "items-end" : "items-start"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-zinc-800">{senderName}</span>
          {isEncrypted && (
            <span
              title="End-to-End Encrypted"
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium"
            >
              🔒 E2EE
            </span>
          )}
        </div>

        <div
          className={`rounded-2xl px-3.5 py-2 text-sm shadow-2xs ${
            isMine
              ? "bg-emerald-600 text-white rounded-tr-xs"
              : "bg-[#f4f7f5] text-zinc-900 border border-emerald-100 rounded-tl-xs"
          }`}
        >
          {decryptedText || (isEncrypted ? "Decrypting..." : "")}
        </div>
      </div>
    </div>
  );
}
