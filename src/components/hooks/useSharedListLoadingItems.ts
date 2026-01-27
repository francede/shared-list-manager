"use client";

import { SharedListItem } from "@/app/api/services/sharedListRepository";
import { useEffect, useMemo, useRef, useState } from "react";
import { ItemSpinnerState } from "../itemSpinner";

const LOADED_DURATION = 1500;

export function useSharedListWithLoadingStatus(listItems: SharedListItem[], loadingItemIds: string[]) {

    const fulfilledAtRef = useRef<Map<String, number>>(new Map());
    const previousLoadingItemIds = useRef<string[]>([]);
    const [, setTick] = useState(true);

    useEffect(() => {
    const interval = setInterval(() => {
      setTick(x => !x);
    }, 500);

    return () => clearInterval(interval);
  }, []);

    useEffect(() => {
        const prev = previousLoadingItemIds.current

        for(const prevId of prev){
            if(!loadingItemIds.includes(prevId)){
                fulfilledAtRef.current.set(prevId, Date.now())
            }
        }
        previousLoadingItemIds.current = [...loadingItemIds]
    }, [loadingItemIds])

    const itemsWithLoadingStatus: SharedListItemWithLoadingStatus[] = useMemo(() => {
        const now = Date.now();

        return listItems.map(item => {
            if (loadingItemIds.includes(item._id)) {
                return { ...item, status: "loading" };
            }

            const fulfilledAt = fulfilledAtRef.current.get(item._id);
            if (fulfilledAt !== undefined) {
                if(now - fulfilledAt < LOADED_DURATION){
                    return { ...item, status: "loaded" };
                }
            }

            return { ...item, status: "none" };
        });
    }, [listItems, loadingItemIds]);

    return itemsWithLoadingStatus
}

export type SharedListItemWithLoadingStatus = SharedListItem & {
    status: ItemSpinnerState
}
