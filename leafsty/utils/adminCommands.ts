const ADMIN_USER_IDS = new Set([
  "leafygreen",
  "jomkos",
]);

export function isLeafstyAdmin(userId: string, userRole?: string): boolean {
  const clean = String(userId || "").trim().toLowerCase();
  if (!clean) return false;
  if (userRole === "admin" || userRole === "owner") return true;
  return ADMIN_USER_IDS.has(clean);
}

export const ADMIN_SLASH_COMMANDS = [
  {
    cmd: "/clear",
    usage: "/clear [count]",
    desc: "Admin: Clear recent messages in this room (default 20)",
    template: "/clear 20",
    adminOnly: true,
  },
  {
    cmd: "/announce",
    usage: "/announce Your message here",
    desc: "Admin: Post a highlighted room announcement",
    template: "/announce ",
    adminOnly: true,
  },
  {
    cmd: "/kick",
    usage: "/kick username",
    desc: "Admin: Remove a member from this room",
    template: "/kick ",
    adminOnly: true,
  },
  {
    cmd: "/ban",
    usage: "/ban username [reason]",
    desc: "Admin: Ban a user from this room",
    template: "/ban ",
    adminOnly: true,
  },
  {
    cmd: "/unban",
    usage: "/unban username",
    desc: "Admin: Unban a user from this room",
    template: "/unban ",
    adminOnly: true,
  },
];

export async function executeAdminCommand(params: {
  rawText: string;
  channel: any;
  client: any;
  currentUserId: string;
  sendAnnouncement: (text: string) => Promise<void>;
}): Promise<{ handled: boolean; error?: string }> {
  const { rawText, channel, client, currentUserId } = params;
  const trimmed = rawText.trim();
  const [cmdRaw, ...restParts] = trimmed.split(/\s+/);
  const cmd = cmdRaw.toLowerCase();
  const argText = restParts.join(" ").trim();

  const adminCmd = ADMIN_SLASH_COMMANDS.find((c) => c.cmd === cmd);
  if (!adminCmd) return { handled: false };

  const userRole = String((client?.user as any)?.role || "");
  if (!isLeafstyAdmin(currentUserId, userRole)) {
    return {
      handled: true,
      error: `Permission denied: ${cmd} is restricted to Leafsty admins.`,
    };
  }

  try {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: cmd,
        argText,
        userId: currentUserId,
        channelType: channel?.type || "messaging",
        channelId: channel?.id || channel?.cid?.split(":")[1],
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { handled: true, error: data?.error || `Failed to run ${cmd}` };
    }
    return { handled: true };
  } catch (err: any) {
    return { handled: true, error: err?.message || `Failed to run ${cmd}` };
  }
}