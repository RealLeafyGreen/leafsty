"use client";

import React, { useState } from "react";

export default function RegisterPage() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userName.trim() || !password.trim()) {
      setError("Please enter both a username and a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const userId = userName.trim().toLowerCase().replace(/\s+/g, "-");

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userName: userName.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong during registration.");
        setLoading(false);
        return;
      }

      localStorage.setItem("stream_user", JSON.stringify(data.user));
      localStorage.setItem("stream_token", data.token);

      window.location.href = "/";
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#313338] text-white">
      <div className="w-full max-w-md rounded-lg bg-[#2b2d31] p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-2">Create an Account</h1>
        <p className="text-sm text-zinc-400 text-center mb-6">
          Set up your username and password to join
        </p>

        {error && (
          <div className="mb-4 rounded bg-red-500/20 border border-red-500 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-300 mb-2">
              Username <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter a display name"
              className="w-full rounded bg-[#1e1f22] p-2.5 text-white outline-none focus:ring-2 focus:ring-[#5865F2]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-300 mb-2">
              Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a password (min. 6 characters)"
              className="w-full rounded bg-[#1e1f22] p-2.5 text-white outline-none focus:ring-2 focus:ring-[#5865F2]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded bg-[#5865F2] py-2.5 font-semibold text-white hover:bg-[#4752c4] transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Creating Account..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
