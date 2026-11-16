"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  User,
  Sparkles,
  ShieldCheck,
  Bell,
  LogOut,
  X,
  Check,
  Copy,
  KeyRound,
  Eye,
  BellRing,
  Palette,
  Sun,
  Moon,
  Camera,
  Trash2,
  Search,
  Mic,
  MessageSquare,
  Sliders,
} from "lucide-react";

const DEFAULT_BANNER = "from-[#064e3b] via-[#059669] to-[#10b981]";

const BANNER_PRESETS = [
  { label: "Emerald Grove", value: "from-[#064e3b] via-[#059669] to-[#10b981]" },
  { label: "Deep Canopy", value: "from-[#022c22] via-[#065f46] to-[#0d9488]" },
  { label: "Mint Breeze", value: "from-[#047857] via-[#10b981] to-[#34d399]" },
  { label: "Midnight Moss", value: "from-[#091510] via-[#064e3b] to-[#059669]" },
];

const AVATAR_DECORATIONS = [
  { id: "none", label: "None", ringClass: "ring-4 ring-[#07110d]" },
  { id: "emerald", label: "Emerald Aura", ringClass: "ring-4 ring-emerald-400 shadow-lg shadow-emerald-500/40" },
  { id: "mint", label: "Mint Pulse", ringClass: "ring-4 ring-teal-300 shadow-lg shadow-teal-400/40" },
  { id: "gold", label: "Golden Leaf", ringClass: "ring-4 ring-amber-400 shadow-lg shadow-amber-500/40" },
];

const NAME_STYLES = [
  { id: "classic", label: "Classic", textClass: "" },
  { id: "gradient", label: "Emerald Gradient", textClass: "bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent" },
  { id: "mint", label: "Mint Glow", textClass: "text-emerald-400 drop-shadow-xs" },
];

type SettingsTab = "account" | "profile" | "privacy" | "appearance" | "chat" | "voice";

export default function UserSettingsModal({
  isOpen,
  user,
  profile,
  onClose,
  onSave,
}: {
  isOpen?: boolean;
  user?: any;
  profile?: any;
  onClose: () => void;
  onSave?: (updated: any) => Promise<void> | void;
}) {
  const activeProfile = profile || user || {};

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [settingsSearch, setSettingsSearch] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const [name, setName] = useState(activeProfile.name || "");
  const [pronouns, setPronouns] = useState(activeProfile.pronouns || "");
  const [status, setStatus] = useState(activeProfile.status || "Encrypted • Online");
  const [bio, setBio] = useState(activeProfile.bio || "Messaging privately with 256-bit AES-GCM encryption.");
  const [banner, setBanner] = useState(activeProfile.banner || DEFAULT_BANNER);
  const [decoration, setDecoration] = useState(activeProfile.decoration || "emerald");
  const [nameStyle, setNameStyle] = useState(activeProfile.nameStyle || "classic");

  const imageState = useState<string>(activeProfile.image || "");
  const image = imageState.at(0) as string;
  const setImage = imageState.at(1) as React.Dispatch<React.SetStateAction<string>>;
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [readReceipts, setReadReceipts] = useState(true);
  const [typingIndicators, setTypingIndicators] = useState(true);
  const [faviconBadges, setFaviconBadges] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [loadingAnimation, setLoadingAnimation] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [enterToSend, setEnterToSend] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [micTesting, setMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState("");
  const applyTheme = (nextTheme: "light" | "dark") => {
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("leafsty_theme", nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      window.dispatchEvent(new CustomEvent("leafsty-theme-change", { detail: nextTheme }));
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 220;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        setImage(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    setName(activeProfile.name || "");
    setPronouns(activeProfile.pronouns || "");
    setStatus(activeProfile.status || "Encrypted • Online");
    setBio(activeProfile.bio || "Messaging privately with 256-bit AES-GCM encryption.");
    setBanner(activeProfile.banner || DEFAULT_BANNER);
    setDecoration(activeProfile.decoration || "emerald");
    setNameStyle(activeProfile.nameStyle || "classic");
    setImage(activeProfile.image || "");

    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("leafsty_theme");
      if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);

      const prefs = JSON.parse(localStorage.getItem("leafsty_app_prefs") || "{}");
      if (typeof prefs.readReceipts === "boolean") setReadReceipts(prefs.readReceipts);
      if (typeof prefs.typingIndicators === "boolean") setTypingIndicators(prefs.typingIndicators);
      if (typeof prefs.faviconBadges === "boolean") setFaviconBadges(prefs.faviconBadges);
      if (typeof prefs.soundEffects === "boolean") setSoundEffects(prefs.soundEffects);
      if (typeof prefs.loadingAnimation === "boolean") setLoadingAnimation(prefs.loadingAnimation);
      if (typeof prefs.compactMode === "boolean") setCompactMode(prefs.compactMode);
      if (typeof prefs.enterToSend === "boolean") setEnterToSend(prefs.enterToSend);
      if (typeof prefs.noiseSuppression === "boolean") setNoiseSuppression(prefs.noiseSuppression);
      if (typeof prefs.echoCancellation === "boolean") setEchoCancellation(prefs.echoCancellation);
    }
  }, [activeProfile.id, activeProfile.name, activeProfile.pronouns, activeProfile.status, activeProfile.bio, activeProfile.banner, activeProfile.decoration, activeProfile.nameStyle, activeProfile.image]);

  useEffect(() => {
    if (!micTesting) {
      setMicLevel(0);
      return;
    }
    let active = true;
    let rafId: number;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;

    navigator.mediaDevices
      .getUserMedia({ audio: { noiseSuppression, echoCancellation } })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        ctx = new AudioCtx();
        const src = ctx.createMediaStreamSource(s);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const loop = () => {
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          setMicLevel(Math.min(100, Math.round((sum / data.length) * 1.6)));
          rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
      })
      .catch(() => setMicTesting(false));

    return () => {
      active = false;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => {});
    };
  }, [micTesting, noiseSuppression, echoCancellation]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (isOpen === false) return null;

  const isDark = theme === "dark";
  const userId = activeProfile.id || "user";
  const activeDeco = AVATAR_DECORATIONS.find((d) => d.id === decoration) || AVATAR_DECORATIONS.at(0)!;
  const activeNameStyle = NAME_STYLES.find((s) => s.id === nameStyle) || NAME_STYLES.at(0)!;

  const keyFingerprint = `AES256-${btoa(userId)
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 16)
    .match(/.{1,4}/g)
    ?.join("-")}`;

  const handleSaveAll = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      setSaving(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("leafsty_theme", theme);
        localStorage.setItem(
          "leafsty_app_prefs",
          JSON.stringify({
            readReceipts,
            typingIndicators,
            faviconBadges,
            soundEffects,
            loadingAnimation,
            compactMode,
            enterToSend,
            noiseSuppression,
            echoCancellation,
          })
        );
      }
      await onSave?.({
        name: name.trim() || userId,
        pronouns: pronouns.trim(),
        status: status.trim() || "Encrypted • Online",
        bio: bio.trim(),
        banner,
        decoration,
        nameStyle,
        image,
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.trim().length < 4) {
      setPasswordStatus("Password must be at least 4 characters.");
      return;
    }
    try {
      setResettingPassword(true);
      setPasswordStatus("");
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword: newPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      setNewPassword("");
      setPasswordStatus("Password updated successfully!");
      setTimeout(() => setPasswordStatus(""), 2500);
    } catch (err: any) {
      setPasswordStatus(err.message || "Error updating password");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("stream_user");
    localStorage.removeItem("stream_token");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.replace("/");
  };
  const navGroups: { title: string; items: { id: SettingsTab; label: string; icon: any; keywords: string }[] }[] = [
    {
      title: "User Settings",
      items: [
        { id: "profile", label: "Profiles & Avatar", icon: Sparkles, keywords: "pfp avatar banner pronouns decoration nameplate" },
        { id: "account", label: "My Account", icon: User, keywords: "password username id security" },
        { id: "privacy", label: "Privacy & E2EE", icon: ShieldCheck, keywords: "encryption key aes receipts typing" },
      ],
    },
    {
      title: "App Settings",
      items: [
        { id: "appearance", label: "Appearance & Alerts", icon: Bell, keywords: "theme dark light sound ringtone favicon animation" },
        { id: "chat", label: "Chat & Accessibility", icon: MessageSquare, keywords: "compact density enter send" },
        { id: "voice", label: "Voice & Video", icon: Mic, keywords: "microphone test noise suppression echo" },
      ],
    },
  ];

  const q = settingsSearch.trim().toLowerCase();

  return (
    <div className={`fixed inset-0 z-50 flex select-none transition-colors ${isDark ? "bg-[#07110d] text-zinc-100" : "bg-[#f4f8f6] text-zinc-900"}`}>
      <aside className={`w-64 sm:w-72 border-r flex flex-col justify-between p-4 shrink-0 overflow-y-auto transition-colors ${isDark ? "bg-[#0a1712] border-emerald-500/15" : "bg-[#eef6f2] border-emerald-200/80"}`}>
        <div className="space-y-4">
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${isDark ? "bg-black/30 border-emerald-500/20" : "bg-white border-emerald-200"}`}>
            <Search className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <input
              type="text"
              value={settingsSearch}
              onChange={(e) => setSettingsSearch(e.target.value)}
              placeholder="Search settings..."
              className="w-full bg-transparent outline-none"
            />
          </div>

          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !q || item.label.toLowerCase().includes(q) || item.keywords.includes(q)
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.title}>
                <div className={`px-2.5 mb-1.5 text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-emerald-400/75" : "text-emerald-800/70"}`}>
                  {group.title}
                </div>
                <nav className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isSelected = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                            : isDark
                            ? "text-zinc-300 hover:bg-white/5 hover:text-white"
                            : "text-zinc-700 hover:bg-emerald-100/80 hover:text-zinc-950"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-emerald-500/15 mt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 sm:p-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-black">
                {activeTab === "profile" && "Profiles"}
                {activeTab === "account" && "My Account"}
                {activeTab === "privacy" && "Privacy & Encryption"}
                {activeTab === "appearance" && "Appearance & Alerts"}
                {activeTab === "chat" && "Chat & Accessibility"}
                {activeTab === "voice" && "Voice & Video"}
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">Customize your Leafsty workspace & identity</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              className="w-9 h-9 rounded-full border border-emerald-500/25 flex items-center justify-center hover:bg-emerald-500/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {activeTab === "profile" && (
            <form onSubmit={handleSaveAll} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-emerald-500/25 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">Display Name Style</label>
                  <div className="flex flex-wrap gap-2">
                    {NAME_STYLES.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setNameStyle(st.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          nameStyle === st.id ? "bg-emerald-600 text-white border-emerald-500" : "border-emerald-500/20 hover:border-emerald-400"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Pronouns</label>
                  <input
                    type="text"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    placeholder="Add your pronouns (e.g. they/them)"
                    className="w-full rounded-xl border border-emerald-500/25 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">Avatar</label>
                  <div className="flex items-center gap-2.5">
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition cursor-pointer"
                    >
                      Change Avatar
                    </button>
                    {image && (
                      <button
                        type="button"
                        onClick={() => setImage("")}
                        className="px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Avatar
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">Avatar Ring Decoration</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {AVATAR_DECORATIONS.map((dec) => (
                      <button
                        key={dec.id}
                        type="button"
                        onClick={() => setDecoration(dec.id)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          decoration === dec.id ? "bg-emerald-600 text-white border-emerald-500" : "border-emerald-500/20 hover:border-emerald-400"
                        }`}
                      >
                        {dec.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Custom Status</label>
                  <input
                    type="text"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-emerald-500/25 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">About Me</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-xl border border-emerald-500/25 bg-transparent px-3.5 py-2 text-sm outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">Banner Theme</label>
                  <div className="grid grid-cols-4 gap-2">
                    {BANNER_PRESETS.map((b) => (
                      <button
                        key={b.value}
                        type="button"
                        onClick={() => setBanner(b.value)}
                        title={b.label}
                        className={`h-9 rounded-xl bg-gradient-to-r ${b.value} border-2 transition cursor-pointer ${
                          banner === b.value ? "border-white scale-105" : "border-transparent opacity-75"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {saving ? "Saving..." : savedNotice ? "✓ Profile Saved!" : "Save Changes"}
                </button>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-500">Live Profile Preview</div>
                <div className={`rounded-3xl overflow-hidden border shadow-xl ${isDark ? "bg-[#0d1c16] border-emerald-500/25" : "bg-white border-emerald-200"}`}>
                  <div className={`h-24 bg-gradient-to-r ${banner}`} />
                  <div className="px-5 pb-5 -mt-10">
                    <div className="flex items-end justify-between">
                      <div className={`w-20 h-20 rounded-full bg-emerald-600 text-white font-black text-2xl flex items-center justify-center overflow-hidden ${activeDeco.ringClass}`}>
                        {image ? <img src={image} alt="Avatar" className="w-full h-full object-cover" /> : (name || userId).charAt(0).toUpperCase()}
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
                        🌿 {status}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className={`text-lg font-black ${activeNameStyle.textClass}`}>{name || userId}</div>
                      <div className="text-xs text-zinc-400">
                        @{userId} {pronouns && <span>• {pronouns}</span>}
                      </div>
                    </div>

                    {bio && (
                      <div className="mt-3 pt-3 border-t border-emerald-500/15 text-xs leading-relaxed opacity-85">
                        {bio}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-500 mb-2">Nameplate Preview</div>
                  <div className={`rounded-2xl p-3 border flex items-center gap-3 bg-gradient-to-r ${banner} text-white shadow-md`}>
                    <div className="w-9 h-9 rounded-full bg-black/30 flex items-center justify-center font-black text-sm overflow-hidden">
                      {image ? <img src={image} alt="Mini" className="w-full h-full object-cover" /> : (name || userId).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold">{name || userId}</div>
                      <div className="text-[10px] text-emerald-100">{status}</div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
          {activeTab === "account" && (
            <div className="max-w-2xl space-y-6">
              <div className={`rounded-3xl p-5 border ${isDark ? "bg-[#0d1c16] border-emerald-500/20" : "bg-white border-emerald-100"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-14 h-14 rounded-full bg-emerald-600 text-white font-black text-xl flex items-center justify-center overflow-hidden ${activeDeco.ringClass}`}>
                      {image ? <img src={image} alt={name} className="w-full h-full object-cover" /> : (name || userId).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold text-base">{name || userId}</div>
                      <div className="text-xs text-emerald-500 font-semibold">@{userId}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(userId);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 1500);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? "Copied" : "Copy ID"}</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleResetPassword} className={`rounded-3xl p-5 border space-y-3 ${isDark ? "bg-[#0d1c16] border-emerald-500/20" : "bg-white border-emerald-100"}`}>
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-500">
                  <KeyRound className="w-3.5 h-3.5" /> Change Password
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full rounded-xl border border-emerald-500/20 bg-transparent px-3.5 py-2.5 text-sm outline-none"
                />
                {passwordStatus && <p className="text-xs font-semibold text-emerald-500">{passwordStatus}</p>}
                <button
                  type="submit"
                  disabled={resettingPassword || !newPassword.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-extrabold cursor-pointer"
                >
                  {resettingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="max-w-2xl space-y-4">
              <div className={`rounded-3xl p-5 border ${isDark ? "bg-[#0d1c16] border-emerald-500/20" : "bg-white border-emerald-100"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-extrabold uppercase text-emerald-500">256-Bit AES-GCM Key Fingerprint</div>
                    <div className="font-mono text-sm font-bold mt-1">{keyFingerprint}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(keyFingerprint);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 1500);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? "Copied" : "Copy Key"}</span>
                  </button>
                </div>
              </div>

              <div className={`rounded-3xl p-5 border space-y-3 ${isDark ? "bg-[#0d1c16] border-emerald-500/20" : "bg-white border-emerald-100"}`}>
                {[
                  { label: "Send Typing Indicators", val: typingIndicators, set: setTypingIndicators, icon: Eye },
                  { label: "Send Read Receipts", val: readReceipts, set: setReadReceipts, icon: Check },
                ].map((pref) => {
                  const Icon = pref.icon;
                  return (
                    <label key={pref.label} className="flex items-center justify-between py-1.5 cursor-pointer">
                      <span className="flex items-center gap-2 text-xs font-bold">
                        <Icon className="w-4 h-4 text-emerald-500" />
                        {pref.label}
                      </span>
                      <input type="checkbox" checked={pref.val} onChange={(e) => pref.set(e.target.checked)} className="accent-emerald-600 w-4 h-4 cursor-pointer" />
                    </label>
                  );
                })}
                <button type="button" onClick={() => handleSaveAll()} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold cursor-pointer">
                  {savedNotice ? "✓ Saved!" : "Save Privacy Settings"}
                </button>
              </div>
            </div>
          )}
          {activeTab === "appearance" && (
            <div className="max-w-2xl space-y-5">
              <div className={`rounded-3xl p-5 border space-y-3 ${isDark ? "bg-[#0d1c16] border-emerald-500/20" : "bg-white border-emerald-100"}`}>
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-emerald-500">
                  <Palette className="w-3.5 h-3.5" /> Color Theme
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => applyTheme("light")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-extrabold cursor-pointer ${
                      theme === "light" ? "bg-emerald-600 text-white border-emerald-500" : "border-emerald-500/20"
                    }`}
                  >
                    <Sun className="w-4 h-4" /> Light Grove
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTheme("dark")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-extrabold cursor-pointer ${
                      theme === "dark" ? "bg-emerald-600 text-white border-emerald-500" : "border-emerald-500/20"
                    }`}
                  >
                    <Moon className="w-4 h-4" /> Dark Canopy
                  </button>
                </div>
              </div>

              <div className={`rounded-3xl p-5 border space-y-3 ${isDark ? "bg-[#0d1c16] border-emerald-500/20" : "bg-white border-emerald-100"}`}>
                {[
                  { label: "Unread Favicon Badges", val: faviconBadges, set: setFaviconBadges, icon: BellRing },
                  { label: "Call & Poke Ringtone Chimes", val: soundEffects, set: setSoundEffects, icon: Bell },
                  { label: "Startup Leafsty Animation", val: loadingAnimation, set: setLoadingAnimation, icon: Sparkles },
                ].map((pref) => {
                  const Icon = pref.icon;
                  return (
                    <label key={pref.label} className="flex items-center justify-between py-1.5 cursor-pointer">
                      <span className="flex items-center gap-2 text-xs font-bold">
                        <Icon className="w-4 h-4 text-emerald-500" />
                        {pref.label}
                      </span>
                      <input type="checkbox" checked={pref.val} onChange={(e) => pref.set(e.target.checked)} className="accent-emerald-600 w-4 h-4 cursor-pointer" />
                    </label>
                  );
                })}
                <button type="button" onClick={() => handleSaveAll()} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold cursor-pointer">
                  {savedNotice ? "✓ Saved!" : "Save Preferences"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "chat" && (
            <div className={`max-w-2xl rounded-3xl p-5 border space-y-4 ${isDark ? "bg-[#0d1c16] border-emerald-500/20" : "bg-white border-emerald-100"}`}>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-emerald-500">
                <Sliders className="w-3.5 h-3.5" /> Message Display & Input
              </div>
              <label className="flex items-center justify-between py-1.5 cursor-pointer">
                <span className="text-xs font-bold">Compact Message Spacing</span>
                <input type="checkbox" checked={compactMode} onChange={(e) => setCompactMode(e.target.checked)} className="accent-emerald-600 w-4 h-4 cursor-pointer" />
              </label>
              <label className="flex items-center justify-between py-1.5 cursor-pointer">
                <span className="text-xs font-bold">Press Enter to Send Messages</span>
                <input type="checkbox" checked={enterToSend} onChange={(e) => setEnterToSend(e.target.checked)} className="accent-emerald-600 w-4 h-4 cursor-pointer" />
              </label>
              <button type="button" onClick={() => handleSaveAll()} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold cursor-pointer">
                {savedNotice ? "✓ Saved!" : "Save Chat Settings"}
              </button>
            </div>
          )}

          {activeTab === "voice" && (
            <div className={`max-w-2xl rounded-3xl p-5 border space-y-5 ${isDark ? "bg-[#0d1c16] border-emerald-500/20" : "bg-white border-emerald-100"}`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-emerald-500">Microphone Input Test</span>
                  <button
                    type="button"
                    onClick={() => setMicTesting((m) => !m)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                      micTesting ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
                    }`}
                  >
                    {micTesting ? "Stop Test" : "Let's Check"}
                  </button>
                </div>
                <div className="h-3 w-full rounded-full bg-black/30 overflow-hidden">
                  <div
                    style={{ width: `${micLevel}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all duration-75"
                  />
                </div>
              </div>

              <label className="flex items-center justify-between py-1.5 cursor-pointer">
                <span className="text-xs font-bold">AI Noise Suppression</span>
                <input type="checkbox" checked={noiseSuppression} onChange={(e) => setNoiseSuppression(e.target.checked)} className="accent-emerald-600 w-4 h-4 cursor-pointer" />
              </label>
              <label className="flex items-center justify-between py-1.5 cursor-pointer">
                <span className="text-xs font-bold">Acoustic Echo Cancellation</span>
                <input type="checkbox" checked={echoCancellation} onChange={(e) => setEchoCancellation(e.target.checked)} className="accent-emerald-600 w-4 h-4 cursor-pointer" />
              </label>
              <button type="button" onClick={() => handleSaveAll()} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold cursor-pointer">
                {savedNotice ? "✓ Saved!" : "Save Voice Settings"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
