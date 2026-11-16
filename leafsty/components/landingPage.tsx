"use client";

import React, { useEffect, useState } from "react";
import {
  Lock,
  Unlock,
  Sparkles,
  MessageSquare,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sun,
  Moon,
  RefreshCw,
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const PILLARS = [
  {
    eyebrow: "ZERO-KNOWLEDGE SECURITY",
    title: "Lock down every word. Automatically.",
    description:
      "Every message, DM, and file is encrypted client-side with 256-bit AES-GCM keys before touching the network. Only your room holds the key.",
    badge: "AES-256-GCM Verified",
  },
  {
    eyebrow: "ORGANIZE & COORDINATE",
    title: "Structured servers that move at your speed.",
    description:
      "Spin up dedicated servers, switch effortlessly between channels and direct messages, and see live member rosters at a glance.",
    badge: "Multi-Server & DMs",
  },
  {
    eyebrow: "BUILD CULTURE",
    title: "Expressive chat that feels alive.",
    description:
      "Send Klipy GIFs, upload media, customize your profile banner and bio, or right-click any friend to drop an instant Leaf Poke.",
    badge: "Custom Profiles & Actions",
  },
];

export default function LandingPage({
  onGetStarted,
  onSignIn,
}: LandingPageProps) {
  const [isDark, setIsDark] = useState(true);
  const [logoError, setLogoError] = useState(false);

  const [demoPlaintext, setDemoPlaintext] = useState("Meet at the rooftop at 8pm!");
  const [demoCiphertext, setDemoCiphertext] = useState("");
  const [demoIv, setDemoIv] = useState("");
  const [showDecrypted, setShowDecrypted] = useState(false);
  const [keySeed, setKeySeed] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const encryptLive = async () => {
      try {
        const text = demoPlaintext || " ";
        if (typeof window === "undefined" || !window.crypto?.subtle) {
          setDemoCiphertext(btoa(unescape(encodeURIComponent(text))));
          setDemoIv("demo-iv-256");
          return;
        }

        const key = await window.crypto.subtle.generateKey(
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt"]
        );
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(text);
        const encrypted = await window.crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          key,
          encoded
        );

        if (cancelled) return;

        const cipherB64 = btoa(
          String.fromCharCode(...new Uint8Array(encrypted))
        );
        const ivHex = Array.from(iv)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        setDemoCiphertext(cipherB64);
        setDemoIv(ivHex);
      } catch {
        if (!cancelled) {
          setDemoCiphertext("AES256_ENCRYPTED_PAYLOAD==");
        }
      }
    };

    encryptLive();
    return () => {
      cancelled = true;
    };
  }, [demoPlaintext, keySeed]);

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 overflow-x-hidden ${
        isDark
          ? "bg-[#07110d] text-zinc-100 selection:bg-emerald-500 selection:text-zinc-950"
          : "bg-[#f6faf8] text-zinc-900 selection:bg-emerald-600 selection:text-white"
      }`}
    >
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${
          isDark
            ? "border-emerald-500/15 bg-[#07110d]/85"
            : "border-emerald-200/80 bg-white/90"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!logoError ? (
              <img
                src="/logo-hover.png"
                alt="Leafsty"
                onError={() => setLogoError(true)}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-zinc-950 font-black flex items-center justify-center text-sm">
                L
              </div>
            )}
            <span
              className={`text-lg font-black tracking-tight ${
                isDark ? "text-white" : "text-emerald-950"
              }`}
            >
              Leafsty
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark
                  ? "bg-white/5 border-white/10 text-emerald-300 hover:bg-white/10"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onSignIn}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                isDark
                  ? "text-zinc-300 hover:text-white hover:bg-white/5"
                  : "text-emerald-900 hover:bg-emerald-50"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-extrabold text-zinc-950 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              Open Leafsty
            </button>
          </div>
        </div>
      </header>
      <main className="relative z-10 flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 lg:pt-24 lg:pb-16 text-center">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold tracking-wide mb-6 ${
              isDark
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                : "bg-emerald-100/80 border-emerald-300/70 text-emerald-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>END-TO-END ENCRYPTED &bull; BUILT FOR PRIVATE COMMUNITIES</span>
          </div>

          <h1
            className={`text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6 ${
              isDark ? "text-white" : "text-zinc-950"
            }`}
          >
            Connect.{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 bg-clip-text text-transparent">
              Encrypt.
            </span>{" "}
            Belong.
          </h1>

          <p
            className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-9 ${
              isDark ? "text-zinc-400" : "text-zinc-600"
            }`}
          >
            Real-time servers, instant direct messages, and client-side
            256-bit AES-GCM encryption—built for communities that want speed
            without surrendering their conversations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-7 py-3.5 text-sm font-extrabold text-zinc-950 shadow-xl shadow-emerald-500/25 transition cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className={`rounded-2xl border px-7 py-3.5 text-sm font-bold transition cursor-pointer ${
                isDark
                  ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                  : "bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-950 shadow-xs"
              }`}
            >
              Sign In to Workspace
            </button>
          </div>
        </section>
        <section id="live-crypto" className="max-w-6xl mx-auto px-6 py-10">
          <div
            className={`rounded-3xl border p-7 sm:p-10 transition-colors ${
              isDark
                ? "border-emerald-500/25 bg-gradient-to-br from-[#0b221a] via-[#0c1d17] to-[#08130f]"
                : "border-emerald-200 bg-white shadow-lg shadow-emerald-950/5"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-500 mb-2">
                  <Lock className="w-4 h-4" />
                  <span>Interactive Live Encryption Sandbox</span>
                </div>
                <h2
                  className={`text-2xl sm:text-4xl font-black tracking-tight ${
                    isDark ? "text-white" : "text-zinc-950"
                  }`}
                >
                  Type a message. Watch it lock in real time.
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setKeySeed((k) => k + 1)}
                className={`inline-flex items-center gap-2 self-start lg:self-auto rounded-xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                  isDark
                    ? "bg-white/5 hover:bg-white/10 border-white/10 text-emerald-300"
                    : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900"
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rotate 256-Bit Key</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <div
                className={`rounded-2xl border p-5 flex flex-col justify-between ${
                  isDark
                    ? "bg-black/35 border-white/10"
                    : "bg-[#f6faf8] border-emerald-200/80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-500">
                      1. Your Browser (Plaintext)
                    </span>
                    <span
                      className={`text-[11px] font-mono ${
                        isDark ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      WebCrypto SubtleCrypto
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={demoPlaintext}
                    onChange={(e) => {
                      setDemoPlaintext(e.target.value);
                      setShowDecrypted(false);
                    }}
                    placeholder="Type anything to encrypt it live..."
                    className={`w-full rounded-xl border p-3 text-sm font-medium focus:outline-none focus:border-emerald-500 transition ${
                      isDark
                        ? "bg-[#07110d] border-emerald-500/20 text-white placeholder:text-zinc-500"
                        : "bg-white border-emerald-200 text-zinc-900 placeholder:text-zinc-400"
                    }`}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px]">
                  <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>
                    IV Vector:{" "}
                    <code className="font-mono text-emerald-500">
                      {demoIv.slice(0, 16)}...
                    </code>
                  </span>
                  <span className="font-bold text-emerald-500">
                    AES-256-GCM
                  </span>
                </div>
              </div>

              <div
                className={`rounded-2xl border p-5 flex flex-col justify-between ${
                  isDark
                    ? "bg-black/50 border-emerald-500/20"
                    : "bg-zinc-900 text-zinc-100 border-zinc-800"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                      2. What the Server Sees (Ciphertext)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDecrypted((s) => !s)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] font-bold transition cursor-pointer"
                    >
                      {showDecrypted ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Show Ciphertext</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3" />
                          <span>Preview Recipient Decrypt</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-xl bg-black/60 border border-emerald-500/20 p-3.5 font-mono text-xs break-all min-h-[84px] flex items-center text-emerald-300">
                    {showDecrypted
                      ? demoPlaintext || "(empty message)"
                      : demoCiphertext || "Generating ciphertext..."}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Zero plaintext stored on relay servers</span>
                  <span className="text-emerald-400 font-bold">
                    {showDecrypted ? "Unlocked with Room Key" : "Locked in Transit"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          id="features"
          className={`max-w-6xl mx-auto px-6 py-16 border-t ${
            isDark ? "border-white/10" : "border-emerald-200/70"
          }`}
        >
          <div className="max-w-2xl mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-500">
              Built for Modern Communities
            </span>
            <h2
              className={`text-3xl sm:text-5xl font-black tracking-tight mt-2 ${
                isDark ? "text-white" : "text-zinc-950"
              }`}
            >
              Real tools for real conversations.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {PILLARS.map((pillar, idx) => (
              <div
                key={pillar.title}
                className={`rounded-3xl border p-7 flex flex-col justify-between transition ${
                  isDark
                    ? "border-white/10 bg-[#0b1914] hover:border-emerald-500/40"
                    : "border-emerald-200/80 bg-white hover:border-emerald-400 shadow-xs"
                }`}
              >
                <div>
                  <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 mb-3">
                    0{idx + 1} &bull; {pillar.eyebrow}
                  </span>
                  <h3
                    className={`text-2xl font-black leading-snug mb-3 ${
                      isDark ? "text-white" : "text-zinc-950"
                    }`}
                  >
                    {pillar.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed mb-6 ${
                      isDark ? "text-zinc-400" : "text-zinc-600"
                    }`}
                  >
                    {pillar.description}
                  </p>
                </div>

                <div
                  className={`pt-4 border-t flex items-center justify-between text-xs font-bold ${
                    isDark
                      ? "border-white/10 text-emerald-300"
                      : "border-emerald-100 text-emerald-700"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {pillar.badge}
                  </span>
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="community"
          className="max-w-4xl mx-auto px-6 py-20 text-center"
        >
          <MessageSquare className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
          <h2
            className={`text-3xl sm:text-5xl font-black tracking-tight mb-4 ${
              isDark ? "text-white" : "text-zinc-950"
            }`}
          >
            Your conversations belong to you—and nobody else.
          </h2>
          <p
            className={`text-sm sm:text-base max-w-xl mx-auto mb-8 ${
              isDark ? "text-zinc-400" : "text-zinc-600"
            }`}
          >
            Create your free Leafsty account in seconds—no phone number, no
            bloat, just instant encrypted rooms.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-8 py-4 text-sm font-extrabold text-zinc-950 shadow-xl shadow-emerald-500/25 transition cursor-pointer"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className={`rounded-2xl border px-8 py-4 text-sm font-bold transition cursor-pointer ${
                isDark
                  ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                  : "bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-950"
              }`}
            >
              Sign In
            </button>
          </div>
        </section>
      </main>

      <footer
        className={`relative z-10 border-t py-8 px-6 ${
          isDark
            ? "border-white/10 bg-[#050d0a] text-zinc-500"
            : "border-emerald-200/70 bg-white text-zinc-500"
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div
            className={`flex items-center gap-2 font-bold ${
              isDark ? "text-zinc-300" : "text-zinc-800"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Leafsty &bull; Client-Side Encrypted Messaging</span>
          </div>
          <div>&copy; {new Date().getFullYear()} Leafsty. Built for privacy.</div>
        </div>
      </footer>
    </div>
  );
}
