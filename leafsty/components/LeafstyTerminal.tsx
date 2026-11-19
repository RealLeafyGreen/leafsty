"use client";

import React, { useEffect, useRef, useState } from "react";
import { Terminal as TerminalIcon, X, Trash2 } from "lucide-react";

interface TerminalLine {
  id: string;
  type: "cmd" | "out" | "err";
  text: string;
}

interface LeafstyTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  activeChannelId?: string;
}

export default function LeafstyTerminal({
  isOpen,
  onClose,
  currentUserId,
  activeChannelId,
}: LeafstyTerminalProps) {
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: "welcome-1",
      type: "out",
      text: "Leafsty E2EE Developer Shell v1.0 — Type 'help' or run 'curl <url>'.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  if (!isOpen) return null;

  const pushLine = (type: TerminalLine["type"], text: string) => {
    setLines((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, type, text },
    ]);
  };

  const runCommand = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    pushLine("cmd", `leafsty@e2ee:~$ ${cmd}`);
    setInput("");

    const lower = cmd.toLowerCase();

    if (lower === "clear") {
      setLines([]);
      return;
    }

    if (lower === "help") {
      pushLine(
        "out",
        [
          "Available commands:",
          "  help                     Show this command list",
          "  whoami                   Show current authenticated Leafsty user",
          "  channel                  Show active Stream channel ID",
          "  ping                     Check API latency to ://realleafygreen.com",
          "  curl <url>               Fetch an endpoint (e.g. curl /api/gifs)",
          "  curl -X POST <url> -d '<json>'  Send a JSON POST request",
          "  clear                    Clear terminal output",
        ].join("\n")
      );
      return;
    }

    if (lower === "whoami") {
      pushLine("out", `user_id: ${currentUserId || "guest"}`);
      return;
    }

    if (lower === "channel") {
      pushLine("out", `active_channel: ${activeChannelId || "none selected"}`);
      return;
    }

    if (lower === "ping") {
      const t0 = performance.now();
      try {
        const res = await fetch("/api/gifs");
        const ms = Math.round(performance.now() - t0);
        pushLine("out", `PONG /api/gifs — HTTP ${res.status} (${ms}ms)`);
      } catch (e: any) {
        pushLine("err", `PING failed: ${e?.message || "network error"}`);
      }
      return;
    }

    if (lower.startsWith("curl ")) {
      try {
        setRunning(true);
        const args = cmd.slice(5).trim();
        const isPost = /\s-X\s+POST\b/i.test(` ${args}`);
        const dataMatch = args.match(/(?:-d|--data)\s+(['"])([\s\S]*?)\1/);
        const urlMatch = args.match(/(https?:\/\/[^\s'"]+|\/[^\s'"]+)/);

        if (!urlMatch) {
          pushLine("err", "curl: missing URL (example: curl /api/gifs)");
          return;
        }

        const targetUrl = urlMatch[1];
        const bodyPayload = dataMatch ? dataMatch[2] : undefined;

        const res = await fetch(targetUrl, {
          method: isPost ? "POST" : "GET",
          headers: bodyPayload ? { "Content-Type": "application/json" } : undefined,
          body: isPost ? bodyPayload : undefined,
        });

        const textBody = await res.text();
        let formatted = textBody;
        try {
          formatted = JSON.stringify(JSON.parse(textBody), null, 2);
        } catch {}

        pushLine(
          res.ok ? "out" : "err",
          `HTTP/1.1 ${res.status} ${res.statusText}\n${formatted.slice(0, 2500)}`
        );
      } catch (err: any) {
        pushLine(
          "err",
          `curl: (6) Could not resolve or reach host — ${err?.message || "CORS / network blocked"}`
        );
      } finally {
        setRunning(false);
      }
      return;
    }

    pushLine("err", `command not found: ${cmd.split(" ")}. Type 'help'.`);
  };

  return (
    <div className="h-64 shrink-0 bg-[#040f0b] border-t border-emerald-500/30 flex flex-col font-mono text-xs text-emerald-100 z-40">
      <div className="px-3 py-1.5 bg-[#061611] border-b border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-300 font-bold">
          <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>Leafsty Terminal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLines([])}
            title="Clear Terminal"
            className="p-1 rounded hover:bg-emerald-500/15 text-emerald-300/70 hover:text-emerald-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close Terminal"
            className="p-1 rounded hover:bg-emerald-500/15 text-emerald-300/70 hover:text-emerald-50 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {lines.map((line) => (
          <pre
            key={line.id}
            className={`whitespace-pre-wrap break-all leading-relaxed ${
              line.type === "cmd"
                ? "text-emerald-400 font-bold"
                : line.type === "err"
                ? "text-red-300"
                : "text-emerald-100/90"
            }`}
          >
            {line.text}
          </pre>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runCommand(input);
        }}
        className="px-3 py-2 bg-[#061611] border-t border-emerald-500/15 flex items-center gap-2"
      >
        <span className="text-emerald-400 font-bold shrink-0">
          leafsty@e2ee:~$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={running}
          placeholder="Type 'help' or 'curl /api/gifs'..."
          className="flex-1 bg-transparent text-emerald-50 placeholder:text-emerald-300/35 focus:outline-none"
        />
      </form>
    </div>
  );
}
