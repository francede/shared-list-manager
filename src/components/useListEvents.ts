"use client";

import { useChannel } from "ably/react";

export function useListEvents(listId: string, onMessage: (data: any) => {}) {
  useChannel(`list:${listId}`, (message) => {
    onMessage(message.data);
  });
}