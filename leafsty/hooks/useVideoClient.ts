"use client";

import { useEffect, useState } from "react";
import { StreamVideoClient, User } from "@stream-io/video-client";

export interface UseClientOptions {
  apiKey: string;
  user: User;
  tokenOrProvider: string | (() => Promise<string>);
}

export const useVideoClient = ({
  apiKey,
  user,
  tokenOrProvider,
}: UseClientOptions): StreamVideoClient | undefined => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();

  useEffect(() => {
    if (!apiKey || !user?.id || !tokenOrProvider) return;

    const client = new StreamVideoClient({ apiKey });
    let didUserConnectInterrupt = false;

    const connectionPromise = client
      .connectUser(user, tokenOrProvider)
      .then(() => {
        if (!didUserConnectInterrupt) {
          setVideoClient(client);
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to connect StreamVideoClient:", err);
      });

    return () => {
      didUserConnectInterrupt = true;
      setVideoClient(undefined);
      connectionPromise
        .then(() => client.disconnectUser())
        .catch(() => {});
    };
  }, [apiKey, user?.id, tokenOrProvider]);

  return videoClient;
};
