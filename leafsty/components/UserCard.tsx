"use client";

import React, { useState } from "react";

export interface UserCardData {
  id: string;
  name?: string;
  image?: string;
  online?: boolean;
  lastOnline?: string;
  statusText?: string;
}

export default function UserCard({ user }: { user: UserCardData }) {
  const [imgError, setImgError] = useState(false);
  const displayName = user.name || user.id || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const hasValidImage = Boolean(user.image && !imgError);

  return (
    <div className="flex items-center gap-2.5 w-full">
      <div className="relative shrink-0">
        {hasValidImage ? (
          <img
            src={user.image}
            alt={displayName}
            onError={() => setImgError(true)}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
            {initial}
          </div>
        )}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#f4f7f5] ${
            user.online !== false ? "bg-emerald-500" : "bg-zinc-400"
          }`}
        />
      </div>

      <div className="min-w-0 flex-1 text-left">
        <p className="text-xs font-bold text-zinc-900 truncate">
          {displayName}
        </p>
        <p className="text-[11px] text-zinc-500 truncate">
          {user.statusText || (user.online !== false ? "Online" : "Offline")}
        </p>
      </div>
    </div>
  );
}
