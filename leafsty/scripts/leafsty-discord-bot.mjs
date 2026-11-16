import fs from "node:fs";

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("Missing DISCORD_BOT_TOKEN environment variable.");
  console.error('Run: DISCORD_BOT_TOKEN="YOUR_TOKEN" node scripts/leafsty-discord-bot.mjs');
  process.exit(1);
}

const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";

function saveGuildFromGateway(guild) {
  const allChannels = Array.isArray(guild.channels) ? guild.channels : [];

  const textChannels = allChannels
    .filter((c) => c.type === 0 || c.type === 5)
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      topic: c.topic || "",
    }));

  const iconUrl =
    guild.id && guild.icon
      ? `https://discordapp.com{guild.id}/${guild.icon}.${
          String(guild.icon).startsWith("a_") ? "gif" : "png"
        }?size=256`
      : "";

  const exportPayload = {
    guild: {
      id: guild.id,
      name: guild.name,
      iconUrl,
    },
    channels: textChannels,
  };

  const slug = String(guild.name || guild.id)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const fileName = `leafsty-export-${slug}.json`;
  fs.writeFileSync(fileName, JSON.stringify(exportPayload, null, 2));
  console.log(`Exported "${guild.name}" (${textChannels.length} channels) -> ${fileName}`);
}

const ws = new WebSocket(GATEWAY_URL);
let heartbeatTimer = null;
let seq = null;

ws.onmessage = (event) => {
  const payload = JSON.parse(event.data);
  const { op, d, s, t } = payload;
  if (s !== null) seq = s;

  if (op === 10) {
    heartbeatTimer = setInterval(() => {
      ws.send(JSON.stringify({ op: 1, d: seq }));
    }, d.heartbeat_interval);

    ws.send(
      JSON.stringify({
        op: 2,
        d: {
          token: BOT_TOKEN,
          intents: (1 << 0) | (1 << 9),
          properties: { os: "linux", browser: "leafsty", device: "leafsty" },
        },
      })
    );
  }

  if (t === "READY") {
    console.log(`Logged in as ${d.user.username}#${d.user.discriminator}`);
    console.log(`Receiving full channel lists for ${d.guilds.length} server(s)...`);
  }

  if (t === "GUILD_CREATE") {
    saveGuildFromGateway(d);
  }
};

ws.onerror = (err) => {
  console.error("WebSocket error:", err);
};

ws.onclose = (ev) => {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  console.log(`Discord Gateway closed (code ${ev.code}).`);
};
