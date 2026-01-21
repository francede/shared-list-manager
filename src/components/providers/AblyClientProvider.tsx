'use client';

import { AblyProvider } from "ably/react";
import * as Ably from "ably";
import { useEffect, useState } from "react";

export function AblyClientProvider({ children }: { children: React.ReactNode }) {
    const [client, setClient] = useState<Ably.Realtime | null>();

    useEffect(() => {
      setClient( new Ably.Realtime({
        authUrl: `${window.location.origin}/api/auth/token` // pass token endpoint here
      }))
    }, [])

    if(!client){
      return null
    }
    
    return (
      <AblyProvider client={client}>
        {children}
      </AblyProvider>
    );
  }
