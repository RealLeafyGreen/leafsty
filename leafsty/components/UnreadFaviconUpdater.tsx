"use client";

import { useEffect, useState } from "react";
import { useChatContext } from "stream-chat-react";

export default function UnreadFaviconUpdater({
  baseIconSrc = "/logo-hover.png",
  baseTitle = "Leafsty",
}: {
  baseIconSrc?: string;
  baseTitle?: string;
}) {
  const { client } = useChatContext();
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync unread count from Stream Chat client events
  useEffect(() => {
    if (!client) return;

    const syncUnread = () => {
      const userUnread = (client.user as any)?.total_unread_count;
      if (typeof userUnread === "number") {
        setUnreadCount(userUnread);
        return;
      }

      const active = Object.values((client as any).activeChannels || {}) as any[];
      const sum = active.reduce((acc, ch) => {
        const count =
          typeof ch.countUnread === "function" ? ch.countUnread() : 0;
        return acc + (count || 0);
      }, 0);
      setUnreadCount(sum);
    };

    syncUnread();

    const subNew = client.on("message.new", (event: any) => {
      if (typeof event?.total_unread_count === "number") {
        setUnreadCount(event.total_unread_count);
      } else {
        syncUnread();
      }
    });

    const subNotif = client.on("notification.message_new", (event: any) => {
      if (typeof event?.total_unread_count === "number") {
        setUnreadCount(event.total_unread_count);
      } else {
        syncUnread();
      }
    });

    const subRead = client.on("message.read", (event: any) => {
      if (typeof event?.total_unread_count === "number") {
        setUnreadCount(event.total_unread_count);
      } else {
        syncUnread();
      }
    });

    const subMarkRead = client.on("notification.mark_read", (event: any) => {
      if (typeof event?.total_unread_count === "number") {
        setUnreadCount(event.total_unread_count);
      } else {
        syncUnread();
      }
    });

    return () => {
      subNew.unsubscribe();
      subNotif.unsubscribe();
      subRead.unsubscribe();
      subMarkRead.unsubscribe();
    };
  }, [client]);

  // Draw dynamic badge onto favicon & update document.title
  useEffect(() => {
    if (typeof document === "undefined") return;

    document.title =
      unreadCount > 0 ? `(${unreadCount}) ${baseTitle}` : baseTitle;

    let link = document.querySelector(
      "link[rel*='icon']"
    ) as HTMLLinkElement | null;

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = baseIconSrc;

    img.onload = () => {
      const size = 32;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw base Leafsty logo
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);

      // Draw red unread badge pill if unreadCount > 0
      if (unreadCount > 0) {
        const label = unreadCount > 9 ? "9+" : String(unreadCount);
        const radius = 9;
        const cx = size - radius;
        const cy = size - radius;

        // White outer ring for contrast
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        // Red notification circle
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ef4444";
        ctx.fill();

        // Bold white unread count text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, cx, cy + 0.5);
      }

      if (link) {
        link.type = "image/png";
        link.href = canvas.toDataURL("image/png");
      }
    };
  }, [unreadCount, baseIconSrc, baseTitle]);

  return null;
}
