"use client";

import React, { useState } from "react";
import { useChatContext } from "stream-chat-react";
import UserCard from "../../UserCard";
import UserProfilePopover from "../../UserProfilePopover";
import UserSettingsModal from "../../UserSettingsModal";

export default function ChannelListBottomBar() {
  const { client } = useChatContext();
  const currentUser = (client?.user as any) || {};

  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const displayName = currentUser.name || currentUser.id || "User";
  const statusText = currentUser.statusText || "Online";

  return (
    <>
      <div className="relative h-[54px] bg-[#f4f7f5] border-t border-emerald-100 px-2 flex items-center justify-between select-none">
        {/* Leafsty Profile Card Popover (Renders above bottom bar when clicked) */}
        {showProfileCard && (
          <div className="absolute bottom-15 left-2 z-40">
            <UserProfilePopover
              user={{
                id: currentUser.id || "user",
                name: displayName,
                image: currentUser.image,
                statusText,
                aboutMe: currentUser.aboutMe,
                createdAt: currentUser.created_at,
                isCurrentUser: true,
              }}
              onClose={() => setShowProfileCard(false)}
              onEditProfile={() => {
                setShowProfileCard(false);
                setShowSettings(true);
              }}
            />
          </div>
        )}

        {/* Left: User Avatar & Name (Click to Toggle Leafsty User Card) */}
        <button
          type="button"
          onClick={() => setShowProfileCard((prev) => !prev)}
          className="flex items-center gap-2 px-1.5 py-1 rounded-xl hover:bg-emerald-100/60 transition min-w-0 flex-1 cursor-pointer"
        >
          <UserCard
            user={{
              id: currentUser.id || "user",
              name: displayName,
              image: currentUser.image,
              online: true,
              statusText,
            }}
          />
        </button>

        {/* Right: Mute, Deafen, and Settings Gear */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setMuted((prev) => !prev)}
            title={muted ? "Unmute" : "Mute"}
            className={`p-1.5 rounded-lg hover:bg-emerald-100/70 transition cursor-pointer ${
              muted ? "text-red-600" : "text-zinc-600"
            }`}
          >
            🎤
          </button>

          <button
            type="button"
            onClick={() => setDeafened((prev) => !prev)}
            title={deafened ? "Undeafen" : "Deafen"}
            className={`p-1.5 rounded-lg hover:bg-emerald-100/70 transition cursor-pointer ${
              deafened ? "text-red-600" : "text-zinc-600"
            }`}
          >
            🎧
          </button>

          <button
            type="button"
            onClick={() => {
              setShowProfileCard(false);
              setShowSettings(true);
            }}
            title="User Settings"
            className="p-1.5 rounded-lg text-zinc-600 hover:bg-emerald-100/70 hover:text-emerald-800 transition cursor-pointer"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* User Settings Modal */}
      <UserSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
