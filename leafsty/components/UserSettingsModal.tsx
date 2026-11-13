"use client";

import React, { useEffect, useState } from "react";
import { useChatContext } from "stream-chat-react";

const BANNERS = [
  "from-[#064e3b] via-[#059669] to-[#10b981]",
  "from-[#134e4a] via-[#0d9488] to-[#34d399]",
  "from-[#111214] via-[#064e3b] to-[#047857]",
  "from-[#14532d] via-[#15803d] to-[#22c55e]",
];

const STATUS_DOTS: Record<string, string> = {
  online: "bg-[#23a55a]",
  idle: "bg-[#f0b232]",
  dnd: "bg-[#f23f43]",
};

export default function UserSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { client } = useChatContext();
  const userId = client?.userID || "user";

  const [tab, setTab] = useState<"account" | "profile" | "privacy">("profile");
  const [name, setName] = useState(userId);
  const [status, setStatus] = useState("Encrypted • Online");
  const [presence, setPresence] = useState("online");
  const [bio, setBio] = useState("");
 const [banner, setBanner] = useState<string>(BANNERS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const saved = JSON.parse(localStorage.getItem(`leafsty_profile_${userId}`) || "{}");
    setName(saved.name || client?.user?.name || userId);
    setStatus(saved.status || "Encrypted • Online");
    setPresence(saved.presence || "online");
    setBio(saved.bio || "Messaging privately with 256-bit AES-GCM encryption.");
    setBanner(saved.banner || BANNERS);

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, client, userId, onClose]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = { name: name.trim() || userId, status: status.trim(), presence, bio: bio.trim(), banner };
      localStorage.setItem(`leafsty_profile_${userId}`, JSON.stringify(updated));

      const anyClient = client as any;
      if (anyClient?.user) anyClient.user.name = updated.name;
      if (typeof anyClient?.upsertUsers === "function") {
        await anyClient.upsertUsers({ users: { [userId]: { id: userId, name: updated.name, custom: updated } } });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-[#313338] text-[#dbdee1] select-none">
      <aside className="w-56 bg-[#2b2d31] border-r border-white/[0.06] flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-1">
          <p className="px-2.5 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">User Settings</p>
          {["account", "profile", "privacy"].map((t) => (
            <button key={t} type="button" onClick={() => setTab(t as any)} className={`w-full text-left px-2.5 py-1.5 rounded-[4px] text-sm font-medium capitalize cursor-pointer ${tab === t ? "bg-[#4e5058]/60 text-[#f2f3f5]" : "text-[#b5bac1] hover:bg-[#4e5058]/30"}`}>
              {t === "privacy" ? "Privacy & E2EE" : t}
            </button>
          ))}
          <div className="my-2 h-[1px] bg-white/[0.06]" />
          <button type="button" onClick={() => { localStorage.clear(); window.location.replace("/"); }} className="w-full text-left px-2.5 py-1.5 rounded-[4px] text-sm font-medium text-[#f23f43] hover:bg-[#f23f43]/10 cursor-pointer">
            Log Out
          </button>
        </div>
        <span className="px-2.5 text-[11px] text-[#949ba4]">Leafsty &bull; AES-256</span>
      </aside>

      <main className="flex-1 overflow-y-auto px-10 py-12 relative">
        <button type="button" onClick={onClose} className="fixed top-8 right-8 flex flex-col items-center gap-1 text-[#b5bac1] hover:text-[#f2f3f5] cursor-pointer">
          <span className="w-9 h-9 rounded-full border-2 border-[#b5bac1] flex items-center justify-center text-lg leading-none">×</span>
          <span className="text-[10px] font-bold">ESC</span>
        </button>

        <div className="max-w-3xl">
          {tab === "profile" && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              <form onSubmit={handleSave} className="md:col-span-3 space-y-4">
                <h1 className="text-xl font-bold text-[#f2f3f5]">Profiles</h1>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-1.5">Display Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-[4px] bg-[#1e1f22] px-3 py-2 text-sm text-[#dbdee1] outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-1.5">Presence</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(STATUS_DOTS).map(([id, dot]) => (
                      <button key={id} type="button" onClick={() => setPresence(id)} className={`flex items-center gap-2 px-3 py-2 rounded-[4px] bg-[#1e1f22] border text-xs capitalize cursor-pointer ${presence === id ? "border-emerald-500 text-white" : "border-transparent text-[#b5bac1]"}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${dot}`} /> {id}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-1.5">Custom Status</label>
                  <input type="text" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-[4px] bg-[#1e1f22] px-3 py-2 text-sm text-[#dbdee1] outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-1.5">About Me</label>
                  <textarea rows={2} value={bio} onChange={(e) => setBio(e.target.value)} className="w-full rounded-[4px] bg-[#1e1f22] px-3 py-2 text-sm text-[#dbdee1] outline-none resize-none" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {BANNERS.map((b) => (
                    <button key={b} type="button" onClick={() => setBanner(b)} className={`h-7 rounded-[4px] bg-gradient-to-r ${b} border-2 cursor-pointer ${banner === b ? "border-white" : "border-transparent"}`} />
                  ))}
                </div>
                <button type="submit" disabled={saving} className="rounded-[4px] bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium text-white cursor-pointer">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>

              <div className="md:col-span-2">
                <p className="text-xs font-bold uppercase text-[#b5bac1] mb-2">Preview</p>
                <div className="rounded-lg bg-[#111214] border border-[#3f4147] overflow-hidden shadow-xl">
                  <div className={`h-16 bg-gradient-to-r ${banner}`} />
                  <div className="px-4 pb-4">
                    <div className="relative -mt-8 mb-2 w-16 h-16">
                      <div className="w-16 h-16 rounded-full border-4 border-[#111214] bg-emerald-600 text-white font-bold text-xl flex items-center justify-center uppercase">
                        {(name || "L").slice(0, 1)}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-[3px] border-[#111214] ${STATUS_DOTS[presence]}`} />
                    </div>
                    <h3 className="text-base font-bold text-[#f2f3f5]">{name || userId}</h3>
                    <p className="text-xs text-[#949ba4] font-mono">@{userId}</p>
                    {status && <p className="mt-2 text-xs text-[#dbdee1]">{status}</p>}
                    <div className="my-3 h-[1px] bg-white/[0.06]" />
                    <p className="text-[10px] font-bold uppercase text-[#b5bac1] mb-1">About Me</p>
                    <p className="text-xs text-[#dbdee1]">{bio}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "account" && (
            <div className="rounded-lg bg-[#1e1f22] border border-[#3f4147] p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-[#949ba4]">Username</p>
                <p className="text-sm font-medium text-[#f2f3f5]">@{userId}</p>
              </div>
              <button type="button" onClick={() => setTab("profile")} className="rounded-[4px] bg-[#4e5058] px-3 py-1.5 text-xs font-medium text-white cursor-pointer">Edit Profile</button>
            </div>
          )}

          {tab === "privacy" && (
            <div className="rounded-lg bg-[#2b2d31] border-l-4 border-[#23a55a] p-4">
              <p className="text-sm font-semibold text-[#f2f3f5]">256-Bit AES-GCM End-to-End Encryption</p>
              <p className="text-xs text-[#b5bac1] mt-1">All server channels and direct messages are encrypted client-side before leaving your browser.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
