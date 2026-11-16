"use client";

import React, { useEffect, useState } from "react";
import MyChat from "../components/mychat";
import LeafstyLoader from "../components/LeafstyLoader";
import LandingPage from "../components/landingPage";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function HomePage() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("stream_user");
    const savedToken = localStorage.getItem("stream_token");
    if (savedUser && savedToken) {
      setHasSavedSession(true);
    }
    setIsReady(true);
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;

    try {
      setLoading(true);
      setError("");

      const userId = trimmed.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      const endpoint = isRegister ? "/api/register" : "/api/token";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          username: trimmed,
          password,
        }),
      });

      const rawText = await res.text();
      let data: any = {};

      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          `API Error (${res.status}): Server returned HTML instead of JSON. Check your Terminal.`
        );
      }

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      const userObj = {
        id: data.userId || userId,
        name: data.username || trimmed,
      };

      localStorage.setItem("stream_user", JSON.stringify(userObj));
      localStorage.setItem("stream_token", data.token);
      setIsLoggedIn(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  if (!isReady || loading) {
    return (
      <LeafstyLoader
        src="/loadingLeafsty.mp4"
        label={loading ? "Signing into Leafsty..." : "Loading Leafsty..."}
      />
    );
  }

  if (isLoggedIn) {
    return <MyChat />;
  }

  if (showLanding) {
    return (
      <LandingPage
        onGetStarted={() => {
          if (hasSavedSession) {
            setIsLoggedIn(true);
          } else {
            setIsRegister(true);
            setShowLanding(false);
          }
        }}
        onSignIn={() => {
          if (hasSavedSession) {
            setIsLoggedIn(true);
          } else {
            setIsRegister(false);
            setShowLanding(false);
          }
        }}
      />
    );
  }
  return (
    <div className="min-h-screen bg-[#07110d] text-zinc-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[360px] rounded-full bg-emerald-500/15 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#0b1914]/90 backdrop-blur-xl border border-emerald-500/20 shadow-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-hover.png"
              alt="Leafsty"
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-black text-white">Leafsty</span>
          </div>

          <button
            type="button"
            onClick={() => setShowLanding(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        </div>

        <h1 className="text-2xl font-black text-white mb-1">
          {isRegister ? "Create your workspace" : "Welcome back"}
        </h1>
        <p className="text-xs text-zinc-400 mb-6 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Client-side 256-bit AES-GCM encrypted session</span>
        </p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-3.5 py-2.5 text-xs font-semibold text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. leafygreen"
              required
              autoFocus
              className="w-full rounded-xl bg-black/40 border border-emerald-500/20 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              required
              className="w-full rounded-xl bg-black/40 border border-emerald-500/20 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 py-3 text-sm font-extrabold text-zinc-950 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            {isRegister ? "Create Free Account" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-zinc-400">
          {isRegister ? "Already have an account?" : "New to Leafsty?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsRegister((r) => !r);
              setError("");
            }}
            className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
          >
            {isRegister ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
