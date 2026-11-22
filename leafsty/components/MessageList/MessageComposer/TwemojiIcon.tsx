"use client";

import React, { useState } from "react";

export function emojiToTwemojiUrl(emoji: string): string {
  const codePoints: string[] = [];
  for (const symbol of Array.from(emoji)) {
    const cp = symbol.codePointAt(0);
    if (!cp) continue;
    // Skip variation selector FE0F unless ZWJ (200D) is present
    if (cp === 0xfe0f && !emoji.includes("\u200d")) continue;
    codePoints.push(cp.toString(16));
  }
  return `https://jsdelivr.net{codePoints.join("-")}.svg`;
}

export function TwemojiText({ text }: { text: string }) {
  // Split string into emoji tokens vs plain text
  const parts = text.split(/(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|\p{Emoji_Modifier})*)/gu);

  return (
    <>
      {parts.map((part, idx) => {
        if (!part) return null;
        if (/\p{Extended_Pictographic}/u.test(part)) {
          return (
            <TwemojiChar
              key={idx}
              emoji={part}
              className="inline-block w-5 h-5 align-[-0.25em] mx-0.5 select-all"
            />
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </>
  );
}

export default function TwemojiChar({
  emoji,
  className = "w-6 h-6 inline-block",
}: {
  emoji: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="leading-none">{emoji}</span>;
  }

  return (
    <img
      src={emojiToTwemojiUrl(emoji)}
      alt={emoji}
      draggable={false}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
