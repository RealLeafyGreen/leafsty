"use client";

import { useEffect } from "react";

export default function GoogleCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (window.opener) {
      window.opener.postMessage(
        { type: "leafsty-google-oauth", code, error },
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
