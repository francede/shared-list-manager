'use client';

import { ChannelProvider } from "ably/react";
import { createContext, useContext, useEffect, useState } from "react";

const ListContext = createContext<ListContextValue | null>(null)

export function DynamicListChannelProvider(props: DynamicListChannelProviderProps) {
    const [activeListId, setActiveListId] = useState<string | null>(null)

    return (
        <ListContext.Provider value={{setActiveListId}}>
            {activeListId ?
                <ChannelProvider channelName={`list:${activeListId}`}>
                    {props.children}
                </ChannelProvider>
                :
                <>{props.children}</>
            }
        </ListContext.Provider>
    );
}

export type DynamicListChannelProviderProps = {
    children: React.ReactNode
}

interface ListContextValue {
    setActiveListId: (newListId: string) => void
} 

export function useListContext() {
    const context = useContext(ListContext);
    if (!context) {
        throw new Error("useListContext must be used within a DynamicListChannelProvider");
    }
    return context;
}