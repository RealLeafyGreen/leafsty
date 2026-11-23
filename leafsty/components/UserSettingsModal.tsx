"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  User,
  Palette,
  Mic,
  Shield,
  Bell,
  Keyboard,
  Terminal,
  LogOut,
  Check,
  Plus,
  Sun,
  Moon,
  Lock,
  Volume2,
} from "lucide-react";

export interface UserSettingsModalProps {
  isOpen: boolean;
  user?: any;
  profile?: any;
  onClose: () => void;
  onSave?: (updated: any) => Promise<void> | void;
  onLogout?: () => void;
}

const BANNER_COLORS = [
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#f59e0b",
];

type SettingsTab =
  | "account"
  | "profile"
  | "appearance"
  | "voice"
  | "privacy"
  | "notifications"
  | "keybinds"
  | "developer";

export default function UserSettingsModal({
  isOpen,
  user,
  profile,
  onClose,
  onSave,
  onLogout,
}: UserSettingsModalProps) {
  const sourceUser = profile || user || {};
  const userId = String(sourceUser?.id || "");

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  const [form, setForm] = useState({
    name: sourceUser?.name || userId || "",
    avatarUrl: sourceUser?.image || "",
    bannerColor: sourceUser?.bannerColor || "#10b981",
    status: sourceUser?.status || sourceUser?.statusText || "Encrypted • Online",
    pronouns: sourceUser?.pronouns || "",
    bio: sourceUser?.bio || sourceUser?.aboutMe || "",
  });

  const [prefs, setPrefs] = useState({
    compactMode: false,
    soundEffects: true,
    desktopNotifications: true,
    readReceipts: true,
    typingIndicators: true,
    noiseSuppression: true,
    echoCancellation: true,
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwStatus, setPwStatus] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
  }>({ loading: false, error: null, success: false });

  const [testingMic, setTestingMic] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let savedLocal: any = {};
    try {
      const raw = JSON.parse(localStorage.getItem("leafsty_user") || "{}");
      if (String(raw?.id || "") === userId) savedLocal = raw;
    } catch {}

    setForm({
      name: savedLocal.name || sourceUser.name || userId || "",
      avatarUrl: savedLocal.image || sourceUser.image || "",
      bannerColor: savedLocal.bannerColor || sourceUser.bannerColor || "#10b981",
      status:
        savedLocal.status ||
        savedLocal.statusText ||
        sourceUser.status ||
        sourceUser.statusText ||
        "Encrypted • Online",
      pronouns: savedLocal.pronouns || sourceUser.pronouns || "",
      bio: savedLocal.bio || savedLocal.aboutMe || sourceUser.bio || sourceUser.aboutMe || "",
    });

    try {
      const savedTheme = localStorage.getItem("leafsty_theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
      }
      const savedPrefs = JSON.parse(
        localStorage.getItem("leafsty_prefs") || "null"
      );
      if (savedPrefs) setPrefs((p) => ({ ...p, ...savedPrefs }));
    } catch {}

    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPwStatus({ loading: false, error: null, success: false });
    setSavedBanner(false);
    setTestingMic(false);
  }, [
    isOpen,
    sourceUser.name,
    sourceUser.image,
    sourceUser.bannerColor,
    sourceUser.status,
    sourceUser.statusText,
    sourceUser.pronouns,
    sourceUser.bio,
    sourceUser.aboutMe,
    userId,
  ]);
  const handleAvatarFilePick = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const minSide = Math.min(img.width, img.height);
      const sx = (img.width - minSide) / 2;
      const sy = (img.height - minSide) / 2;
      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

      const dataUrl = canvas.toDataURL("image/webp", 0.85);
      setForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
    };

    img.onerror = () => URL.revokeObjectURL(objectUrl);
    img.src = objectUrl;
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSave?.({
        name: form.name.trim() || userId,
        image: form.avatarUrl.trim(),
        bannerColor: form.bannerColor,
        status: form.status.trim() || "Encrypted • Online",
        pronouns: form.pronouns.trim(),
        bio: form.bio.trim(),
      });
      try {
        localStorage.setItem("leafsty_prefs", JSON.stringify(prefs));
      } catch {}
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (nextTheme: "dark" | "light") => {
    setTheme(nextTheme);
    try {
      localStorage.setItem("leafsty_theme", nextTheme);
      document.documentElement.setAttribute("data-theme", nextTheme);
    } catch {}
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.newPassword.trim() || pwForm.newPassword.length < 4) {
      setPwStatus({
        loading: false,
        error: "New password must be at least 4 characters.",
        success: false,
      });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwStatus({
        loading: false,
        error: "Passwords do not match.",
        success: false,
      });
      return;
    }
    setPwStatus({ loading: true, error: null, success: false });
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_password",
          username: userId,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Password update failed");
      setPwStatus({ loading: false, error: null, success: true });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setPwStatus({
        loading: false,
        error: err?.message || "Password update failed",
        success: false,
      });
    }
  };

  if (!isOpen) return null;

  const navItems: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
    { id: "account", label: "My Account", icon: <User className="w-4 h-4" /> },
    { id: "profile", label: "User Profile", icon: <Shield className="w-4 h-4" /> },
    { id: "appearance", label: "Appearance", icon: <Palette className="w-4 h-4" /> },
    { id: "voice", label: "Voice & Video", icon: <Mic className="w-4 h-4" /> },
    { id: "privacy", label: "E2EE & Privacy", icon: <Lock className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "keybinds", label: "Keybinds", icon: <Keyboard className="w-4 h-4" /> },
    { id: "developer", label: "Developer & Data", icon: <Terminal className="w-4 h-4" /> },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl h-[620px] max-h-[90vh] rounded-3xl bg-[#081914] border border-emerald-500/25 shadow-2xl overflow-hidden flex text-emerald-50"
      >
        <div className="w-56 sm:w-64 bg-[#061410] border-r border-emerald-500/15 p-4 flex flex-col justify-between shrink-0">
          <div>
            <div className="px-3 mb-3 text-[11px] font-extrabold uppercase tracking-wider text-emerald-400/80">
              Leafsty Settings
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === item.id
                      ? "bg-emerald-500/20 text-white border border-emerald-500/30"
                      : "text-emerald-200/75 hover:bg-emerald-500/10 hover:text-emerald-50"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-extrabold text-red-400 hover:bg-red-500/15 transition cursor-pointer"
            >
              <span>Log Out</span>
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-7 py-5 border-b border-emerald-500/15 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-white">
                {navItems.find((n) => n.id === activeTab)?.label}
              </h2>
              <p className="text-xs text-emerald-300/70">
                Manage your Leafsty identity, security & workspace preferences
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              title="Close Settings"
              className="w-9 h-9 rounded-full bg-[#0d261e] border border-emerald-500/25 flex items-center justify-center text-emerald-200 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-7 space-y-6">
            {savedBanner && (
              <div className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-xs font-bold text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Saved! Your Leafsty profile and settings are updated.</span>
              </div>
            )}

            {activeTab === "profile" && (
              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-emerald-400/80 mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-emerald-400/80 mb-1.5">
                      Pronouns
                    </label>
                    <input
                      type="text"
                      value={form.pronouns}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, pronouns: e.target.value }))
                      }
                      placeholder="they/them, he/him, she/her..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-emerald-400/80 mb-1.5">
                    Avatar Image URL
                  </label>
                  <div className="flex items-center gap-2.5">
                    {form.avatarUrl && (
                      <img
                        src={form.avatarUrl}
                        alt="Avatar Preview"
                        className="w-10 h-10 rounded-xl object-cover border border-emerald-400/40 shrink-0"
                      />
                    )}
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        handleAvatarFilePick(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                    <input
                      type="text"
                      value={form.avatarUrl}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, avatarUrl: e.target.value }))
                      }
                      placeholder="https://..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      title="Upload Avatar Image from Device"
                      className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 transition cursor-pointer shadow-md"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-emerald-400/80 mb-2">
                    Profile Banner Color
                  </label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {BANNER_COLORS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({ ...p, bannerColor: hex }))
                        }
                        style={{ backgroundColor: hex }}
                        className={`w-8 h-8 rounded-full transition cursor-pointer ${
                          form.bannerColor === hex
                            ? "ring-2 ring-white scale-110"
                            : "opacity-80 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-emerald-400/80 mb-1.5">
                    Custom Status
                  </label>
                  <input
                    type="text"
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, status: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-emerald-400/80 mb-1.5">
                    About Me
                  </label>
                  <textarea
                    rows={3}
                    value={form.bio}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, bio: e.target.value }))
                    }
                    placeholder="Share a short bio on your profile card..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400 resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold transition cursor-pointer shadow-lg"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-emerald-400/80 mb-2">
                    Workspace Theme
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleThemeChange("dark")}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                        theme === "dark"
                          ? "bg-emerald-500/20 border-emerald-400 text-white"
                          : "bg-[#0d261e] border-emerald-500/20 text-emerald-200/80"
                      }`}
                    >
                      <Moon className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div className="text-sm font-extrabold">
                          Midnight Forest
                        </div>
                        <div className="text-xs opacity-75">Dark Mode</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleThemeChange("light")}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                        theme === "light"
                          ? "bg-emerald-500/20 border-emerald-400 text-white"
                          : "bg-[#0d261e] border-emerald-500/20 text-emerald-200/80"
                      }`}
                    >
                      <Sun className="w-5 h-5 text-amber-400" />
                      <div>
                        <div className="text-sm font-extrabold">
                          Botanical Daylight
                        </div>
                        <div className="text-xs opacity-75">Light Mode</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "account" && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-[#0d261e] border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-emerald-300/70">Username</div>
                    <div className="text-sm font-extrabold text-white">
                      @{userId}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                    E2EE Active
                  </span>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400/80">
                    Change Password
                  </div>
                  <input
                    type="password"
                    value={pwForm.newPassword}
                    onChange={(e) =>
                      setPwForm((p) => ({ ...p, newPassword: e.target.value }))
                    }
                    placeholder="New password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50"
                  />
                  <input
                    type="password"
                    value={pwForm.confirmPassword}
                    onChange={(e) =>
                      setPwForm((p) => ({
                        ...p,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm new password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50"
                  />
                  {pwStatus.error && (
                    <div className="text-xs text-red-400">{pwStatus.error}</div>
                  )}
                  {pwStatus.success && (
                    <div className="text-xs text-emerald-400">
                      Password updated!
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={pwStatus.loading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer"
                  >
                    {pwStatus.loading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            )}
            {activeTab === "voice" && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setTestingMic((v) => !v)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{testingMic ? "Stop Mic Test" : "Test Microphone"}</span>
                </button>
              </div>
            )}

            {(activeTab === "privacy" ||
              activeTab === "notifications" ||
              activeTab === "keybinds" ||
              activeTab === "developer") && (
              <div className="space-y-3 text-xs text-emerald-200/80">
                <div className="p-4 rounded-2xl bg-[#0d261e] border border-emerald-500/20 space-y-2">
                  <div className="font-extrabold text-sm text-white">
                    Leafsty Client Info
                  </div>
                  <div>User ID: {userId}</div>
                  <div>Encryption: AES-GCM Room Key Derivation</div>
                  <div>Shortcuts: Enter to send • /poll for live polls</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
