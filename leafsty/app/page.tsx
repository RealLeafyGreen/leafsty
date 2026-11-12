"use client";

import React, { useState, useEffect } from "react";
import MyChat from "../components/mychat";
import RegisterPage from "./register/page";

export default function Home() {
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("stream_user");
    const savedToken = localStorage.getItem("stream_token");
    setIsRegistered(Boolean(savedUser && savedToken));
  }, []);

  if (isRegistered === null) {
    return null;
  }

  return isRegistered ? <MyChat /> : <RegisterPage />;
}
