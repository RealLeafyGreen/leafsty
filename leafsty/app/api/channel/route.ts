import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || "list");

    const apiKey =
      process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY;
    const apiSecret =
      process.env.STREAM_API_SECRET || process.env.STREAM_SECRET_KEY;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream credentials missing on server" },
        { status: 500 }
      );
    }

    const serverClient = new StreamClient(apiKey, apiSecret);

    if (action === "accept") {
      const cType = String(body?.channelType || "messaging");
      const cId = String(body?.channelId || body?.id || "");
      if (!cId) {
        return NextResponse.json(
          { error: "Missing channelId" },
          { status: 400 }
        );
      }
      const ch = (serverClient as any).chat.channel(cType, cId);
      await ch.updatePartial({
        set: {
          invite_status: "accepted",
          accepted_by: String(body?.userId || ""),
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "create") {
      const cType = String(body?.channelType || body?.type || "messaging");
      const cId = String(body?.channelId || body?.id || "");
      const creatorId = String(body?.userId || "");
      const members = Array.isArray(body?.members) ? body.members : [];

      if (!cId || !creatorId) {
        return NextResponse.json(
          { error: "Missing channelId or userId" },
          { status: 400 }
        );
      }

      const ch = (serverClient as any).chat.channel(cType, cId, {
        created_by_id: creatorId,
        members,
        ...(body?.name ? { name: body.name } : {}),
        ...(body?.serverId ? { serverId: body.serverId } : {}),
        ...(cType === "messaging" && !body?.serverId
          ? { invite_status: "pending", invited_by: creatorId }
          : {}),
      });

      await ch.getOrCreate();
      return NextResponse.json({ ok: true, id: cId });
    }

    const userId = String(body?.userId || "");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const response = await (serverClient as any).chat.queryChannels({
      filter_conditions: {
        type: "messaging",
        members: { $in: [userId] },
      },
      sort: [{ last_message_at: -1 }, { updated_at: -1 }],
      limit: 50,
      state: true,
    });

    const list = Array.isArray(response)
      ? response
      : response?.channels || [];

    const serialized = list.map((item: any) => {
      const ch = item?.channel || item;
      const membersList = Array.isArray(item?.members)
        ? item.members
        : Object.values(ch?.state?.members || item?.state?.members || {});

      const membersMap: Record<string, any> = {};
      for (const m of membersList as any[]) {
        const uid = String(m?.user_id || m?.user?.id || "");
        if (uid) {
          membersMap[uid] = {
            user_id: uid,
            user: m?.user || { id: uid },
          };
        }
      }

      return {
        id: ch?.id,
        type: ch?.type || "messaging",
        channel: ch || {},
        members: membersMap,
      };
    });

    return NextResponse.json({ channels: serialized });
  } catch (err: any) {
    console.error("POST /api/channel error:", err);
    return NextResponse.json(
      { error: err?.message || "Channel request failed" },
      { status: 500 }
    );
  }
}
