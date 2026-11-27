import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

function getServerClient() {
  const apiKey =
    process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY;
  const apiSecret =
    process.env.STREAM_API_SECRET || process.env.STREAM_SECRET_KEY;
  if (!apiKey || !apiSecret) return null;
  return new StreamClient(apiKey, apiSecret);
}

async function getUserLists(serverClient: any, userId: string) {
  const res = await serverClient.queryUsers({
  payload: {
    filter_conditions: { id: { $eq: userId } },
    limit: 1,
  },
});
const u = Array.isArray(res?.users) ? res.users.at(0) : null;
  if (!u) return null;
  return {
    user: u,
    friends: Array.isArray(u.friends) ? (u.friends as string[]) : [],
    incoming: Array.isArray(u.incoming_requests)
      ? (u.incoming_requests as string[])
      : [],
    outgoing: Array.isArray(u.outgoing_requests)
      ? (u.outgoing_requests as string[])
      : [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || "list");
    const userId = String(body?.userId || "").trim().toLowerCase();
    const targetId = String(body?.targetId || "")
      .trim()
      .toLowerCase()
      .replace(/^@/, "");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const serverClient = getServerClient();
    if (!serverClient) {
      return NextResponse.json(
        { error: "Stream credentials not configured" },
        { status: 500 }
      );
    }

    const me = await getUserLists(serverClient, userId);
    if (!me) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "send") {
      if (!targetId) {
        return NextResponse.json(
          { error: "Enter a username to add." },
          { status: 400 }
        );
      }
      if (targetId === userId) {
        return NextResponse.json(
          { error: "You cannot add yourself as a friend." },
          { status: 400 }
        );
      }

      const target = await getUserLists(serverClient, targetId);
      if (!target) {
        return NextResponse.json(
          { error: `User "@${targetId}" does not exist on Leafsty.` },
          { status: 404 }
        );
      }

      if (me.friends.includes(targetId)) {
        return NextResponse.json(
          { error: `You are already friends with @${targetId}.` },
          { status: 400 }
        );
      }

      // If they already sent us a request, auto-accept both!
      if (me.incoming.includes(targetId)) {
        await (serverClient as any).updateUsersPartial({
          users: [
            {
              id: userId,
              set: {
                friends: Array.from(new Set([...me.friends, targetId])),
                incoming_requests: me.incoming.filter((id) => id !== targetId),
                outgoing_requests: me.outgoing.filter((id) => id !== targetId),
              },
            },
            {
              id: targetId,
              set: {
                friends: Array.from(new Set([...target.friends, userId])),
                incoming_requests: target.incoming.filter((id) => id !== userId),
                outgoing_requests: target.outgoing.filter((id) => id !== userId),
              },
            },
          ],
        });
        return NextResponse.json({ ok: true, autoAccepted: true });
      }

      await (serverClient as any).updateUsersPartial({
        users: [
          {
            id: userId,
            set: {
              outgoing_requests: Array.from(new Set([...me.outgoing, targetId])),
            },
          },
          {
            id: targetId,
            set: {
              incoming_requests: Array.from(
                new Set([...target.incoming, userId])
              ),
            },
          },
        ],
      });

      return NextResponse.json({ ok: true });
    }

    if (action === "accept" && targetId) {
      const target = await getUserLists(serverClient, targetId);
      await (serverClient as any).updateUsersPartial({
        users: [
          {
            id: userId,
            set: {
              friends: Array.from(new Set([...me.friends, targetId])),
              incoming_requests: me.incoming.filter((id) => id !== targetId),
              outgoing_requests: me.outgoing.filter((id) => id !== targetId),
            },
          },
          ...(target
            ? [
                {
                  id: targetId,
                  set: {
                    friends: Array.from(new Set([...target.friends, userId])),
                    incoming_requests: target.incoming.filter(
                      (id) => id !== userId
                    ),
                    outgoing_requests: target.outgoing.filter(
                      (id) => id !== userId
                    ),
                  },
                },
              ]
            : []),
        ],
      });
      return NextResponse.json({ ok: true });
    }

    if ((action === "decline" || action === "remove") && targetId) {
      const target = await getUserLists(serverClient, targetId);
      await (serverClient as any).updateUsersPartial({
        users: [
          {
            id: userId,
            set: {
              friends: me.friends.filter((id) => id !== targetId),
              incoming_requests: me.incoming.filter((id) => id !== targetId),
              outgoing_requests: me.outgoing.filter((id) => id !== targetId),
            },
          },
          ...(target
            ? [
                {
                  id: targetId,
                  set: {
                    friends: target.friends.filter((id) => id !== userId),
                    incoming_requests: target.incoming.filter(
                      (id) => id !== userId
                    ),
                    outgoing_requests: target.outgoing.filter(
                      (id) => id !== userId
                    ),
                  },
                },
              ]
            : []),
        ],
      });
      return NextResponse.json({ ok: true });
    }

    // Default: "list" — hydrate user details for friends & pending requests
    const allIds = Array.from(
      new Set([...me.friends, ...me.incoming, ...me.outgoing])
    );
    let userProfiles: Record<string, any> = {};
    if (allIds.length > 0) {
     const hydrated = await (serverClient as any).queryUsers({
  payload: {
    filter_conditions: { id: { $in: allIds } },
    limit: 100,
  },
});

      for (const u of hydrated?.users || []) {
        userProfiles[String(u.id)] = {
          id: String(u.id),
          name: String(u.name || u.id),
          image: String(u.image || ""),
          online: Boolean(u.online) && !u.invisible,
          presence: u.invisible
            ? "offline"
            : u.presence_status || (u.online ? "online" : "offline"),
        };
      }
    }

    const toUserObj = (id: string) =>
      userProfiles[id] || {
        id,
        name: id,
        image: "",
        online: false,
        presence: "offline",
      };

    return NextResponse.json({
      friends: me.friends.map(toUserObj),
      incoming: me.incoming.map(toUserObj),
      outgoing: me.outgoing.map(toUserObj),
    });
  } catch (err: any) {
    console.error("POST /api/friends error:", err);
    return NextResponse.json(
      { error: err?.message || "Friends request failed" },
      { status: 500 }
    );
  }
}
