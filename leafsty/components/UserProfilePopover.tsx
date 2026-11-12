"use client";

import React, { useState } from "react";

export interface LeafstyProfileUser {
  id: string;
  name?: string;
  image?: string;
  statusText?: string;
  aboutMe?: string;
  createdAt?: string;
  roles?: string[];
  isCurrentUser?: boolean;
}

interface UserProfilePopoverProps {
  user: LeafstyProfileUser;
  onEditProfile?: () => void;
  onSendQuickMessage?: (text: string) => void;
  onClose?: () => void;
}

export default function UserProfilePopover({
  user,
  onEditProfile,
  onSendQuickMessage,
  onClose,
}: UserProfilePopoverProps) {
  const [note, setNote] = useState("");
  const [quickMessage, setQuickMessage] = useState("");
  const [imgError, setImgError] = useState(false);

  const displayName = user.name || user.id || "Leafsty Member";
  const initial = displayName.charAt(0).toUpperCase();
  const hasValidImage = Boolean(user.image && !imgError);

  const parsedDate = user.createdAt ? new Date(user.createdAt) : null;
  const memberSince =
    parsedDate && !isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Nov 12, 2026";

  const roles = user.roles?.length
    ? user.roles
    : ["Leafsty Member", "E2EE Verified"];

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMessage.trim()) return;
    onSendQuickMessage?.(quickMessage.trim());
    setQuickMessage("");
  };

  return (
    <div className="w-80 rounded-2xl bg-white text-zinc-800 shadow-xl border border-emerald-100 overflow-hidden select-none">
      {/* Botanical Leafsty Header Banner */}
      <div className="relative h-20 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-400">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/20 hover:bg-black/35 text-white text-xs flex items-center justify-center cursor-pointer transition"
          >
            ✕
          </button>
        )}
      </div>

      {/* Avatar + Leafsty Verification Badges */}
      <div className="px-4 pb-4">
        <div className="-mt-10 mb-3 flex items-end justify-between">
          <div className="relative">
            {hasValidImage ? (
              <img
                src={user.image}
                alt={displayName}
                onError={() => setImgError(true)}
                className="w-18 h-18 rounded-2xl border-4 border-white object-cover shadow-md bg-emerald-50"
              />
            ) : (
              <div className="w-18 h-18 rounded-2xl border-4 border-white bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                {initial}
              </div>
            )}
            <span
              title="Online"
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"
            />
          </div>

          {/* Badges with Hover Tooltips */}
          <div className="flex items-center gap-1.5 bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-1 rounded-full">
            <span title="End-to-End Encrypted" className="text-xs cursor-help">
              🔒
            </span>
            <span title="Early Leafsty Sprout" className="text-xs cursor-help">
              🌿
            </span>
            <span title="Verified Account" className="text-xs cursor-help">
              ✨
            </span>
          </div>
        </div>

        {/* Name, Handle & Custom Status */}
        <div className="mb-3">
          <h3 className="text-base font-bold text-zinc-900 leading-tight truncate">
            {displayName}
          </h3>
          <p className="text-xs text-zinc-500">@{user.id}</p>
          {user.statusText && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{user.statusText}</span>
            </div>
          )}
        </div>

        {/* Inner Leafsty Info Container */}
        <div className="rounded-xl bg-[#f7faf8] border border-emerald-100/80 p-3 space-y-3">
          {/* About Me */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-0.5">
              About Me
            </p>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {user.aboutMe ||
                "Chatting securely with end-to-end encryption on Leafsty."}
            </p>
          </div>

          {/* Member Since */}
          <div className="border-t border-emerald-100 pt-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-0.5">
              Leafsty Member Since
            </p>
            <p className="text-xs text-zinc-600">{memberSince}</p>
          </div>

          {/* Roles / Tags */}
          <div className="border-t border-emerald-100 pt-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1.5">
              Badges & Roles
            </p>
            <div className="flex flex-wrap gap-1.5">
              {roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white border border-emerald-200 text-emerald-800 shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Personal Note */}
          <div className="border-t border-emerald-100 pt-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
              Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Click to add a personal note..."
              className="w-full rounded-lg bg-white border border-emerald-100 px-2.5 py-1.5 text-xs text-zinc-700 placeholder:text-zinc-400 outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* Bottom Action: Edit Profile (for self) or Quick Message (for others) */}
        <div className="mt-3">
          {user.isCurrentUser ? (
            <button
              type="button"
              onClick={onEditProfile}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
            >
              Edit Leafsty Profile
            </button>
          ) : (
            <form onSubmit={handleQuickSubmit}>
              <input
                type="text"
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
                placeholder={`Message @${displayName}...`}
                className="w-full rounded-xl bg-[#f7faf8] border border-emerald-200 px-3 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-emerald-500"
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
