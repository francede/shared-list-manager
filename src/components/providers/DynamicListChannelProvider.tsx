'use client';

import { ChannelProvider } from "ably/react";

export function DynamicListChannelProvider(props: DynamicListChannelProviderProps) {
    return (
        <ChannelProvider channelName={`list:${props.listId}`}>
            {props.children}
        </ChannelProvider>
    );
}

export type DynamicListChannelProviderProps = {
    children: React.ReactNode
    listId: string
}