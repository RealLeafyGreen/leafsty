"use client";

import React from "react";

export function toTwemojiCode(emoji: string): string {
  const cps: string[] = [];
  for (const sym of Array.from(emoji)) {
    const cp = sym.codePointAt(0);
    if (!cp) continue;
    if (cp === 0xfe0f && !emoji.includes("\u200d")) continue;
    cps.push(cp.toString(16).toLowerCase());
  }
  return cps.join("-");
}

export function Twemoji({
  emoji,
  className = "w-5 h-5 inline-block",
}: {
  emoji: string;
  className?: string;
}) {
  const code = toTwemojiCode(emoji);
  if (!code) return null;

  return (
    <img
      src={`/api/twemoji?code=${code}`}
      alt={emoji}
      draggable={false}
      className={className}
    />
  );
}

export function TwemojiText({ text }: { text: string }) {
  const parts = text.split(
    /(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|\p{Emoji_Modifier})*)/gu
  );

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        if (/\p{Extended_Pictographic}/u.test(part)) {
          return (
            <Twemoji
              key={i}
              emoji={part}
              className="inline-block w-5 h-5 align-[-0.25em] mx-0.5"
            />
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
