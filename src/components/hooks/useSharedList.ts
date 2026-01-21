"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AddItemEvent, CheckItemEvent, ClearCheckedEvent, DeleteItemEvent, EditItemEvent, MoveItemEvent, SharedList, SharedListItem } from "@/app/api/services/sharedListRepository";
import { useChannel } from "ably/react";
import { Message } from "ably";
import { AddItemRequestBody } from "@/app/api/list/[id]/add/route";
import { MoveItemRequestBody } from "@/app/api/list/[id]/move/route";
import { CheckItemRequestBody } from "@/app/api/list/[id]/check/route";
import { DeletItemRequestBody } from "@/app/api/list/[id]/delete/route";
import { EditItemRequestBody } from "@/app/api/list/[id]/edit/route";
import { randomUUID } from "crypto";
import { ClearCheckedRequestBody } from "@/app/api/list/[id]/clear/route";
import sharedListUtils from "@/utils/sharedListUtils";


export function useSharedList(listId: string) {

    const [list, setList] = useState<SharedList | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pendingOperations, setPendingOperations] = useState<{opId: string, position?: number}[]>([])

    const sortedList = useMemo(() => {
        if(!list) return list

        return {
            ...list,
            items: list.items?.toSorted((a,b) => a.position - b.position)
        }
    }, [list])

    useChannel(`list:${listId}`, (message) => {
        handleMessage(message)
    });

    useEffect(() => {
        getList();
       
    }, [listId]);

    function handleMessage(message: Message){
        console.log("MESSAGE INBOUND (%s) --- V: %d", message.name, message.data.version)
        if(list?.version && list?.version >= message.data?.version){
            return; //ignore if incoming version is outdated
        }

        if(!list?.version || list.version + 1 !== message.data?.version){
            getList()
            return
        }

        if(message.name === "ADD"){
            const data = message.data as AddItemEvent
            const newItems = list.items?.filter(i => i.opId !== data.opId)
            setPendingOperations(pendingOperations.filter(po => po.opId !== data.opId))

            newItems?.push({
                _id: data.item.id,
                text: data.item.text,
                position: data.item.position,
                checked: data.item.checked
            })
            
            setList({
                ...list,
                version: data.version,
                items: newItems
            })
        }

        if(message.name === "CHECK"){
            const data = message.data as CheckItemEvent

            if(pendingOperations.find(po => po.opId === data.opId)){
                setPendingOperations(pendingOperations.filter(po => po.opId !== data.opId))
                return
            }

            const newItems = list.items?.map(i => i._id === data.itemId ? {...i, checked: true} : i)
            setList({
                ...list,
                items: newItems,
                version: data.version
            })
        }

        if(message.name === "DELETE"){
            const data = message.data as DeleteItemEvent

            if(pendingOperations.find(po => po.opId === data.opId)){
                setPendingOperations(pendingOperations.filter(po => po.opId !== data.opId))
                return
            }

            const newItems = list.items?.filter(i => i._id !== data.itemId)
            setList({
                ...list,
                items: newItems,
                version: data.version
            })
        }
        

        if(message.name === "MOVE"){
            const data = message.data as MoveItemEvent

            if(pendingOperations.find(po => po.opId === data.opId)){
                setPendingOperations(pendingOperations.filter(po => po.opId !== data.opId))
                return
            }

            const newItems = list.items?.map(i => i._id === data.itemId ? {...i, position: data.position} : i)
            setList({
                ...list,
                items: newItems,
                version: data.version
            })
        }

        if(message.name === "EDIT"){
            const data = message.data as EditItemEvent

            if(pendingOperations.find(po => po.opId === data.opId)){
                setPendingOperations(pendingOperations.filter(po => po.opId !== data.opId))
                return
            }

            const newItems = list.items?.map(i => i._id === data.itemId ? {...i, text: data.text} : i)
            setList({
                ...list,
                items: newItems,
                version: data.version
            })
        }

        if(message.name === "CLEAR"){
            const data = message.data as ClearCheckedEvent

            if(pendingOperations.find(po => po.opId === data.opId)){
                setPendingOperations(pendingOperations.filter(po => po.opId !== data.opId))
                return
            }

            const newItems = list?.items?.filter(i => !i.checked)

            setList({
                ...list,
                items: newItems,
                version: data.version
            })
        }
    }

    async function getList(){
        try {
        setLoading(true);
        const res = await fetch(`/api/list/${listId}`);
        if (!res.ok) throw new Error("Failed to load list");

        const data = await res.json();
        setList(data)
        } catch (e) {
            setError("Failed to load list");
        }
    }

    const addItem = useCallback(async (text: string) => {
        const opId = getOpId()
        const itemPosition = list?.items?.reduce((max, current) => Math.max(max, current.position), 0) ?? 0 + 100
        const newItems = list?.items?.concat({
            _id: "temp:"+opId,
            text,
            position: itemPosition,
            checked: false,
            opId: opId
        })

        setList({
            ...list,
            items: newItems
        })

        setPendingOperations(pendingOperations.concat({opId, position: itemPosition}))

        const body: AddItemRequestBody = {
            text,
            opId
        }
        await fetch(`/api/list/${listId}/add`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
        });
    }, [listId]);

    const moveItem = useCallback(async (itemId: string, itemIdBefore?: string, itemIdAfter?: string) => {
        const itemAfter = list?.items?.find(e => e._id === itemIdAfter)
        const itemBefore = list?.items?.find(e => e._id === itemIdBefore)

        const newPosition = sharedListUtils.calculatePosition(itemBefore, itemAfter);
        const opId = getOpId()
        
        const item = list?.items?.find(e => e._id === itemId)
        if(!item || item.opId){
            throw("Item not found or not persisted")
        }

        const newItems = list?.items?.map(i => i._id === itemId ? {...i, position: newPosition} : i)
        setList({
            ...list,
            items: newItems
        })

        setPendingOperations(pendingOperations.concat({opId, position: newPosition}))

        const body: MoveItemRequestBody = {
            itemID: itemId,
            itemIDBefore: itemIdBefore,
            itemIDAfter: itemIdAfter,
            opId
        }
        await fetch(`/api/list/${listId}/move`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
        });
    }, [listId]);

    const checkItem = useCallback(async (itemId: string) => {
        const opId = getOpId()
        const item = list?.items?.find(e => e._id === itemId)
        if(!item || item.opId){
            throw("Item not found or not persisted")
        }

        const newItems = list?.items?.map(i => i._id === itemId ? {...i, checked: true} : i)
        setList({
            ...list,
            items: newItems
        })

        setPendingOperations(pendingOperations.concat({opId, position: item.position}))

        const body: CheckItemRequestBody = {
            itemID: itemId,
            opId
        }
        await fetch(`/api/list/${listId}/check`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
        });
    }, [listId]);

    const deleteItem = useCallback(async (itemId: string) => {
        const opId = getOpId()
        const item = list?.items?.find(e => e._id === itemId)
        if(!item || item.opId){
            throw("Item not found or not persisted")
        }

        const newItems = list?.items?.filter(i => i._id !== itemId)
        setList({
            ...list,
            items: newItems
        })

        setPendingOperations(pendingOperations.concat({opId, position: item.position}))

        const body: DeletItemRequestBody = {
            itemID: itemId,
            opId
        }
        await fetch(`/api/list/${listId}/delete`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
        });
    }, [listId]);


    const editItem = useCallback(async (itemId: string, text: string) => {
        const opId = getOpId()
        const item = list?.items?.find(e => e._id === itemId)
        if(!item || item.opId){
            throw("Item not found or not persisted")
        }

        const newItems = list?.items?.map(i => i._id === itemId ? {...i, text} : i)
        setList({
            ...list,
            items: newItems
        })

        setPendingOperations(pendingOperations.concat({opId, position: item.position}))

        const body: EditItemRequestBody = {
            itemID: itemId,
            text,
            opId
        }
        await fetch(`/api/list/${listId}/edit`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
        });
    }, [listId]);


    const clearChecked = useCallback(async () => {
        const opId = getOpId()

        const newItems = list?.items?.filter(i => !i.checked)

        setList({
            ...list,
            items: newItems
        })

        setPendingOperations(pendingOperations.concat({opId}))

        const body: ClearCheckedRequestBody = {
            opId: getOpId()
        }
        await fetch(`/api/list/${listId}/clear`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
        });
    }, [listId]);

    return {
        list: sortedList,
        loading,
        error,
        addItem,
        moveItem,
        editItem,
        deleteItem,
        checkItem,
        clearChecked
    };
    }

function getOpId(): string{
    return randomUUID();
}