"use client";

import { useEffect } from "react";

export default function TwemojiObserver() {
  useEffect(() => {
    let rafId: number | null = null;

    const runTwemojiParse = () => {
      const tw = (window as any).twemoji;
      if (!tw?.parse || !document.body) return;
      tw.parse(document.body, {
        folder: "svg",
        ext: ".svg",
      });
    };

    const scheduleParse = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        runTwemojiParse();
      });
    };

    runTwemojiParse();
    const interval = window.setInterval(runTwemojiParse, 800);

    const observer = new MutationObserver(() => {
      scheduleParse();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      window.clearInterval(interval);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  return null;
}
