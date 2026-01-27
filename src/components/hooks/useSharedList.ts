"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AddItemEvent, CheckItemEvent, ClearCheckedEvent, DeleteItemEvent, EditItemEvent, MoveItemEvent, SharedList, SharedListItem, UpdateMetadataRequestBody } from "@/app/api/services/sharedListRepository";
import { useChannel } from "ably/react";
import { Message } from "ably";
import { AddItemRequestBody } from "@/app/api/list/[id]/add/route";
import { MoveItemRequestBody } from "@/app/api/list/[id]/move/route";
import { CheckItemRequestBody } from "@/app/api/list/[id]/check/route";
import { DeleteItemRequestBody } from "@/app/api/list/[id]/delete/route";
import { EditItemRequestBody } from "@/app/api/list/[id]/edit/route";
import { randomUUID } from "crypto";
import { ClearCheckedRequestBody } from "@/app/api/list/[id]/clear/route";
import sharedListUtils from "@/utils/sharedListUtils";


export function useSharedList(listId: string) {

    const [list, setList] = useState<SharedList | null>(null);
    const [loading, setLoading] = useState(true);
    const [deletingList, setDeletingList] = useState(false)
    const [error, setError] = useState<string | null>(null);
    const [pendingOperations, setPendingOperations] = useState<string[]>([])

    const sortedList = useMemo((): SharedList | null => {
        if(!list) return list

        return {
            ...list,
            items: list.items?.toSorted((a,b) => a.position - b.position)
        }
    }, [list])

    const loadingItemIds = useMemo((): string[] => {
        if(!list || pendingOperations.length === 0) return []

        const ids: string[] = []

        pendingOperations.forEach(po => {
            const item = sortedList?.items?.find(item => item.opId === po)
            if (item !== undefined && !ids.includes(item._id)){
                ids.push(item._id)
            }
        })

        return ids
    }, [list, pendingOperations, sortedList])

    useChannel(`list:${listId}`, (message) => {
        handleMessage(message)
    });

    useEffect(() => {
        getList();
    }, [listId, getList]);

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
            setPendingOperations(pendingOperations.filter(po => po !== data.opId))

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

            if(pendingOperations.find(po => po === data.opId)){
                setPendingOperations(pendingOperations.filter(po => po !== data.opId))
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

            if(pendingOperations.find(po => po === data.opId)){
                setPendingOperations(pendingOperations.filter(po => po !== data.opId))
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

            if(pendingOperations.find(po => po === data.opId)){
                setPendingOperations(pendingOperations.filter(po => po !== data.opId))
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

            if(pendingOperations.find(po => po === data.opId)){
                setPendingOperations(pendingOperations.filter(po => po !== data.opId))
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

            if(pendingOperations.find(po => po === data.opId)){
                setPendingOperations(pendingOperations.filter(po => po !== data.opId))
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

    async function updateListMetadata(body: UpdateMetadataRequestBody, cb: () => void){
        try {
            setDeletingList(true);
            const res = await fetch(new Request(`/api/list/${listId}`, {method: "PATCH", body: JSON.stringify(body)}));
        if (!res.ok) throw new Error("Failed to update list");
        cb() 
        } catch (e) {
            setError("Failed to update list");
        }
    }

    async function deleteList(cb: () => void){
        try {
            setDeletingList(true);
            const res = await fetch(new Request(`/api/list/${listId}`, {method: "DELETE"}));
        if (!res.ok) throw new Error("Failed to delete list");
        cb()
        } catch (e) {
            setError("Failed to delete list");
        }
    }

    const addItem = useCallback(async (text: string) => {
        if(!list) return
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

        setPendingOperations(pendingOperations.concat(opId))

        const body: AddItemRequestBody = {
            text,
            opId
        }
        await fetch(`/api/list/${listId}/add`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
        });
    }, [listId, list, pendingOperations]);

    const moveItem = useCallback(async (itemId: string, itemIdBefore: string | null, itemIdAfter: string | null) => {
        if(!list) return
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

        setPendingOperations(pendingOperations.concat(opId))

        const body: MoveItemRequestBody = {
            itemId: itemId,
            itemIdBefore: itemIdBefore ?? undefined,
            itemIdAfter: itemIdAfter ?? undefined,
            opId
        }
        await fetch(`/api/list/${listId}/move`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
        });
    }, [listId, list, pendingOperations]);

    const checkItem = useCallback(async (itemId: string) => {
        if(!list) return
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

        setPendingOperations(pendingOperations.concat(opId))

        const body: CheckItemRequestBody = {
            itemId: itemId,
            opId
        }
        await fetch(`/api/list/${listId}/check`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
        });
    }, [listId, list, pendingOperations]);

    const deleteItem = useCallback(async (itemId: string) => {
        if(!list) return

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

        setPendingOperations(pendingOperations.concat(opId))

        const body: DeleteItemRequestBody = {
            itemId: itemId,
            opId
        }
        await fetch(`/api/list/${listId}/delete`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
        });
    }, [listId]);


    const editItem = useCallback(async (itemId: string, text: string) => {
        if(!list) return
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

        setPendingOperations(pendingOperations.concat(opId))

        const body: EditItemRequestBody = {
            itemId: itemId,
            text,
            opId
        }
        await fetch(`/api/list/${listId}/edit`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
        });
    }, [listId, list, pendingOperations]);



    const clearChecked = useCallback(async () => {
        if(!list) return
        const opId = getOpId()

        const newItems = list?.items?.filter(i => !i.checked)
        setList({
            ...list,
            items: newItems
        })

        setPendingOperations(pendingOperations.concat(opId))

        const body: ClearCheckedRequestBody = {
            opId: getOpId()
        }
        await fetch(`/api/list/${listId}/clear`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
        });
    }, [listId, list, pendingOperations]);

    return {
        list: sortedList,
        loadingItemIds,
        loading,
        deletingList,
        error,
        deleteList,
        updateListMetadata,
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