import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || "mmhfdzb5evj2";
const apiSecret = process.env.STREAM_SECRET || "";

export async function POST(req: Request) {
  try {
    const { serverName, userId } = await req.json();
    const cleanServer = String(serverName || "").trim();
    const cleanUser = String(userId || "").trim();

    if (!cleanServer || !cleanUser) {
      return NextResponse.json(
        { error: "Missing serverName or userId" },
        { status: 400 }
      );
    }

    if (!apiSecret) {
      return NextResponse.json(
        { error: "STREAM_SECRET is not configured in .env.local" },
        { status: 500 }
      );
    }

    const serverClient = new StreamClient(apiKey, apiSecret);

    const res = await serverClient.chat.queryChannels({
      filter_conditions: { type: "messaging" },
      sort: [{ field: "last_message_at", direction: -1 }],
      limit: 50,
    });

    const allChannels = res?.channels || [];
    const matching = allChannels.filter(
      (item: any) =>
        String(item.channel?.custom?.server || "").toLowerCase() ===
        cleanServer.toLowerCase()
    );

    if (matching.length === 0) {
      const slug = cleanServer.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const channelId = `srv-${slug}-general`;
      await serverClient.chat.getOrCreateChannel({
        type: "messaging",
        id: channelId,
        data: {
          created_by_id: cleanUser,
          members: [{ user_id: cleanUser }],
          custom: { server: cleanServer, name: "general" },
        },
      });
      return NextResponse.json({ joined: true, channelId, count: 1 });
    }

    for (const item of matching) {
      const chId = item.channel?.id;
      if (!chId) continue;
      await serverClient.chat.updateChannel({
        type: "messaging",
        id: chId,
        add_members: [{ user_id: cleanUser }],
      });
    }

    return NextResponse.json({
      joined: true,
      channelId: matching.at(0)?.channel?.id,
      count: matching.length,
    });
  } catch (err: any) {
    console.error("Invite join error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to join server" },
      { status: 500 }
    );
  }
}
