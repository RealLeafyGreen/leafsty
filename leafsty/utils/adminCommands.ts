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
  const { rawText, channel, client, currentUserId, sendAnnouncement } = params;
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

  if (!channel) {
    return { handled: true, error: "No active room selected." };
  }

  try {
    if (cmd === "/announce") {
      if (!argText) {
        return { handled: true, error: "Usage: /announce Your message here" };
      }
      await sendAnnouncement(`📢 **ANNOUNCEMENT:** ${argText}`);
      return { handled: true };
    }

    if (cmd === "/clear") {
      const count = Math.min(50, Math.max(1, Number(argText) || 20));
      const msgs: any[] = Array.isArray(channel?.state?.messages)
        ? [...channel.state.messages].slice(-count)
        : [];
      for (const m of msgs) {
        if (m?.id && !String(m.id).startsWith("temp-")) {
          await client?.deleteMessage?.(m.id).catch(() => {});
        }
      }
      return { handled: true };
    }

    if (cmd === "/kick") {
      const targetId = argText.replace(/^@/, "").toLowerCase();
      if (!targetId) return { handled: true, error: "Usage: /kick username" };
      await channel.removeMembers?.([targetId]);
      await sendAnnouncement(`🛡️ **@${targetId}** was removed from the room.`);
      return { handled: true };
    }

    if (cmd === "/ban") {
      const [rawTarget, ...reasonParts] = argText.split(/\s+/);
      const targetId = (rawTarget || "").replace(/^@/, "").toLowerCase();
      if (!targetId) {
        return { handled: true, error: "Usage: /ban username [reason]" };
      }
      const reason = reasonParts.join(" ") || "Banned by admin";
      await channel.banUser?.(targetId, { reason });
      await sendAnnouncement(`🔨 **@${targetId}** was banned (${reason}).`);
      return { handled: true };
    }

    if (cmd === "/unban") {
      const targetId = argText.replace(/^@/, "").toLowerCase();
      if (!targetId) return { handled: true, error: "Usage: /unban username" };
      await channel.unbanUser?.(targetId);
      await sendAnnouncement(`✅ **@${targetId}** has been unbanned.`);
      return { handled: true };
    }

    return { handled: false };
  } catch (err: any) {
    return {
      handled: true,
      error: err?.message || `Failed to run ${cmd}`,
    };
  }
}
