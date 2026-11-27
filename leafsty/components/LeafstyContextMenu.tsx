"use client";

import React, { useEffect, useState } from "react";
import {
  Copy,
  CornerUpLeft,
  User,
  Hash,
  RefreshCw,
  Settings,
  Gamepad2,
  Trash2,
} from "lucide-react";

interface ContextItem {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}

export default function LeafstyContextMenu() {
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    items: ContextItem[];
  } | null>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Allow native right-click inside text inputs/textareas so spellcheck & paste work normally
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      e.preventDefault();

      const items: ContextItem[] = [];
      const selectedText = window.getSelection()?.toString().trim() || "";

      // 1. Selected text copy
      if (selectedText) {
        items.push({
          label: "Copy Selected Text",
          icon: <Copy className="w-3.5 h-3.5" />,
          onClick: () => navigator.clipboard?.writeText(selectedText),
        });
      }

      // 2. Right-clicked inside a chat message ([id^="msg-"])
      const msgEl = target.closest('[id^="msg-"]') as HTMLElement | null;
      if (msgEl) {
        const msgId = msgEl.id.replace(/^msg-/, "");
        const rawText =
          msgEl.querySelector("p")?.innerText?.trim() ||
          msgEl.innerText?.trim() ||
          "";

        if (rawText) {
          items.push({
            label: "Copy Message Text",
            icon: <Copy className="w-3.5 h-3.5" />,
            onClick: () => navigator.clipboard?.writeText(rawText),
          });
        }

        items.push({
          label: "Copy Message ID",
          icon: <Hash className="w-3.5 h-3.5" />,
          onClick: () => navigator.clipboard?.writeText(msgId),
        });

        // Trigger existing Reply button inside the message if available
        const replyBtn = msgEl.querySelector(
          'button[title="Reply"]'
        ) as HTMLButtonElement | null;
        if (replyBtn) {
          items.push({
            label: "Reply to Message",
            icon: <CornerUpLeft className="w-3.5 h-3.5" />,
            onClick: () => replyBtn.click(),
          });
        }

        // Trigger existing Delete button if it's your own message
        const deleteBtn = msgEl.querySelector(
          'button[title="Delete Message"]'
        ) as HTMLButtonElement | null;
        if (deleteBtn) {
          items.push({
            label: "Delete Message",
            icon: <Trash2 className="w-3.5 h-3.5" />,
            danger: true,
            onClick: () => deleteBtn.click(),
          });
        }
      }

      // 3. Right-clicked a user avatar/name button
      const profileBtn = target.closest(
        'button[title*="Profile"]'
      ) as HTMLButtonElement | null;
      if (profileBtn) {
        items.push({
          label: "View Profile",
          icon: <User className="w-3.5 h-3.5" />,
          onClick: () => profileBtn.click(),
        });
      }

      // 4. Universal Leafsty Quick Actions
      items.push(
        {
          label: "Open Leafsty Arcade",
          icon: <Gamepad2 className="w-3.5 h-3.5" />,
          onClick: () =>
            window.dispatchEvent(new Event("leafsty:toggle-games")),
        },
        {
          label: "User Settings",
          icon: <Settings className="w-3.5 h-3.5" />,
          onClick: () =>
            window.dispatchEvent(new Event("leafsty:open-settings")),
        },
        {
          label: "Refresh Workspace",
          icon: <RefreshCw className="w-3.5 h-3.5" />,
          onClick: () => window.location.reload(),
        }
      );

      // Keep menu inside viewport edges
      const menuW = 210;
      const menuH = items.length * 36 + 16;
      const x = Math.min(e.clientX, window.innerWidth - menuW - 8);
      const y = Math.min(e.clientY, window.innerHeight - menuH - 8);

      setMenu({ x: Math.max(8, x), y: Math.max(8, y), items });
    };

    const closeMenu = () => setMenu(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (!menu) return null;

  return (
    <div
      style={{ top: menu.y, left: menu.x }}
      onClick={(e) => e.stopPropagation()}
      className="fixed z-[9999] w-52 rounded-2xl bg-[#061410]/95 backdrop-blur-md border border-emerald-500/35 shadow-2xl p-1.5 text-emerald-50 select-none"
    >
      {menu.items.map((item, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => {
            setMenu(null);
            item.onClick();
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left transition cursor-pointer ${
            item.danger
              ? "text-red-300 hover:bg-red-500/20 hover:text-red-100"
              : "text-emerald-100/90 hover:bg-emerald-500/20 hover:text-white"
          }`}
        >
          <span className={item.danger ? "text-red-400" : "text-emerald-400"}>
            {item.icon}
          </span>
          <span className="truncate">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
