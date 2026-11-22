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
  Sparkles,
  KeyRound,
} from "lucide-react";

type SettingsTab = "profile" | "privacy" | "account";

export interface UserSettingsModalProps {
  isOpen?: boolean;
  user?: any;
  profile?: any;
  onClose?: () => void;
  onSave?: (updated: any) => Promise<void> | void;
}

export default function UserSettingsModal({
  isOpen = false,
  user,
  profile,
  onClose,
  onSave,
}: UserSettingsModalProps) {
  const sourceUser = profile || user || {};
  const userId = String(sourceUser.id || "");

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [form, setForm] = useState({
    name: "",
    avatarUrl: "",
    status: "Encrypted · Online",
    bio: "",
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
      status: sourceUser.status || "Encrypted · Online",
      bio: sourceUser.bio || "",
    });
    setPwForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPwStatus({ loading: false, error: null, success: false });
    setSavedBanner(false);
  }, [
    isOpen,
    sourceUser.name,
    sourceUser.image,
    sourceUser.status,
    sourceUser.bio,
    userId,
  ]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSave?.({
        name: form.name.trim() || userId,
        image: form.avatarUrl.trim() || undefined,
        status: form.status.trim() || "Encrypted · Online",
        bio: form.bio.trim(),
      });
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
      setPwForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
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
  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 text-emerald-50 select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl bg-[#081914] border border-emerald-500/25 shadow-2xl overflow-hidden flex flex-col sm:flex-row min-h-[440px]"
      >
        <aside className="w-full sm:w-48 bg-[#061410] border-b sm:border-b-0 sm:border-r border-emerald-500/15 p-3 flex flex-col justify-between shrink-0">
          <div>
            <div className="px-2.5 py-2 text-[11px] font-extrabold uppercase tracking-wider text-emerald-300/60">
              User Settings
            </div>

            <nav className="space-y-1 mt-1">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-emerald-500/20 text-emerald-50 border border-emerald-400/25"
                    : "text-emerald-300/75 hover:bg-emerald-500/10 hover:text-emerald-50"
                }`}
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("privacy")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "privacy"
                    ? "bg-emerald-500/20 text-emerald-50 border border-emerald-400/25"
                    : "text-emerald-300/75 hover:bg-emerald-500/10 hover:text-emerald-50"
                }`}
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>E2EE & Privacy</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("account")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "account"
                    ? "bg-emerald-500/20 text-emerald-50 border border-emerald-400/25"
                    : "text-emerald-300/75 hover:bg-emerald-500/10 hover:text-emerald-50"
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Account</span>
              </button>
            </nav>
          </div>

          <button
            type="button"
            onClick={handleLogoutToLanding}
            className="mt-4 w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-red-300 hover:bg-red-500/15 border border-transparent hover:border-red-500/25 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </aside>

        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-extrabold text-emerald-50">
                {activeTab === "profile"
                  ? "Edit Leafsty Profile"
                  : activeTab === "privacy"
                  ? "End-to-End Encryption"
                  : "Account, Password & Session"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-emerald-300/70 hover:text-emerald-50 hover:bg-emerald-500/15 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeTab === "profile" && (
              <form onSubmit={handleSave} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300/70 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Your display name"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300/70 mb-1">
                    Avatar Image URL
                  </label>
                  <input
                    type="text"
                    value={form.avatarUrl}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        avatarUrl: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300/70 mb-1">
                    Custom Status
                  </label>
                  <input
                    type="text"
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                    placeholder="Encrypted · Online"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300/70 mb-1">
                    About Me
                  </label>
                  <textarea
                    rows={2}
                    value={form.bio}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    placeholder="Tell friends about yourself..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50 focus:outline-none focus:border-emerald-400 resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  {savedBanner ? (
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Profile saved!
                    </span>
                  ) : (
                    <span />
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs transition cursor-pointer"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
            {activeTab === "privacy" && (
              <div className="space-y-3 text-xs text-emerald-200/85">
                <div className="p-3.5 rounded-2xl bg-[#0d261e] border border-emerald-500/20 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold text-emerald-50">
                      End-to-End Encrypted Rooms & DMs
                    </div>
                    <p className="mt-1 text-emerald-300/75 leading-relaxed">
                      Messages sent in Leafsty spaces and direct messages are
                      encrypted per room and protected with Discord-style DM
                      message requests.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "account" && (
              <div className="space-y-3.5 text-xs">
                <div className="p-3 rounded-2xl bg-[#0d261e] border border-emerald-500/20 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/60">
                      Your Leafsty Username / ID
                    </div>
                    <div className="text-sm font-extrabold text-emerald-50 mt-0.5">
                      {userId || "Unknown"}
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
                  className="p-3.5 rounded-2xl bg-[#0d261e] border border-emerald-500/20 space-y-2.5"
                >
                  <div className="flex items-center gap-2 font-extrabold text-emerald-50">
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    <span>Reset Password</span>
                  </div>

                  <input
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={(e) =>
                      setPwForm((p) => ({
                        ...p,
                        currentPassword: e.target.value,
                      }))
                    }
                    placeholder="Current password"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#061410] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="password"
                      value={pwForm.newPassword}
                      onChange={(e) =>
                        setPwForm((p) => ({
                          ...p,
                          newPassword: e.target.value,
                        }))
                      }
                      placeholder="New password"
                      className="w-full px-3 py-1.5 rounded-xl bg-[#061410] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
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
                      className="w-full px-3 py-1.5 rounded-xl bg-[#061410] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  {pwStatus.error && (
                    <p className="text-[11px] text-red-300">{pwStatus.error}</p>
                  )}
                  {pwStatus.success && (
                    <p className="text-[11px] text-emerald-300 font-bold">
                      Password updated successfully!
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={pwStatus.loading}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs transition cursor-pointer"
                  >
                    {pwStatus.loading ? "Updating..." : "Update Password"}
                  </button>
                </form>

                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-extrabold text-red-200">
                      Sign Out of Leafsty
                    </div>
                    <p className="text-[11px] text-red-200/70 mt-0.5">
                      Clears your local session and returns you to the Leafsty
                      home landing page.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogoutToLanding}
                    className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/35 text-red-200 font-extrabold transition cursor-pointer shrink-0"
                  >
                    Log Out
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
