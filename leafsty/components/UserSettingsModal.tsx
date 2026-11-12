"use client";

import React, { useState } from "react";
import { useChatContext } from "stream-chat-react";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserSettingsModal({
  isOpen,
  onClose,
}: UserSettingsModalProps) {
  const { client } = useChatContext();
  const currentUser = (client?.user as any) || {};

  const [displayName, setDisplayName] = useState<string>(
    currentUser.name || currentUser.id || ""
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(
    currentUser.image || ""
  );
  const [statusText, setStatusText] = useState<string>(
    currentUser.statusText || "Online"
  );
  const [aboutMe, setAboutMe] = useState<string>(
    currentUser.aboutMe || ""
  );
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client?.userID) return;

    try {
      setSaving(true);
      setSavedMessage("");

      const updatedFields = {
        name: displayName.trim() || client.userID,
        image: avatarUrl.trim() || undefined,
        statusText: statusText.trim() || "Online",
        aboutMe: aboutMe.trim(),
      };

      if (client.user) {
        Object.assign(client.user, updatedFields);
      }

      const rawUser = localStorage.getItem("stream_user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        localStorage.setItem(
          "stream_user",
          JSON.stringify({ ...parsed, ...updatedFields })
        );
      }

      await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: client.userID,
          username: updatedFields.name,
          image: updatedFields.image,
        }),
      });

      setSavedMessage("Leafsty profile saved!");
    } catch (error) {
      console.error("Failed to update user profile:", error);
      setSavedMessage("Error saving changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("stream_user");
      localStorage.removeItem("stream_token");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      await client?.disconnectUser();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.replace("/");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-[#f7faf8] text-zinc-800">
      {/* Left Navigation Sidebar */}
      <div className="w-60 bg-[#eef4f0] flex flex-col justify-between p-6 border-r border-emerald-100">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-3 px-2">
            Leafsty Settings
          </p>
          <div className="space-y-1">
            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow-2xs cursor-pointer"
            >
              My Profile
            </button>
          </div>
        </div>

        <div className="border-t border-emerald-200/70 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-sm font-semibold cursor-pointer transition"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Main Profile Settings Panel */}
      <div className="flex-1 overflow-y-auto p-10 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-900">My Leafsty Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex flex-col items-center text-zinc-400 hover:text-emerald-700 cursor-pointer transition"
          >
            <span className="w-9 h-9 rounded-full border-2 border-zinc-300 hover:border-emerald-500 flex items-center justify-center text-lg">
              ×
            </span>
            <span className="text-[11px] font-semibold mt-1">ESC</span>
          </button>
        </div>

        {/* Live Leafsty Profile Banner Preview */}
        <div className="rounded-2xl bg-white border border-emerald-100 overflow-hidden mb-6 shadow-sm">
          <div className="h-22 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-400" />
          <div className="px-6 pb-5 relative">
            <div className="-mt-10 mb-3 flex items-end justify-between">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-20 h-20 rounded-2xl border-4 border-white object-cover bg-emerald-50 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl border-4 border-white bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                  {(displayName || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-zinc-900">
              {displayName || "User"}
            </h3>
            <p className="text-xs text-zinc-500">
              @{currentUser.id || "user"} • {statusText}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-emerald-800 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl bg-white border border-emerald-200 px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-emerald-800 mb-1.5">
              Avatar Image URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-xl bg-white border border-emerald-200 px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-emerald-800 mb-1.5">
              Custom Status
            </label>
            <input
              type="text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="Online"
              className="w-full rounded-xl bg-white border border-emerald-200 px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-emerald-800 mb-1.5">
              About Me
            </label>
            <textarea
              rows={3}
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              placeholder="Tell others a bit about yourself..."
              className="w-full rounded-xl bg-white border border-emerald-200 px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition cursor-pointer"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
            {savedMessage && (
              <span className="text-sm text-emerald-700 font-medium">
                {savedMessage}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
