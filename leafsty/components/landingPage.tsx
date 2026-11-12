"use client";

import React, { useState } from "react";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

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

export default function LandingPage({
  onGetStarted,
  onSignIn,
}: LandingPageProps) {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7faf8] text-zinc-900 flex flex-col">
      {/* Top Navbar */}
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

      {/* Hero Section */}
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

        {/* 3-Column Feature Cards */}
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

      {/* Footer */}
      <footer className="border-t border-emerald-100 bg-white py-5 text-center text-xs text-zinc-500">
        Leafsty &bull; Client-Side Encrypted Messaging
      </footer>
    </div>
  );
}
