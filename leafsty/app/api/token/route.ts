import { NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const apiSecret = process.env.STREAM_API_SECRET!;
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

function signJwt(payloadObj: Record<string, unknown>, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = String(body.userId || "").trim().toLowerCase();
    const userName = String(body.userName || body.username || userId).trim();
    const password = String(body.password || "");

    if (!userId || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (!apiSecret) {
      return NextResponse.json(
        { error: "Server secret is missing from .env.local" },
        { status: 500 }
      );
    }

    const users = readUsers();
    const pwHash = hashPassword(password);

    if (users[userId]) {
      if (users[userId].hash !== pwHash) {
        return NextResponse.json(
          { error: "Incorrect password. Use Settings > My Account to reset if needed." },
          { status: 401 }
        );
      }
    } else {
      // First sign-in claims this username's password
      users[userId] = { hash: pwHash, name: userName };
      writeUsers(users);
    }

    const userToken = signJwt({ user_id: userId }, apiSecret);

    return NextResponse.json({
      userId,
      username: users[userId].name || userName,
      user: { id: userId, name: users[userId].name || userName },
      token: userToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
