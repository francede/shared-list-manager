"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AddItemEvent, CheckItemEvent, ClearCheckedEvent, DeleteItemEvent, EditItemEvent, MoveItemEvent, SharedList, SharedListItem, SLEvent, UpdateMetadataRequestBody } from "@/app/api/services/sharedListRepository";
import { useChannel } from "ably/react";
import { Message } from "ably";
import { AddItemRequestBody } from "@/app/api/list/[id]/add/route";
import { MoveItemRequestBody } from "@/app/api/list/[id]/move/route";
import { CheckItemRequestBody } from "@/app/api/list/[id]/check/route";
import { DeleteItemRequestBody } from "@/app/api/list/[id]/delete/route";
import { EditItemRequestBody } from "@/app/api/list/[id]/edit/route";
import { ClearCheckedRequestBody } from "@/app/api/list/[id]/clear/route";
import sharedListUtils from "@/utils/sharedListUtils";
import { ItemSpinnerState } from "../itemSpinner";

const LOADED_DURATION = 1500;

export function useSharedList(listId: string) {

    const [list, setList] = useState<SharedList | null>(null);
    const [loading, setLoading] = useState(true);
    const [deletingList, setDeletingList] = useState(false)
    const [error, setError] = useState<string | null>(null);
    const fulfilledOperationsTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
    const [operations, setOperations] = useState<Map<string, {itemId: string | null}>>(new Map()) //TODO: update to bidirectional model (opid -> itemid, itemid -> opid)

    useChannel(`list:${listId}`, (message) => {
        handleMessage(message)
    });

    useEffect(() => {
        getList();
    }, [listId]);

    const hasPendingOperations = useMemo(() => {
        for(const [opId] of operations){
            if(!fulfilledOperationsTimeoutsRef.current.has(opId)){
                return true
            }
        }
        return false
    }, [operations])

    const listItemsWithStatus = useMemo(() => {
        const listWithStatus = list?.items.map(item => {
            if (item.opId) {
                return { ...item, status: "loading" };
            }

            let opInfo = null;
            for(const [id, info] of operations){
                if(info.itemId && info.itemId === item._id){
                    opInfo = info
                    break;
                }
            }

            if (opInfo) {
                return { ...item, status: "loaded" };
            }

            return { ...item, status: "none" };
        })
        .toSorted((a,b) => a.position - b.position);

        return (listWithStatus ?? []) as (SharedListItem & {status: ItemSpinnerState})[]
    }, [list, operations])

    const operationFulfilled = (opId: string) => {
        const opInfo = operations.get(opId)

        if(opInfo){
            clearTimeout(fulfilledOperationsTimeoutsRef.current.get(opId))
        }else{
            return
        }

        const timeoutId = setTimeout(() => {
                fulfilledOperationsTimeoutsRef.current.delete(opId)
                setOperations(prev => {
                    const next = new Map(prev);
                    next.delete(opId);
                    return next;
                });
        }, LOADED_DURATION)

        fulfilledOperationsTimeoutsRef.current.set(opId, timeoutId)
        setOperations(prev => {
            const next = new Map(prev);
            const opInfo = prev.get(opId);
            if (opInfo) next.set(opId, { itemId: opInfo.itemId });
            return next;
        });
    }

    const newOperation = (opId: string, itemId: string | null) => {
        setOperations(prev => {
            const next = new Map(prev);
            next.set(opId, { itemId });
            return next;
        });
    }

    function handleMessage(message: Message){
        const genericData = message.data as SLEvent
        console.log("MESSAGE INBOUND (%s) --- V: %d", message.name, genericData.version)
        if(list?.version && list?.version >= message.data?.version){
            return; //ignore if incoming version is outdated
        }

        if(!list?.version || list.version + 1 !== genericData?.version){
            console.log("LIST VERSION MISMATCH current:%d inbound:%d", list?.version, genericData.version)
            getList()
            fulfilledOperationsTimeoutsRef.current.clear()
            setOperations(new Map())
            return
        }

        operationFulfilled(genericData.opId)

        if(message.name === "ADD"){
            const data = message.data as AddItemEvent
            const newItems = list.items?.filter(i => i.opId !== data.opId)

            if(operations.has(data.opId)){
                setOperations(prev => {
                    const next = new Map(prev);
                    next.set(data.opId, { itemId: data.item.id});
                    return next;
                });
            }
            

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

            const newItems = list.items?.map(i => i._id === data.itemId ? {...i, checked: true, opId: undefined} : i)
            setList({
                ...list,
                items: newItems,
                version: data.version
            })
        }

        if(message.name === "DELETE"){
            const data = message.data as DeleteItemEvent

            const newItems = list.items?.filter(i => i._id !== data.itemId)
            setList({
                ...list,
                items: newItems,
                version: data.version
            })
        }
        

        if(message.name === "MOVE"){
            const data = message.data as MoveItemEvent

            const newItems = list.items?.map(i => i._id === data.itemId ? {...i, position: data.position, opId: undefined} : i)
            setList({
                ...list,
                items: newItems,
                version: data.version
            })
        }

        if(message.name === "EDIT"){
            const data = message.data as EditItemEvent

            const newItems = list.items?.map(i => i._id === data.itemId ? {...i, text: data.text, opId: undefined} : i)
            setList({
                ...list,
                items: newItems,
                version: data.version
            })
        }

        if(message.name === "CLEAR"){
            const data = message.data as ClearCheckedEvent
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
        const tempId = "temp:"+opId
        const newItems = list?.items?.concat({
            _id: tempId,
            text,
            position: itemPosition,
            checked: false,
            opId: opId
        })

        setList({
            ...list,
            items: newItems
        })

        newOperation(opId, tempId)

        const body: AddItemRequestBody = {
            text,
            opId
        }
        await fetch(`/api/list/${listId}/add`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
        });
    }, [listId, list, operations]);

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

        const newItems = list?.items?.map(i => i._id === itemId ? {...i, position: newPosition, opId: opId} : i)

        setList({
            ...list,
            items: newItems
        })

        newOperation(opId, itemId)

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
    }, [listId, list]);

    const checkItem = useCallback(async (itemId: string) => {
        if(!list) return
        const opId = getOpId()
        const item = list?.items?.find(e => e._id === itemId)
        if(!item || item.opId){
            throw("Item not found or not persisted")
        }

        const newItems = list?.items?.map(i => i._id === itemId ? {...i, checked: true, opId: opId} : i)

        setList({
            ...list,
            items: newItems
        })

        newOperation(opId, itemId)

        const body: CheckItemRequestBody = {
            itemId: itemId,
            opId
        }
        await fetch(`/api/list/${listId}/check`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
        });
    }, [listId, list]);

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

        newOperation(opId, itemId)

        const body: DeleteItemRequestBody = {
            itemId: itemId,
            opId
        }
        await fetch(`/api/list/${listId}/delete`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
        });
    }, [listId, list]);


    const editItem = useCallback(async (itemId: string, text: string) => {
        if(!list) return
        const opId = getOpId()
        const item = list?.items?.find(e => e._id === itemId)

        if(!item || item.opId){
            throw("Item not found or not persisted")
        }

        const newItems = list?.items?.map(i => i._id === itemId ? {...i, text, opId: opId} : i)
        setList({
            ...list,
            items: newItems
        })

        newOperation(opId, itemId)

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
    }, [listId, list]);



    const clearChecked = useCallback(async () => {
        if(!list) return
        const opId = getOpId()

        const newItems = list?.items?.filter(i => !i.checked)
        setList({
            ...list,
            items: newItems
        })

        //TODO: track multi-item operations separately
        //newOperation(opId, null)

        const body: ClearCheckedRequestBody = {
            opId: opId
        }
        await fetch(`/api/list/${listId}/clear`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
        });
    }, [listId, list]);

    return {
        list,
        loading,
        hasPendingOperations,
        deletingList,
        error,
        deleteList,
        updateListMetadata,
        addItem,
        moveItem,
        editItem,
        deleteItem,
        checkItem,
        clearChecked,
        listItemsWithStatus
    };
    }

function getOpId(): string{
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
  );
}