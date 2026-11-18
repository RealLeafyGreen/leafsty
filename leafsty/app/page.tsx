"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Chat, useCreateChatClient } from "stream-chat-react";
import MyChat from "../components/mychat";
import { DiscordContextProvider } from "../types/DiscordContext";
import { Lock, Eye, EyeOff, ArrowRight, RotateCcw } from "lucide-react";

interface SavedUser {
  id: string;
  name: string;
  image?: string;
}

function LeafstyEyesLoader({ label = "Connecting to Leafsty..." }: { label?: string }) {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#071410] text-emerald-50 select-none">
      <div className="w-44 h-44 rounded-3xl bg-[#0b211a] border border-emerald-500/25 overflow-hidden flex items-center justify-center shadow-2xl mb-4">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
        >
          <source src="/loadingleafsty.mp4" type="video/mp4" />
        </video>
      </div>
      <p className="text-sm font-extrabold tracking-wide text-emerald-100">
        {label}
      </p>
      <p className="text-xs text-emerald-400/70 mt-1 flex items-center gap-1">
        <Lock className="w-3 h-3" /> End-to-End Encrypted Workspace
      </p>
    </div>
  );
}


function ConnectedWorkspace({
  currentUser,
  onLogout,
}: {
  currentUser: SavedUser;
  onLogout: () => void;
}) {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || "";

  const userData = useMemo(
    () => ({
      id: currentUser.id,
      name: currentUser.name || currentUser.id,
      image: currentUser.image,
    }),
    [currentUser.id, currentUser.name, currentUser.image]
  );
const tokenProvider = useCallback(async () => {
  const uid = encodeURIComponent(currentUser.id);
  const postRes = await fetch("/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: currentUser.id,
      name: currentUser.name || currentUser.id,
    }),
  });
  if (postRes.ok) {
    const data = await postRes.json();
    if (data?.token) return data.token;
  }

  const getRes = await fetch(`/api/token?userId=${uid}`);
  if (getRes.ok) {
    const data = await getRes.json();
    if (data?.token) return data.token;
  }

  throw new Error(`Token request failed (${postRes.status} / ${getRes.status})`);
}, [currentUser.id, currentUser.name]);


  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    userData,
  });

  if (!apiKey) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#071410] text-emerald-100 p-6">
        <div className="px-5 py-4 rounded-2xl bg-[#0b211a] border border-red-500/40 text-sm">
          Missing <code className="text-emerald-300">NEXT_PUBLIC_STREAM_API_KEY</code> in Vercel Environment Variables.
        </div>
      </div>
    );
  }

  if (!client) {
    return <LeafstyEyesLoader label={`Waking up Leafsty for ${currentUser.name}...`} />;
  }

  return (
    <Chat client={client}>
      <DiscordContextProvider>
        <MyChat />
      </DiscordContextProvider>
    </Chat>
  );
}
export default function HomePage() {
  const [savedUser, setSavedUser] = useState<SavedUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("leafsty_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.id) {
          setSavedUser({
            id: String(parsed.id),
            name: parsed.name || String(parsed.id),
            image: parsed.image,
          });
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanId = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleanId || password.trim().length < 4) {
      setErrorMsg("Enter a valid username and at least 4 characters for password.");
      return;
    }

    try {
      setSubmitting(true);

      if (mode === "reset") {
        const res = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: cleanId,
            newPassword: password.trim(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Could not reset password");
        }
        setSuccessMsg("Password updated! You can now sign in.");
        setMode("login");
        return;
      }

            const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanId,
          userId: cleanId,
          name: username.trim(),
          password: password.trim(),
          mode,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Authentication failed");
      }

      const nextUser: SavedUser = {
        id: cleanId,
        name: data?.user?.name || username.trim(),
        image: data?.user?.image,
      };
      localStorage.setItem("leafsty_user", JSON.stringify(nextUser));
      setSavedUser(nextUser);
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("leafsty_user");
    setSavedUser(null);
  };

  if (!hydrated) {
    return <LeafstyEyesLoader label="Loading Leafsty..." />;
  }

  if (savedUser) {
    return <ConnectedWorkspace currentUser={savedUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#071410] text-emerald-50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#081914] border border-emerald-500/20 p-7 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center shadow-lg">
            L
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-emerald-50">Leafsty</h1>
            <p className="text-xs text-emerald-300/70 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" /> Encrypted Workspace
            </p>
          </div>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300/80 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. leafygreen"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300/80 mb-1.5">
              {mode === "reset" ? "New Password" : "Password"}
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300/60 hover:text-emerald-100"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="px-3.5 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>
              {submitting
                ? "Please wait..."
                : mode === "login"
                ? "Sign in to workspace"
                : mode === "register"
                ? "Create encrypted account"
                : "Reset password"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-emerald-500/15 flex items-center justify-between text-xs text-emerald-300/75">
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setSuccessMsg(null);
              setMode(mode === "login" ? "register" : "login");
            }}
            className="hover:text-emerald-100 underline cursor-pointer"
          >
            {mode === "login" ? "Create an account" : "Back to sign in"}
          </button>

          {mode !== "reset" && (
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setMode("reset");
              }}
              className="inline-flex items-center gap-1 hover:text-emerald-100 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Forgot password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
