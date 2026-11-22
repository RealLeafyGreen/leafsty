"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Chat, useCreateChatClient } from "stream-chat-react";
import MyChat from "../components/mychat";
import LandingPage from "../components/landingPage";
import { DiscordContextProvider } from "../types/DiscordContext";
import { Lock, Eye, EyeOff, ArrowRight, RotateCcw } from "lucide-react";

interface SavedUser {
  id: string;
  name: string;
  image?: string;
}

function LeafstyEyesLoader({
  label = "Connecting to Leafsty...",
  error,
  onRetry,
  onLogout,
}: {
  label?: string;
  error?: string | null;
  onRetry?: () => void;
  onLogout?: () => void;
}) {
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStalled(true), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#071410] text-emerald-50 select-none px-4">
      <div className="relative w-24 h-24 rounded-3xl bg-[#0b211a] border border-emerald-400/35 shadow-2xl shadow-emerald-950/90 flex items-center justify-center gap-3 mb-6">
        <span className="absolute -inset-1 rounded-3xl border border-emerald-400/20 animate-ping pointer-events-none" />
        <div className="w-6 h-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shadow-inner">
          <div className="w-3 h-4 rounded-full bg-[#04120e] animate-bounce" />
        </div>
        <div className="w-6 h-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shadow-inner">
          <div className="w-3 h-4 rounded-full bg-[#04120e] animate-bounce [animation-delay:150ms]" />
        </div>
      </div>

      <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-emerald-50 text-center">
        {label}
      </h1>

      <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-400/85">
        <Lock className="w-3.5 h-3.5" />
        <span>End-to-End Encrypted Workspace</span>
      </div>

      {error && (
        <div className="mt-4 max-w-sm px-3.5 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-200 text-center">
          {error}
        </div>
      )}

      {(stalled || error) && (
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => (onRetry ? onRetry() : window.location.reload())}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 rounded-xl bg-[#0d261e] hover:bg-red-500/20 border border-emerald-500/25 text-emerald-200 hover:text-red-200 font-bold text-xs transition cursor-pointer"
            >
              Sign Out
            </button>
          )}
        </div>
      )}
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
  const [connectError, setConnectError] = useState<string | null>(null);

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
      const data = await postRes.json().catch(() => ({}));
      if (data?.token) return data.token;
    }

    const getRes = await fetch(`/api/token?userId=${uid}`);
    const getData = await getRes.json().catch(() => ({}));
    if (!getRes.ok || !getData?.token) {
      const msg =
        getData?.error ||
        `Token error (${postRes.status}/${getRes.status}) — check STREAM_API_SECRET in Vercel`;
      setConnectError(msg);
      throw new Error(msg);
    }
    return getData.token;
  }, [currentUser.id, currentUser.name]);

  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    userData,
  });

  if (!apiKey) {
    return (
      <LeafstyEyesLoader
        label="Missing Stream API Key"
        error="NEXT_PUBLIC_STREAM_API_KEY is not set in Vercel Production environment variables."
        onLogout={onLogout}
      />
    );
  }

  if (!client) {
    return (
      <LeafstyEyesLoader
        label={`Waking up Leafsty for ${currentUser.name || currentUser.id}...`}
        error={connectError}
        onLogout={onLogout}
      />
    );
  }

  return (
    <Chat client={client} theme="str-chat__theme-dark">
      <DiscordContextProvider>
        <MyChat />
      </DiscordContextProvider>
    </Chat>
  );
}

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<SavedUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("leafsty_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.id) {
          setCurrentUser({
            id: String(parsed.id),
            name: String(parsed.name || parsed.id),
            image: parsed.image,
          });
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("leafsty_user");
    } catch {}
    setCurrentUser(null);
    setShowAuth(false);
    setPassword("");
    setAuthError(null);
  }, []);
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");

    if (!cleanId) {
      setAuthError("Enter a valid username (letters, numbers, _ or -).");
      return;
    }
    if (!password.trim()) {
      setAuthError("Enter your password.");
      return;
    }

    try {
      setSubmitting(true);
      setAuthError(null);

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          username: cleanId,
          name: username.trim() || cleanId,
          password: password.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Authentication failed");
      }

      const userObj: SavedUser = {
        id: String(data?.user?.id || cleanId),
        name: String(data?.user?.name || username.trim() || cleanId),
        image: data?.user?.image,
      };

      localStorage.setItem("leafsty_user", JSON.stringify(userObj));
      setCurrentUser(userObj);
    } catch (err: any) {
      setAuthError(err?.message || "Could not sign in");
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return <LeafstyEyesLoader label="Loading Leafsty..." />;
  }

  if (currentUser) {
    return (
      <ConnectedWorkspace currentUser={currentUser} onLogout={handleLogout} />
    );
  }

  if (!showAuth) {
    const LandingAny = LandingPage as any;
    return (
      <LandingAny
        onGetStarted={() => setShowAuth(true)}
        onSignIn={() => setShowAuth(true)}
        onEnter={() => setShowAuth(true)}
        onStart={() => setShowAuth(true)}
        onLogin={() => setShowAuth(true)}
      />
    );
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#071410] text-emerald-50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#081914] border border-emerald-500/25 p-7 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center shadow-lg">
              L
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-emerald-50">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-xs text-emerald-300/70 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>End-to-End Encrypted Leafsty</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAuth(false)}
            className="text-xs font-bold text-emerald-300/70 hover:text-emerald-100 cursor-pointer"
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300/75 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. leafygreen"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300/75 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-sm text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300/60 hover:text-emerald-100 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {authError && (
            <div className="px-3.5 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300">
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>
              {submitting
                ? "Connecting..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-emerald-500/15 text-center text-xs text-emerald-300/75">
          {mode === "login" ? (
            <>
              New to Leafsty?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setAuthError(null);
                }}
                className="font-bold text-emerald-300 hover:underline cursor-pointer"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setAuthError(null);
                }}
                className="font-bold text-emerald-300 hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
