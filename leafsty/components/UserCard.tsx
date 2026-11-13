"use client";

import React, { useEffect, useState } from "react";

const BANNERS = [
  "from-emerald-800 via-emerald-600 to-teal-500",
  "from-teal-800 via-emerald-700 to-lime-600",
  "from-zinc-900 via-emerald-950 to-emerald-800",
  "from-green-900 via-emerald-800 to-cyan-700",
];

interface UserCardProps {
  user: any;
  isCurrentUser?: boolean;
  onClose: () => void;
  onSaveProfile?: (data: any) => Promise<void> | void;
}

export default function UserCard({
  user,
  isCurrentUser = true,
  onClose,
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
  const [banner, setBanner] = useState(user?.banner || BANNERS);
  const [note, setNote] = useState("");
  const [dm, setDm] = useState("");

  useEffect(() => {
    setName(user?.name || userId);
    setStatus(user?.status || "Encrypted • Online");
    setBio(user?.bio || "Messaging privately with AES-256 E2EE on Leafsty.");
    setBanner(user?.banner || BANNERS);
    setNote(localStorage.getItem(`leafsty_note_${userId}`) || "");
  }, [user, userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveProfile) return setEditing(false);
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

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[340px] rounded-2xl bg-[#f3f8f5] border border-emerald-200 shadow-2xl overflow-hidden text-zinc-900"
      >
        <div className={`h-24 bg-gradient-to-r ${banner} relative`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/40 text-white text-sm cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="px-4 flex items-end justify-between -mt-10 mb-3 relative">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-[5px] border-[#f3f8f5] bg-emerald-600 text-white font-extrabold text-2xl flex items-center justify-center uppercase shadow-md">
              {(name || "L").slice(0, 1)}
            </div>
            <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-[#f3f8f5]" />
          </div>

          <div className="flex items-center gap-1.5 pt-11">
            <div className="flex gap-1 rounded-xl bg-white border border-emerald-100 px-2 py-1 text-xs">
              <span title="E2EE Verified">🔒</span>
              <span title="Leafsty Pioneer">🌿</span>
            </div>
            {isCurrentUser && (
              <button
                type="button"
                onClick={() => setEditing(!editing)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
              >
                {editing ? "Cancel" : "Edit"}
              </button>
            )}
          </div>
        </div>

        <div className="mx-3 mb-3 rounded-xl bg-white border border-emerald-100 p-4 space-y-3">
          <div>
            <h2 className="text-lg font-extrabold leading-tight">
              {user?.name || userId}
            </h2>
            <p className="text-xs font-mono text-zinc-500">@{userId}</p>
            {user?.status && (
              <p className="mt-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1">
                {user.status}
              </p>
            )}
          </div>

          <div className="h-[1px] bg-emerald-100" />

          {editing ? (
            <form onSubmit={handleSave} className="space-y-2.5">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Display Name"
                className="w-full rounded-lg bg-[#f7faf8] border border-emerald-200 px-2.5 py-1.5 text-xs outline-none"
              />
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Custom Status"
                className="w-full rounded-lg bg-[#f7faf8] border border-emerald-200 px-2.5 py-1.5 text-xs outline-none"
              />
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="About Me"
                className="w-full rounded-lg bg-[#f7faf8] border border-emerald-200 px-2.5 py-1.5 text-xs outline-none resize-none"
              />
              <div className="grid grid-cols-4 gap-1.5">
                {BANNERS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBanner(b)}
                    className={`h-6 rounded-md bg-gradient-to-r ${b} border-2 cursor-pointer ${
                      banner === b ? "border-zinc-900" : "border-transparent"
                    }`}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </form>
          ) : (
            <>
              <div>
                <h3 className="text-[10px] font-bold uppercase text-zinc-500">
                  About Me
                </h3>
                <p className="text-xs text-zinc-700 mt-0.5">
                  {user?.bio ||
                    "Messaging privately with AES-256 E2EE on Leafsty."}
                </p>
              </div>
              <div>
                <h3 className="text-[10px] font-bold uppercase text-zinc-500">
                  Member Since
                </h3>
                <p className="text-xs text-zinc-700 font-medium mt-0.5">
                  {user?.joinedAt || "Nov 13, 2026"}
                </p>
              </div>
              <div>
                <h3 className="text-[10px] font-bold uppercase text-zinc-500 mb-1">
                  Roles
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(user?.roles || ["Leafsty Member", "E2EE Verified"]).map(
                    (r: string) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#f3f8f5] border border-emerald-200 text-[11px] font-medium"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {r}
                      </span>
                    )
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-bold uppercase text-zinc-500 mb-1">
                  Note
                </h3>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    localStorage.setItem(
                      `leafsty_note_${userId}`,
                      e.target.value
                    );
                  }}
                  placeholder="Click to add a note"
                  className="w-full rounded-lg bg-[#f7faf8] border border-emerald-100 px-2.5 py-1 text-xs outline-none"
                />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setDm("");
                }}
              >
                <input
                  type="text"
                  value={dm}
                  onChange={(e) => setDm(e.target.value)}
                  placeholder={`Message @${user?.name || userId}`}
                  className="w-full rounded-lg bg-[#f3f8f5] border border-emerald-200 px-3 py-2 text-xs outline-none"
                />
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
