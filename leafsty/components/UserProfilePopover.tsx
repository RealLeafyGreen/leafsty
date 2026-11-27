"use client";

import React, { useState } from "react";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "../types/DiscordContext";
import { X, Send, Pencil, ShieldCheck, Calendar } from "lucide-react";
import {
  LeafstyStatusDot,
  PRESENCE_META,
  LeafstyPresence,
  getStoredPresence,
} from "./LeafstyStatusBadge";


export interface UserProfilePopoverProps {
  user: any;
  onClose?: () => void;
  onEditProfile?: () => void;
  onSendQuickMessage?: (text: string) => Promise<void> | void;
}

export interface LeafstyProfileUser {
  id: string;
  name?: string;
  image?: string;
  pronouns?: string;
  bio?: string;
  aboutMe?: string;
  status?: string;
  statusText?: string;
  isCurrentUser?: boolean;
  created_at?: string;
  roles?: string[];
  custom?: Record<string, any>;
  [key: string]: any;
}

function parseProfileDate(raw: any): Date | null {
  if (raw === undefined || raw === null || raw === "") return null;
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;
  const str = String(raw).trim();
  const num = Number(str);
  if (!Number.isNaN(num) && str !== "") {
    let ms = num;
    if (ms > 1e16) ms = Math.floor(ms / 1e6);
    else if (ms > 1e13) ms = Math.floor(ms / 1e3);
    else if (ms < 1e11) ms = ms * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function UserProfilePopover({
  user,
  onClose,
  onEditProfile,
  onSendQuickMessage,
}: UserProfilePopoverProps) {
  const { client } = useChatContext() as any;
  const discordCtx = useDiscordContext() as any;
  const activeChannel = discordCtx?.activeChannel || null;

  const [quickMessage, setQuickMessage] = useState("");
  const [sending, setSending] = useState(false);

  if (!user) return null;

  const displayName = user.name || user.id || "Leafsty User";
  const initial = String(displayName).charAt(0).toUpperCase();

  const liveMemberUser =
    activeChannel?.state?.members?.[String(user.id)]?.user ||
    (String(client?.user?.id || "") === String(user.id) ? client?.user : null);

  const savedLocal = (() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = JSON.parse(localStorage.getItem("leafsty_user") || "{}");
      return String(raw?.id || "") === String(user?.id || "") ? raw : {};
    } catch {
      return {};
    }
  })();

  const resolvedPronouns =
    user?.pronouns ||
    liveMemberUser?.pronouns ||
    user?.custom?.pronouns ||
    savedLocal?.pronouns ||
    "";
  const resolvedStatus =
    user?.statusText ||
    user?.status ||
    liveMemberUser?.status ||
    user?.custom?.status ||
    savedLocal?.statusText ||
    savedLocal?.status ||
    "";
  const resolvedBio =
    user?.aboutMe ||
    user?.bio ||
    liveMemberUser?.bio ||
    user?.custom?.bio ||
    savedLocal?.aboutMe ||
    savedLocal?.bio ||
    "";

  const parsedDate =
    parseProfileDate(user?.created_at) ||
    parseProfileDate(user?.createdAt) ||
    parseProfileDate(liveMemberUser?.created_at) ||
    parseProfileDate(liveMemberUser?.createdAt) ||
    parseProfileDate(savedLocal?.created_at);

  const memberSince = parsedDate
    ? parsedDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently joined";
const isViewingSelf =
  String(user?.id || "") === String(client?.user?.id || client?.userID || "");
const rawPresence: LeafstyPresence = isViewingSelf
  ? getStoredPresence()
  : liveMemberUser?.invisible || user?.invisible
  ? "offline"
  : ((liveMemberUser?.presence_status ||
      user?.presence_status ||
      (liveMemberUser?.online || user?.online
        ? "online"
        : "offline")) as LeafstyPresence);

  
    const roles = user.roles?.length
    ? user.roles
    : ["Leafsty Member", "E2EE Verified"];

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMessage.trim() || sending) return;
    setSending(true);
    try {
      await onSendQuickMessage?.(quickMessage.trim());
      setQuickMessage("");
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="w-80 rounded-2xl bg-white text-zinc-800 shadow-xl border border-emerald-100 overflow-hidden select-none">
      {/* Botanical Leafsty Header Banner */}
      <div className="relative h-20 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-400">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Close Profile"
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/25 hover:bg-black/40 text-white transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="-mt-10 mb-3 flex items-end justify-between">
          <div className="relative">
            {user.image ? (
              <img
                src={user.image}
                alt={displayName}
                className="w-18 h-18 rounded-2xl border-4 border-white object-cover bg-emerald-600 shadow-md"
              />
            ) : (
              <div className="w-18 h-18 rounded-2xl border-4 border-white bg-emerald-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-md">
                {initial}
              </div>
            )}
                       <span
              title={PRESENCE_META[rawPresence]?.label || "Online"}
              className="absolute -bottom-1 -right-1"
            >
              <LeafstyStatusDot
                status={rawPresence}
                size="md"
                ringColor="#ffffff"
              />
            </span>
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

        {/* Name, Handle, Pronouns & Custom Status */}
        <div className="mb-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-zinc-900 leading-tight truncate">
              {displayName}
            </h3>
            {onEditProfile && (
              <button
                type="button"
                onClick={onEditProfile}
                title="Edit Profile"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition cursor-pointer shrink-0"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <p className="text-xs text-zinc-500">@{user.id}</p>
                     <span className="text-zinc-300">•</span>
         <span className="text-xs font-semibold text-zinc-600">
           {rawPresence === "offline"
             ? "Offline"
             : PRESENCE_META[rawPresence]?.label || "Online"}
         </span>
            {resolvedPronouns && (
              <>
                <span className="text-zinc-300">•</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.2 rounded-full">
                  {resolvedPronouns}
                </span>
              </>
            )}
          </div>

          {resolvedStatus && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{resolvedStatus}</span>
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
              {resolvedBio ||
                "Chatting securely with end-to-end encryption on Leafsty."}
            </p>
          </div>

          {/* Member Since */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-0.5">
              Leafsty Member Since
            </p>
            <p className="text-xs text-zinc-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{memberSince}</span>
            </p>
          </div>

          {/* Roles */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
              Roles
            </p>
            <div className="flex flex-wrap gap-1.5">
              {roles.map((role: string, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-[11px] font-semibold text-emerald-800"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>{role}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick DM Input */}
        {onSendQuickMessage && (
          <form onSubmit={handleQuickSubmit} className="mt-3 flex gap-1.5">
            <input
              type="text"
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              placeholder={`Message @${user.id}...`}
              className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!quickMessage.trim() || sending}
              title="Send Direct Message"
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
