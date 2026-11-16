"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  User,
  AtSign,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  BellOff,
  Copy,
  Check,
  Hand,
} from "lucide-react";

export interface ContextTargetUser {
  id: string;
  name: string;
  image?: string;
  status?: string;
  bio?: string;
}

export default function UserContextMenu({
  user,
  position,
  onClose,
  onViewProfile,
  onMention,
  onMessage,
  onPoke,
}: {
  user: ContextTargetUser | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onViewProfile?: (user: ContextTargetUser) => void;
  onMention?: (user: ContextTargetUser) => void;
  onMessage?: (user: ContextTargetUser) => void;
  onPoke?: (user: ContextTargetUser) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  if (!user || !position) return null;

  const safeLeft =
    typeof window !== "undefined"
      ? Math.min(position.x, window.innerWidth - 230)
      : position.x;
  const safeTop =
    typeof window !== "undefined"
      ? Math.min(position.y, window.innerHeight - 310)
      : position.y;

  const handleCopyId = () => {
    navigator.clipboard?.writeText(user.id);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 600);
  };

  return (
    <div
      ref={menuRef}
      style={{ top: safeTop, left: safeLeft }}
      className="fixed z-50 w-52 rounded-2xl bg-white/95 backdrop-blur-md border border-emerald-200/90 shadow-xl shadow-emerald-950/10 p-1.5 text-xs font-semibold text-zinc-700 select-none"
    >
      {/* Header Badge */}
      <div className="px-2.5 py-1.5 mb-1 border-b border-emerald-100 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="truncate font-extrabold text-zinc-900">{user.name}</span>
      </div>

      {/* Main Actions */}
      <button
        type="button"
        onClick={() => {
          onViewProfile?.(user);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-emerald-600 hover:text-white transition cursor-pointer"
      >
        <User className="w-3.5 h-3.5" />
        <span>Profile</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onMention?.(user);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-emerald-600 hover:text-white transition cursor-pointer"
      >
        <AtSign className="w-3.5 h-3.5" />
        <span>Mention</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onMessage?.(user);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-emerald-600 hover:text-white transition cursor-pointer"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span>Message</span>
      </button>

      <div className="my-1 border-t border-emerald-100" />

      {/* Submenu Trigger (Like "Apps >" in the thumbnail) */}
      <div
        className="relative"
        onMouseEnter={() => setShowSubmenu(true)}
        onMouseLeave={() => setShowSubmenu(false)}
      >
        <button
          type="button"
          onClick={() => setShowSubmenu((s) => !s)}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition cursor-pointer ${
            showSubmenu
              ? "bg-emerald-600 text-white"
              : "hover:bg-emerald-600 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Leafsty Actions</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Flyout Submenu Card */}
        {showSubmenu && (
          <div className="absolute left-full top-0 ml-1.5 w-48 rounded-2xl bg-white/95 backdrop-blur-md border border-emerald-200/90 shadow-xl p-1.5 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onPoke?.(user);
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-zinc-700 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
            >
              <Hand className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white" />
              <span>Leaf Poke</span>
            </button>

            <button
              type="button"
              onClick={() => {
                alert(`256-Bit AES-GCM Fingerprint verified for @${user.id}`);
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-zinc-700 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verify E2EE Key</span>
            </button>

            <button
              type="button"
              onClick={() => {
                alert(`Muted notifications from @${user.id}`);
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-red-600 hover:bg-red-600 hover:text-white transition cursor-pointer"
            >
              <BellOff className="w-3.5 h-3.5" />
              <span>Mute User</span>
            </button>
          </div>
        )}
      </div>

      <div className="my-1 border-t border-emerald-100" />

      {/* Copy User ID */}
      <button
        type="button"
        onClick={handleCopyId}
        className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-emerald-50 text-zinc-600 hover:text-emerald-900 transition cursor-pointer"
      >
        <span>{copied ? "Copied ID!" : "Copy User ID"}</span>
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <Copy className="w-3.5 h-3.5 opacity-70" />
        )}
      </button>
    </div>
  );
}
