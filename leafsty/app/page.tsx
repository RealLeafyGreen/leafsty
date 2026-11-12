"use client";

import React, { useEffect, useState } from "react";
import MyChat from "../components/mychat";
const endpoint = "/api/register";


const FEATURES = [
  {
    title: "256-Bit AES-GCM E2EE",
    description:
      "Every message is encrypted inside your browser before leaving your device. Only channel members hold the key.",
  },
  {
    title: "Servers & Direct Messages",
    description:
      "Organize communities into dedicated text channels or start private one-on-one encrypted conversations.",
  },
  {
    title: "Custom Leafsty Profiles",
    description:
      "Personalize your display name, custom status, bio, and verification badges across every server.",
  },
];

function LeafstyLanding({
  onGetStarted,
  onSignIn,
}: {
  onGetStarted: () => void;
  onSignIn: () => void;
}) {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7faf8] text-zinc-900 flex flex-col">
      <header className="w-full border-b border-emerald-100 bg-white/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {!logoError ? (
              <img
                src="/logo-hover.png"
                alt="Leafsty"
                onError={() => setLogoError(true)}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                L
              </div>
            )}
            <span className="text-lg font-extrabold tracking-tight text-emerald-900">
              Leafsty
            </span>
          </div>

          <button
            type="button"
            onClick={onSignIn}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition cursor-pointer"
          >
            Open App
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 flex flex-col justify-center">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
            End-to-End Encrypted Chat
          </span>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 leading-tight mb-4">
            Private, fast messaging built for your communities.
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 leading-relaxed mb-8">
            Create custom servers, organize channels, and send direct messages
            protected by client-side AES-GCM encryption.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onGetStarted}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition cursor-pointer"
            >
              Get Started Free
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className="rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 px-6 py-3 text-sm font-semibold text-emerald-900 transition cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16">
          {FEATURES.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white border border-emerald-100 p-6 shadow-xs"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mb-3" />
              <h3 className="text-base font-bold text-zinc-900 mb-1.5">
                {item.title}
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-emerald-100 bg-white py-5 text-center text-xs text-zinc-500">
        Leafsty &bull; Client-Side Encrypted Messaging
      </footer>
    </div>
  );
}

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

  if (!isReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f7faf8] text-emerald-700 text-sm font-medium">
        Loading Leafsty...
      </div>
    );
  }

  if (isLoggedIn) {
    return <MyChat />;
  }

  if (showLanding) {
    return (
      <LeafstyLanding
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
    <div className="min-h-screen bg-[#f7faf8] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-emerald-100 shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-hover.png"
              alt="Leafsty"
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-extrabold text-emerald-900">
              Leafsty
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowLanding(true)}
            className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
          >
            Back to Home
          </button>
        </div>

        <h1 className="text-2xl font-bold text-zinc-900 mb-1">
          {isRegister ? "Create a Leafsty Account" : "Welcome Back"}
        </h1>
        <p className="text-sm text-zinc-500 mb-6">
          {isRegister
            ? "Sign up to start end-to-end encrypted conversations."
            : "Sign in to access your encrypted servers and messages."}
        </p>

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full rounded-xl bg-sky-50/70 border border-emerald-100 px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

                   <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 py-3 text-sm font-semibold text-white shadow-sm transition cursor-pointer mt-2"
          >
            {loading
              ? isRegister
                ? "Creating Account..."
                : "Signing In..."
              : isRegister
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>


        <p className="mt-6 text-center text-xs text-zinc-500">
          {isRegister ? "Already have an account?" : "Need an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="font-semibold text-emerald-700 hover:underline cursor-pointer"
          >
            {isRegister ? "Sign In" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}
