"use client";

import React, { Dispatch, SetStateAction } from "react";

interface MessageOptionsProps {
  displayOptions: boolean;
  setDisplayOptions: Dispatch<SetStateAction<boolean>>;
  handleOpenThread: (event: React.MouseEvent) => void;
  setShowReactions: Dispatch<SetStateAction<boolean>>;
}

export default function MessageOptions({
  displayOptions,
  setDisplayOptions,
  handleOpenThread,
  setShowReactions,
}: MessageOptionsProps) {
  if (!displayOptions) return null;

  return (
    <div
      onMouseEnter={() => setDisplayOptions(true)}
      onMouseLeave={() => setDisplayOptions(false)}
      className="absolute right-4 -top-4 flex items-center bg-white border border-zinc-200 rounded shadow-sm overflow-hidden z-20"
    >
      <button
        onClick={() => setShowReactions((prev) => !prev)}
        title="Add Reaction"
        className="p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <button
        onClick={handleOpenThread}
        title="Reply in Thread"
        className="p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>

      <button
        onClick={handleOpenThread}
        title="Create Thread"
        className="p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      </button>
    </div>
  );
}
