"use client";

import React from "react";

export interface UserObject {
  id: string;
  name?: string;
  image?: string;
  online?: boolean;
  lastOnline?: string;
}

interface UserRowProps {
  user: UserObject;
  userChanged: (user: UserObject, checked: boolean) => void;
}

export default function UserRow({ user, userChanged }: UserRowProps) {
  return (
    <div className="flex items-center justify-between w-full py-2 px-2 hover:bg-zinc-700/40 rounded">
      <label htmlFor={user.id} className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || user.id}
            className="w-8 h-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(user.name || user.id).charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm text-zinc-200 truncate">{user.name || user.id}</span>
      </label>

      <input
        id={user.id}
        type="checkbox"
        onChange={(e) => userChanged(user, e.target.checked)}
        className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
      />
    </div>
  );
}
