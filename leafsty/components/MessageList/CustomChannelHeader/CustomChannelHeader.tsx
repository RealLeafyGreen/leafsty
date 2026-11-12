import React from "react";
import type { ChannelHeaderProps } from "stream-chat-react";

export default function CustomChannelHeader(
  props: ChannelHeaderProps
): React.JSX.Element {
  return (
    <div className="flex items-center space-x-3 p-3 border-b-2 border-b-gray-200">
      <span className="text-3xl text-gray-500">#</span>
      <span className="font-bold lowercase">{props.title || "general"}</span>
    </div>
  );
}
