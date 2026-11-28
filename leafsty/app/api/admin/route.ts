import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

const ADMIN_USER_IDS = new Set([
  "leafygreen",
  "realleafygreen",
  "jomkos",
]);

function isServerAdmin(userId: string, userName = ""): boolean {
  return [userId, userName]
    .map((v) => String(v || "").trim().toLowerCase())
    .filter(Boolean)
    .some(
      (clean) =>
        ADMIN_USER_IDS.has(clean) ||
        clean.startsWith("leafygreen") ||
        clean.startsWith("realleafygreen") ||
        clean.startsWith("jomkos")
    );
}
function parseBanDurationAndReason(argText: string): {
  targetId: string;
  expiresAt: string | null;
  reason: string;
} {
  const parts = argText.trim().split(/\s+/);
  const targetId = (parts.shift() || "").toLowerCase().replace(/^@/, "");
  let expiresAt: string | null = null;

  const maybeTime = parts[0] || "";
  const match = maybeTime.match(/^(\d+)(m|h|d|w)$/i);
  if (match) {
    parts.shift();
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const mult =
      unit === "m"
        ? 60_000
        : unit === "h"
        ? 3_600_000
        : unit === "d"
        ? 86_400_000
        : 604_800_000;
    expiresAt = new Date(Date.now() + amount * mult).toISOString();
  }

  const reason = parts.join(" ").trim() || "Violation of Leafsty community rules";
  return { targetId, expiresAt, reason };
}

export async function POST(req: NextRequest) {
  try {
    const {
      command,
      argText = "",
      userId,
      userName = "",
      channelType = "messaging",
      channelId,
    } = await req.json();

    const cleanUserId = String(userId || "").trim().toLowerCase();
    if (!isServerAdmin(cleanUserId, userName)) {
      return NextResponse.json(
        {
          error: `Permission denied for "${cleanUserId}": ${command} is restricted to admins.`,
        },
        { status: 403 }
      );
    }

    if (!channelId) {
      return NextResponse.json(
        { error: "Missing active channelId" },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY;
    const apiSecret =
      process.env.STREAM_API_SECRET || process.env.STREAM_SECRET_KEY;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream credentials not configured" },
        { status: 500 }
      );
    }

    const serverClient = new StreamClient(apiKey, apiSecret);
    const channel = (serverClient as any).chat.channel(channelType, channelId);

    const postSystemNotice = async (text: string) => {
      await channel.sendMessage({
        message: {
          text,
          user_id: cleanUserId,
        },
      });
    };

    if (command === "/announce") {
      if (!argText.trim()) {
        return NextResponse.json(
          { error: "Usage: /announce Your message here" },
          { status: 400 }
        );
      }
      await postSystemNotice(`📢 **ANNOUNCEMENT:** ${argText.trim()}`);
      return NextResponse.json({ ok: true });
    }

    if (command === "/clear") {
      const count = Math.min(50, Math.max(1, Number(argText) || 20));
      const res = await channel.query({
        state: true,
        watch: false,
        messages: { limit: count },
      });
      const msgs: any[] = Array.isArray(res?.messages) ? res.messages : [];
      for (const m of msgs) {
        if (m?.id) {
          await (serverClient as any).chat
            .deleteMessage(m.id, { hard: true })
            .catch(() => {});
        }
      }
      return NextResponse.json({ ok: true, deleted: msgs.length });
    }

    if (command === "/kick") {
      const targetId = argText.trim().replace(/^@/, "").toLowerCase();
      if (!targetId) {
        return NextResponse.json(
          { error: "Usage: /kick username" },
          { status: 400 }
        );
      }
      await channel.removeMembers([targetId]);
      await postSystemNotice(`🛡️ **@${targetId}** was removed from the room.`);
      return NextResponse.json({ ok: true });
    }

    if (command === "/ban") {
      const [rawTarget, ...reasonParts] = argText.trim().split(/\s+/);
      const targetId = (rawTarget || "").replace(/^@/, "").toLowerCase();
      if (!targetId) {
        return NextResponse.json(
          { error: "Usage: /ban username [reason]" },
          { status: 400 }
        );
      }
      const reason = reasonParts.join(" ") || "Banned by admin";
      await (serverClient as any).moderation.ban({
        target_user_id: targetId,
        banned_by_id: cleanUserId,
        channel_cid: `${channelType}:${channelId}`,
        reason,
      });
      await postSystemNotice(`🔨 **@${targetId}** was banned (${reason}).`);
      return NextResponse.json({ ok: true });
    }

    if (command === "/unban") {
      const targetId = argText.trim().replace(/^@/, "").toLowerCase();
      if (!targetId) {
        return NextResponse.json(
          { error: "Usage: /unban username" },
          { status: 400 }
        );
      }
      await (serverClient as any).moderation.unban({
        target_user_id: targetId,
        channel_cid: `${channelType}:${channelId}`,
      });
      await postSystemNotice(`✅ **@${targetId}** has been unbanned.`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: `Unknown admin command: ${command}` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("POST /api/admin error:", err);
    return NextResponse.json(
      { error: err?.message || "Admin command failed" },
      { status: 500 }
    );
  }
}
