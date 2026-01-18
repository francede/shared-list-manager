"use client";

import { AblyProvider } from "ably/react";
import * as Ably from "ably";

export function Providers({ children }: { children: React.ReactNode }) {
const client = new Ably.Realtime({
    authUrl: "/api/ably/token" // pass token endpoint here
  });
  return (
    <AblyProvider client={client}>
      {children}
    </AblyProvider>
  );
}