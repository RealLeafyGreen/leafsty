import { NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const USERS_FILE = path.join(process.cwd(), ".leafsty-users.json");

function readUsers(): Record<string, { hash: string; name: string }> {
  try {
    if (!fs.existsSync(USERS_FILE)) return {};
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, { hash: string; name: string }>) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

function hashPassword(pw: string): string {
  return crypto.createHash("sha256").update(pw).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json();
    const cleanId = String(userId || "").trim().toLowerCase();

    if (!cleanId || !newPassword || String(newPassword).trim().length < 4) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters" },
        { status: 400 }
      );
    }

    const users = readUsers();
    users[cleanId] = {
      hash: hashPassword(String(newPassword).trim()),
      name: users[cleanId]?.name || cleanId,
    };
    writeUsers(users);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}
