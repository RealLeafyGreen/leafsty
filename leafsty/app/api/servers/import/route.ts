import { NextResponse } from "next/server";

const KNOWN_PRESETS: Record<
  string,
  { name: string; description: string; channels: string[] }
> = {
  blacket: {
    name: "Blacket",
    description: "Official Blacket Community Server",
    channels: [
      "welcome",
      "rules",
      "announcements",
      "updates",
      "giveaways",
      "general",
      "trading",
      "pack-openings",
      "flexes",
      "suggestions",
      "bug-reports",
      "off-topic",
      "media",
      "bot-commands",
      "support",
    ],
  },
};

function extractInviteCode(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(
    /(?:discord\.gg\/|discord(?:app)?\.com\/invite\/)([a-zA-Z0-9-]+)/i
  );
  if (match?.at(1)) return match.at(1)!;
  if (/^[a-zA-Z0-9-]{2,32}$/.test(trimmed)) return trimmed;
  return null;
}

function scrapeGuildViaGateway(
  botToken: string,
  targetHint?: string
): Promise<{
  name: string;
  iconUrl: string;
  channels: string[];
}> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket("wss://gateway.discord.gg/?v=10&encoding=json");
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let seq: number | null = null;
    const guilds: any[] = [];

    const cleanup = () => {
      if (heartbeat) clearInterval(heartbeat);
      try {
        ws.close();
      } catch {}
    };

    const timeout = setTimeout(() => {
      cleanup();
      if (guilds.length > 0) {
        pickBestGuild();
      } else {
        reject(new Error("Timed out waiting for Discord Gateway."));
      }
    }, 6000);

    const pickBestGuild = () => {
      clearTimeout(timeout);
      cleanup();
      const hint = (targetHint || "").toLowerCase();
      const chosen =
        guilds.find((g) => String(g.name || "").toLowerCase().includes(hint)) ||
        guilds.at(0);

      if (!chosen) {
        reject(new Error("Bot is not in any Discord servers yet."));
        return;
      }

      const rawChannels = Array.isArray(chosen.channels) ? chosen.channels : [];
      const channels = rawChannels
        .filter((c: any) => c.type === 0 || c.type === 5)
        .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
        .map((c: any) => String(c.name || "").toLowerCase())
        .filter(Boolean);

      const iconUrl =
        chosen.id && chosen.icon
          ? `https://discordapp.com{chosen.id}/${chosen.icon}.${
              String(chosen.icon).startsWith("a_") ? "gif" : "png"
            }?size=256`
          : "";

      resolve({
        name: chosen.name || "Imported Server",
        iconUrl,
        channels: channels.length > 0 ? channels : ["general"],
      });
    };

    ws.onmessage = (event) => {
      const payload = JSON.parse(String(event.data));
      const { op, d, s, t } = payload;
      if (s !== null) seq = s;

      if (op === 10) {
        heartbeat = setInterval(() => {
          ws.send(JSON.stringify({ op: 1, d: seq }));
        }, d.heartbeat_interval);

        ws.send(
          JSON.stringify({
            op: 2,
            d: {
              token: botToken,
              intents: 1 << 0, // GUILDS intent only (no privileged intents needed!)
              properties: { os: "linux", browser: "leafsty", device: "leafsty" },
            },
          })
        );
      }

      if (t === "GUILD_CREATE") {
        guilds.push(d);
        setTimeout(pickBestGuild, 400);
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error("Could not connect to Discord Gateway."));
    };

    ws.onclose = (ev) => {
      if (ev.code === 4004) {
        clearTimeout(timeout);
        cleanup();
        reject(new Error("Invalid Discord Bot Token."));
      }
    };
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawInvite = searchParams.get("invite") || "";
  const botToken = (searchParams.get("botToken") || "").trim();
  const code = extractInviteCode(rawInvite);

  if (botToken) {
    try {
      const scraped = await scrapeGuildViaGateway(botToken, code || rawInvite);
      return NextResponse.json({
        name: scraped.name,
        description: "Scraped live via Discord Gateway",
        iconUrl: scraped.iconUrl,
        memberCount: 0,
        onlineCount: 0,
        channels: scraped.channels,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err?.message || "Bot Gateway scrape failed" },
        { status: 400 }
      );
    }
  }

  if (!code) {
    return NextResponse.json(
      { error: "Enter a Discord invite link or paste a Bot Token." },
      { status: 400 }
    );
  }

  const preset = KNOWN_PRESETS[code.toLowerCase()];
  if (preset) {
    return NextResponse.json({
      name: preset.name,
      description: preset.description,
      iconUrl: "",
      memberCount: 0,
      onlineCount: 0,
      channels: preset.channels,
    });
  }

  const formattedName = code
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return NextResponse.json({
    name: formattedName,
    description: "Imported Discord Community",
    iconUrl: "",
    memberCount: 0,
    onlineCount: 0,
    channels: ["welcome", "rules", "announcements", "general", "off-topic"],
  });
}
