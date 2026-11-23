"use client";

import { useEffect } from "react";

export default function TwemojiObserver() {
  useEffect(() => {
    let isParsing = false;
    let timer: number | null = null;

    const runTwemojiParse = () => {
      if (isParsing) return;
      const tw = (window as any).twemoji;
      if (!tw?.parse || !document.body) return;

      isParsing = true;
      try {
        tw.parse(document.body, {
          base: "https://jsdelivr.net",
          folder: "svg",
          ext: ".svg",
        });
      } finally {
        isParsing = false;
      }
    };

    const scheduleParse = () => {
      if (timer !== null) return;
      timer = window.setTimeout(() => {
        timer = null;
        runTwemojiParse();
      }, 120);
    };

    runTwemojiParse();
    const poll = window.setInterval(runTwemojiParse, 1000);

    const observer = new MutationObserver((mutations) => {
      if (isParsing) return;
      const hasTextOrElementChange = mutations.some(
        (m) =>
          m.type === "characterData" ||
          Array.from(m.addedNodes).some(
            (n) => !(n instanceof HTMLImageElement && n.classList.contains("emoji"))
          )
      );
      if (hasTextOrElementChange) {
        scheduleParse();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      window.clearInterval(poll);
      if (timer !== null) window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return null;
}
