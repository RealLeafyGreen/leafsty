"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  User,
  Shield,
  LogOut,
  Check,
  Copy,
  Lock,
  KeyRound,
  Bell,
  Palette,
  Sparkles,
  BadgeCheck,
} from "lucide-react";

type SettingsTab = "account" | "profile" | "appearance" | "privacy" | "notifications";

export interface UserSettingsModalProps {
  isOpen?: boolean;
  user?: any;
  profile?: any;
  onClose?: () => void;
  onSave?: (updated: any) => Promise<void> | void;
}

const BANNER_SWATCHES = [
  "#059669",
  "#047857",
  "#0d9488",
  "#0284c7",
  "#4f46e5",
  "#9333ea",
  "#e11d48",
  "#d97706",
];

export default function UserSettingsModal({
  isOpen = false,
  user,
  profile,
  onClose,
  onSave,
}: UserSettingsModalProps) {
  const sourceUser = profile || user || {};
  const userId = String(sourceUser.id || "");

  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [form, setForm] = useState({
    name: "",
    avatarUrl: "",
    bannerColor: "#059669",
    status: "Encrypted · Online",
    pronouns: "",
    bio: "",
  });
  const [prefs, setPrefs] = useState({
    compactMode: false,
    enterToSend: true,
    soundEffects: true,
    dmNotifications: true,
    readReceipts: true,
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

  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      name: sourceUser.name || userId || "",
      avatarUrl: sourceUser.image || "",
      bannerColor: sourceUser.bannerColor || "#059669",
      status: sourceUser.status || "Encrypted · Online",
      pronouns: sourceUser.pronouns || "",
      bio: sourceUser.bio || "",
    });
    try {
      const savedPrefs = JSON.parse(localStorage.getItem("leafsty_prefs") || "null");
      if (savedPrefs) setPrefs((p) => ({ ...p, ...savedPrefs }));
    } catch {}
    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPwStatus({ loading: false, error: null, success: false });
    setSavedBanner(false);
  }, [
    isOpen,
    sourceUser.name,
    sourceUser.image,
    sourceUser.bannerColor,
    sourceUser.status,
    sourceUser.pronouns,
    sourceUser.bio,
    userId,
  ]);

  if (!isOpen) return null;

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      setSaving(true);
      await onSave?.({
        name: form.name.trim() || userId,
        image: form.avatarUrl.trim() || undefined,
        bannerColor: form.bannerColor,
        status: form.status.trim() || "Encrypted · Online",
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
        error: "New passwords do not match.",
        success: false,
      });
      return;
    }

    try {
      setPwStatus({ loading: true, error: null, success: false });
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: userId,
          userId,
          currentPassword: pwForm.currentPassword,
          oldPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Could not update password.");
      }
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwStatus({ loading: false, error: null, success: true });
    } catch (err: any) {
      setPwStatus({
        loading: false,
        error: err?.message || "Password reset failed.",
        success: false,
      });
    }
  };

  const handleLogoutToLanding = () => {
    try {
      localStorage.removeItem("leafsty_user");
    } catch {}
    onClose?.();
    window.location.href = "/";
  };

  const handleCopyId = () => {
    if (!userId) return;
    navigator.clipboard?.writeText(userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };
  const navItems: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
    { id: "account", label: "My Account", icon: <BadgeCheck className="w-4 h-4 text-emerald-400" /> },
    { id: "profile", label: "User Profile", icon: <User className="w-4 h-4 text-emerald-400" /> },
    { id: "appearance", label: "Appearance", icon: <Palette className="w-4 h-4 text-emerald-400" /> },
    { id: "privacy", label: "E2EE & Privacy", icon: <Shield className="w-4 h-4 text-emerald-400" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4 text-emerald-400" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 text-emerald-50 select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-3xl bg-[#081914] border border-emerald-500/25 shadow-2xl overflow-hidden flex flex-col sm:flex-row h-[540px] max-h-[90vh]"
      >
        <aside className="w-full sm:w-52 bg-[#05110d] border-b sm:border-b-0 sm:border-r border-emerald-500/15 p-3.5 flex flex-col justify-between shrink-0">
          <div>
            <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-400/70">
              Leafsty Settings
            </div>

            <nav className="space-y-1 mt-1.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === item.id
                      ? "bg-emerald-500/20 text-emerald-50 border border-emerald-400/30 shadow-xs"
                      : "text-emerald-300/75 hover:bg-emerald-500/10 hover:text-emerald-50"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="pt-3 border-t border-emerald-500/15">
            <button
              type="button"
              onClick={handleLogoutToLanding}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-extrabold text-red-300 hover:bg-red-500/15 border border-transparent hover:border-red-500/25 transition cursor-pointer"
            >
              <span>Log Out</span>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="px-6 py-4 border-b border-emerald-500/15 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-base font-extrabold text-emerald-50">
                {navItems.find((n) => n.id === activeTab)?.label}
              </h2>
              <p className="text-[11px] text-emerald-300/65">
                Manage your Leafsty identity, security & workspace preferences
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#0d261e] text-emerald-300/75 hover:text-emerald-50 hover:bg-emerald-500/20 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            {activeTab === "account" && (
              <>
                <div className="rounded-2xl overflow-hidden border border-emerald-500/20 bg-[#0b211a]">
                  <div
                    className="h-16 w-full"
                    style={{ backgroundColor: form.bannerColor }}
                  />
                  <div className="px-4 pb-4 -mt-7 flex items-end justify-between gap-3">
                    <div className="flex items-end gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-600 ring-4 ring-[#0b211a] text-white font-extrabold text-lg flex items-center justify-center overflow-hidden">
                        {form.avatarUrl ? (
                          <img
                            src={form.avatarUrl}
                            alt={form.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (form.name || userId || "L").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="pb-0.5">
                        <div className="text-sm font-extrabold text-emerald-50">
                          {form.name || userId}
                        </div>
                        <div className="text-[11px] text-emerald-300/75">
                          @{userId} · {form.status}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("profile")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Edit User Profile
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0b211a] border border-emerald-500/20 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/60">
                      User ID (Share for DM Invites)
                    </div>
                    <div className="text-sm font-extrabold text-emerald-50 mt-0.5 font-mono">
                      {userId || "unknown"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>

                <form
                  onSubmit={handleResetPassword}
                  className="p-4 rounded-2xl bg-[#0b211a] border border-emerald-500/20 space-y-2.5"
                >
                  <div className="flex items-center gap-2 font-extrabold text-emerald-50">
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    <span>Password & Authentication</span>
                  </div>

                  <input
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={(e) =>
                      setPwForm((p) => ({ ...p, currentPassword: e.target.value }))
                    }
                    placeholder="Current password"
                    className="w-full px-3 py-2 rounded-xl bg-[#061410] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="password"
                      value={pwForm.newPassword}
                      onChange={(e) =>
                        setPwForm((p) => ({ ...p, newPassword: e.target.value }))
                      }
                      placeholder="New password"
                      className="w-full px-3 py-2 rounded-xl bg-[#061410] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                    />
                    <input
                      type="password"
                      value={pwForm.confirmPassword}
                      onChange={(e) =>
                        setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))
                      }
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2 rounded-xl bg-[#061410] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  {pwStatus.error && (
                    <p className="text-[11px] text-red-300">{pwStatus.error}</p>
                  )}
                  {pwStatus.success && (
                    <p className="text-[11px] text-emerald-300 font-bold">
                      Password updated!
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={pwStatus.loading}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs transition cursor-pointer"
                  >
                    {pwStatus.loading ? "Updating..." : "Change Password"}
                  </button>
                </form>
              </>
            )}
            {activeTab === "profile" && (
              <form onSubmit={handleSave} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300/70 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-50 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300/70 mb-1">
                      Pronouns
                    </label>
                    <input
                      type="text"
                      value={form.pronouns}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, pronouns: e.target.value }))
                      }
                      placeholder="e.g. they/them"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-50 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300/70 mb-1">
                    Avatar Image URL
                  </label>
                  <input
                    type="text"
                    value={form.avatarUrl}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, avatarUrl: e.target.value }))
                    }
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-50 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300/70 mb-1.5">
                    Profile Banner Color
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {BANNER_SWATCHES.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({ ...p, bannerColor: hex }))
                        }
                        style={{ backgroundColor: hex }}
                        className={`w-7 h-7 rounded-xl transition cursor-pointer ${
                          form.bannerColor === hex
                            ? "ring-2 ring-white scale-110"
                            : "opacity-80 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300/70 mb-1">
                    Custom Status
                  </label>
                  <input
                    type="text"
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, status: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-50 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300/70 mb-1">
                    About Me
                  </label>
                  <textarea
                    rows={3}
                    value={form.bio}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, bio: e.target.value }))
                    }
                    placeholder="Share a short bio on your profile card..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-50 focus:outline-none focus:border-emerald-400 resize-none"
                  />
                </div>

                <div className="pt-1 flex items-center justify-between">
                  {savedBanner ? (
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Changes saved!
                    </span>
                  ) : (
                    <span />
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs transition cursor-pointer"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            )}
            {activeTab === "appearance" && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#0b211a] border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-emerald-50 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Dark Forest Emerald Theme</span>
                    </div>
                    <p className="text-[11px] text-emerald-300/70 mt-0.5">
                      Active across all Leafsty spaces, DMs, and call rooms.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                    Active
                  </span>
                </div>

                <label className="p-4 rounded-2xl bg-[#0b211a] border border-emerald-500/20 flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-extrabold text-emerald-50">
                      Press Enter to Send Messages
                    </div>
                    <p className="text-[11px] text-emerald-300/70 mt-0.5">
                      Send encrypted messages immediately when pressing Enter.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.enterToSend}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, enterToSend: e.target.checked }))
                    }
                    className="accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition cursor-pointer"
                  >
                    {savedBanner ? "Saved!" : "Save Preferences"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#0b211a] border border-emerald-500/20 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold text-emerald-50">
                      End-to-End Encryption (E2EE)
                    </div>
                    <p className="text-[11px] text-emerald-300/75 mt-1 leading-relaxed">
                      Every Leafsty channel and direct message room encrypts
                      messages client-side before transmission.
                    </p>
                  </div>
                </div>

                <label className="p-4 rounded-2xl bg-[#0b211a] border border-emerald-500/20 flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-extrabold text-emerald-50">
                      Filter Unknown DMs Into Message Requests
                    </div>
                    <p className="text-[11px] text-emerald-300/70 mt-0.5">
                      Require explicit Accept/Decline before opening new DMs.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.readReceipts}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, readReceipts: e.target.checked }))
                    }
                    className="accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            )}
            {activeTab === "notifications" && (
              <div className="space-y-3">
                <label className="p-4 rounded-2xl bg-[#0b211a] border border-emerald-500/20 flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-extrabold text-emerald-50">
                      Direct Message & Invite Alerts
                    </div>
                    <p className="text-[11px] text-emerald-300/70 mt-0.5">
                      Highlight incoming DM requests and unread message badges.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.dmNotifications}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        dmNotifications: e.target.checked,
                      }))
                    }
                    className="accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="p-4 rounded-2xl bg-[#0b211a] border border-emerald-500/20 flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-extrabold text-emerald-50">
                      Call & Message Sound Effects
                    </div>
                    <p className="text-[11px] text-emerald-300/70 mt-0.5">
                      Play audio cues for incoming voice/video calls and pokes.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.soundEffects}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        soundEffects: e.target.checked,
                      }))
                    }
                    className="accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition cursor-pointer"
                  >
                    {savedBanner ? "Saved!" : "Save Notification Settings"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
