"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";

const BANNERS = [
  "from-[#064e3b] via-[#059669] to-[#10b981]",
  "from-[#022c22] via-[#065f46] to-[#0d9488]",
  "from-[#047857] via-[#10b981] to-[#34d399]",
  "from-[#091510] via-[#064e3b] to-[#059669]",
];

const RING_MAP: Record<string, string> = {
  none: "ring-4 ring-[#0b1914]",
  emerald: "ring-4 ring-emerald-400 shadow-lg shadow-emerald-500/40",
  mint: "ring-4 ring-teal-300 shadow-lg shadow-teal-400/40",
  gold: "ring-4 ring-amber-400 shadow-lg shadow-amber-500/40",
};

interface UserCardProps {
  user: any;
  isCurrentUser?: boolean;
  onClose?: () => void;
  onEdit?: () => void;
  onSaveProfile?: (data: any) => Promise<void> | void;
}

export default function UserCard({
  user,
  isCurrentUser = true,
  onClose,
  onEdit,
  onSaveProfile,
}: UserCardProps) {
  const userId = user?.id || "user";
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user?.name || userId);
  const [status, setStatus] = useState(user?.status || "Encrypted • Online");
  const [bio, setBio] = useState(
    user?.bio || "Messaging privately with AES-256 E2EE on Leafsty."
  );
  const [banner, setBanner] = useState(user?.banner || BANNERS.at(0)!);
  const [note, setNote] = useState("");

  useEffect(() => {
    setName(user?.name || userId);
    setStatus(user?.status || "Encrypted • Online");
    setBio(user?.bio || "Messaging privately with AES-256 E2EE on Leafsty.");
    setBanner(user?.banner || BANNERS.at(0)!);
    if (typeof window !== "undefined") {
      setNote(localStorage.getItem(`leafsty_note_${userId}`) || "");
    }
  }, [user, userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveProfile) {
      setEditing(false);
      return;
    }
    try {
      setSaving(true);
      await onSaveProfile({
        name: name.trim() || userId,
        status: status.trim(),
        bio: bio.trim(),
        banner,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const ringClass = RING_MAP[user?.decoration || "emerald"] || RING_MAP.emerald;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[360px] rounded-3xl bg-[#0b1914] border border-emerald-500/30 shadow-2xl overflow-hidden text-white"
      >
        <div className={`h-24 bg-gradient-to-r ${banner} relative`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 flex items-end justify-between -mt-10 mb-3 relative">
          <div className="relative">
            <div
              className={`w-20 h-20 rounded-full bg-emerald-600 text-white font-black text-2xl flex items-center justify-center uppercase overflow-hidden ${ringClass}`}
            >
              {user?.image ? (
                <img
                  src={user.image}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                (name || "L").slice(0, 1)
              )}
            </div>
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-[3px] border-[#0b1914]" />
          </div>

          <div className="flex items-center gap-1.5 pt-11">
            <div className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-emerald-500/25 px-2.5 py-1 text-xs">
              <span title="256-Bit AES-GCM E2EE Verified" className="text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
              <span title="Leafsty Pioneer">🌿</span>
            </div>
            {isCurrentUser && (
              <button
                type="button"
                onClick={() => (onEdit ? onEdit() : setEditing(!editing))}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-extrabold text-white transition cursor-pointer"
              >
                {editing ? "Cancel" : "Edit Profile"}
              </button>
            )}
          </div>
        </div>

        <div className="mx-3.5 mb-3.5 rounded-2xl bg-[#10241d] border border-emerald-500/20 p-4 space-y-3">
          <div>
            <h2 className="text-lg font-black leading-tight">
              {user?.name || userId}
            </h2>
            <p className="text-xs font-mono text-zinc-400">
              @{userId} {user?.pronouns && <span>• {user.pronouns}</span>}
            </p>
            {user?.status && (
              <p className="mt-2 text-xs text-emerald-300 bg-emerald-500/15 border border-emerald-500/25 rounded-xl px-2.5 py-1 font-medium">
                {user.status}
              </p>
            )}
          </div>

          <div className="h-px bg-emerald-500/15" />

          {editing ? (
            <form onSubmit={handleSave} className="space-y-2.5">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Display Name"
                className="w-full rounded-xl bg-black/35 border border-emerald-500/25 px-3 py-2 text-xs text-white outline-none"
              />
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Custom Status"
                className="w-full rounded-xl bg-black/35 border border-emerald-500/25 px-3 py-2 text-xs text-white outline-none"
              />
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="About Me"
                className="w-full rounded-xl bg-black/35 border border-emerald-500/25 px-3 py-2 text-xs text-white outline-none resize-none"
              />
              <div className="grid grid-cols-4 gap-1.5">
                {BANNERS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBanner(b)}
                    className={`h-7 rounded-lg bg-gradient-to-r ${b} border-2 cursor-pointer ${
                      banner === b ? "border-white" : "border-transparent opacity-70"
                    }`}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-extrabold text-white cursor-pointer"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </form>
          ) : (
            <>
              <div>
                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                  About Me
                </h3>
                <p className="text-xs text-zinc-200 mt-0.5 leading-relaxed">
                  {user?.bio || "Messaging privately with AES-256 E2EE on Leafsty."}
                </p>
              </div>
              <div>
                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 mb-1">
                  Badges & Roles
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(user?.roles || ["Leafsty Member", "E2EE Verified"]).map((r: string) => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/5 border border-emerald-500/25 text-[11px] font-semibold text-emerald-200"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 mb-1">
                  Private Note
                </h3>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    localStorage.setItem(`leafsty_note_${userId}`, e.target.value);
                  }}
                  placeholder="Click to add a private note..."
                  className="w-full rounded-xl bg-black/30 border border-emerald-500/20 px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-emerald-400"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
