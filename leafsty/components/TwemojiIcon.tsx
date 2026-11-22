"use client";

import React, { useState } from "react";

export function emojiToTwemojiCode(emoji: string): string {
  const codePoints: string[] = [];
  for (const symbol of Array.from(emoji)) {
    const cp = symbol.codePointAt(0);
    if (!cp) continue;
    if (cp === 0xfe0f && !emoji.includes("\u200d")) continue;
    codePoints.push(cp.toString(16));
  }
  return codePoints.join("-");
}

export function getTwemojiUrls(emoji: string): string[] {
  const code = emojiToTwemojiCode(emoji);
  return [
    `https://cloudflare.com{code}.svg`,
    `https://jsdelivr.net{code}.svg`,
  ];
}

export function isEmojiOnlyMessage(text: string): boolean {
  const stripped = text.replace(/\s+/g, "");
  if (!stripped) return false;
  const withoutEmojis = stripped.replace(
    /(\p{Extended_Pictographic}|\uFE0F|\u200D|\p{Emoji_Modifier}|[\u{1F1E6}-\u{1F1FF}])/gu,
    ""
  );
  return withoutEmojis.length === 0;
}

export function TwemojiText({
  text,
  jumbo = false,
}: {
  text: string;
  jumbo?: boolean;
}) {
  const parts = text.split(
    /((?:[\u{1F1E6}-\u{1F1FF}]{2})|\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|\p{Emoji_Modifier})*)/gu
  );

  return (
    <>
      {parts.map((part, idx) => {
        if (!part) return null;
        if (/(\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]{2})/u.test(part)) {
          return (
            <TwemojiChar
              key={idx}
              emoji={part}
              className={
                jumbo
                  ? "inline-block w-11 h-11 align-middle mx-0.5 select-all"
                  : "inline-block w-5 h-5 align-[-0.25em] mx-0.5 select-all"
              }
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
  const urls = getTwemojiUrls(emoji);
  const [urlIndex, setUrlIndex] = useState(0);

  if (urlIndex >= urls.length) {
    return <span className="leading-none">{emoji}</span>;
  }

  return (
    <img
      src={urls[urlIndex]}
      alt={emoji}
      draggable={false}
      loading="lazy"
      onError={() => setUrlIndex((i) => i + 1)}
      className={className}
    />
  );
}
