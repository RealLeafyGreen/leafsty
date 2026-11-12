"use client";

import React from "react";
import {
  Boost,
  PersonAdd,
  Gear,
  PlusCircle,
  FolderPlus,
  FaceSmile,
  Bell,
  Shield,
  Pen,
  SpeakerMuted,
  LeaveServer,
} from "../Icons";

export interface ListRowElement {
  name: string;
  icon: React.ReactNode;
  bottomBorder?: boolean;
  purple?: boolean;
  red?: boolean;
  reverseOrder?: boolean;
}

export const menuItems: ListRowElement[] = [
  { name: "Server Boost", icon: <Boost />, bottomBorder: true, purple: true },
  { name: "Invite People", icon: <PersonAdd />, purple: true },
  { name: "Server Settings", icon: <Gear /> },
  { name: "Create Channel", icon: <PlusCircle /> },
  { name: "Create Category", icon: <FolderPlus /> },
  { name: "Create Event", icon: <FaceSmile />, bottomBorder: true },
  { name: "Notification Settings", icon: <Bell /> },
  { name: "Privacy Settings", icon: <Shield />, bottomBorder: true },
  { name: "Edit Server Profile", icon: <Pen /> },
  { name: "Hide Muted Channels", icon: <SpeakerMuted />, bottomBorder: true },
  { name: "Leave Server", icon: <LeaveServer />, red: true },
];

export function ChannelListMenuRow({
  name,
  icon,
  bottomBorder = false,
  purple = false,
  red = false,
  reverseOrder = false,
}: ListRowElement) {
  return (
    <>
      <div
        className={`flex items-center justify-between px-2.5 py-2 rounded text-sm font-medium cursor-pointer transition ${
          purple
            ? "text-indigo-500 hover:bg-indigo-500 hover:text-white"
            : red
            ? "text-red-500 hover:bg-red-500 hover:text-white"
            : "text-zinc-700 hover:bg-indigo-500 hover:text-white"
        } ${reverseOrder ? "flex-row-reverse" : ""}`}
      >
        <span>{name}</span>
        {icon}
      </div>
      {bottomBorder && <div className="my-1 border-b border-zinc-200" />}
    </>
  );
}
