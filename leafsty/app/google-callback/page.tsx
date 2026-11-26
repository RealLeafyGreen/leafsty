"use client";

import { useEffect } from "react";

export default function GoogleCallbackPage() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    const error = hash.get("error");

    if (window.opener) {
      window.opener.postMessage(
        { type: "leafsty-google-oauth", accessToken, error },
        window.location.origin
      );
      window.close();
    }
  }, []);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#071410] text-emerald-100 text-sm font-bold">
      Completing Google Sign-In...
    </div>
  );
}
