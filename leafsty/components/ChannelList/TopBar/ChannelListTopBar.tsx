"use client";

import React, { useState } from "react";
import { CloseIcon, ChevronDown } from "../Icons";
import { menuItems, ChannelListMenuRow } from "./menuItems";

export default function ChannelListTopBar({
  serverName,
}: {
  serverName: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative w-full border-b border-zinc-200 select-none">
      <button
        onClick={() => setMenuOpen((currentValue) => !currentValue)}
        className="flex items-center justify-between w-full h-12 px-4 font-bold text-zinc-900 hover:bg-zinc-200/60 transition cursor-pointer"
      >
        <span className="truncate">{serverName}</span>
        {menuOpen ? <CloseIcon /> : <ChevronDown />}
      </button>

      {menuOpen && (
        <div className="absolute left-2.5 top-14 z-50 w-56 rounded-md bg-white p-1.5 shadow-lg border border-zinc-200">
          {menuItems.map((option) => (
            <div key={option.name} onClick={() => setMenuOpen(false)}>
              <ChannelListMenuRow {...option} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
