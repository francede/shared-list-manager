"use client";

import { useEffect, useState, useCallback } from "react";
import { AddItemEvent, CheckItemEvent, ClearCheckedEvent, DeleteItemEvent, EditItemEvent, MoveItemEvent, SharedList } from "@/app/api/services/sharedListRepository";
import { useChannel } from "ably/react";
import { Message } from "ably";
import { AddItemRequestBody } from "@/app/api/list/[id]/add/route";
import { MoveItemRequestBody } from "@/app/api/list/[id]/move/route";
import { CheckItemRequestBody } from "@/app/api/list/[id]/check/route";
import { DeletItemRequestBody } from "@/app/api/list/[id]/delete/route";
import { EditItemRequestBody } from "@/app/api/list/[id]/edit/route";


export function useSharedList(listId: string) {

    const [list, setList] = useState<SharedList | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            list.items?.push 
            list.version = data.version
        }

        if(message.name === "CHECK"){
            const data = message.data as CheckItemEvent
            const item = list.items?.find(e => e.id.toString() === data.itemId)
            if (item){
                item.checked = true
            }
            list.version = data.version
        }

        if(message.name === "DELETE"){
            const data = message.data as DeleteItemEvent
            list.items?.filter(e => e.id.toString() !== data.itemId)
            list.version = data.version
        }

        if(message.name === "MOVE"){
            const data = message.data as MoveItemEvent
            const item = list.items?.find(e => e.id.toString() === data.itemId)
            if(item){
                item.position = data.position
            }
            list.version = data.version
        }

        if(message.name === "EDIT"){
            const data = message.data as EditItemEvent
            const item = list.items?.find(e => e.id.toString() === data.itemId)
            if(item){
                item.text = data.text
            }
            list.version = data.version
        }

        if(message.name === "CLEAR"){
            const data = message.data as ClearCheckedEvent
            list.items = list.items?.filter(e => e.checked === false)
            list.version = data.version
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
    const body: AddItemRequestBody = {
        text
    }
    await fetch(`/api/list/${listId}/add`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" }
    });
  }, [listId]);

  const moveItem = useCallback(async (itemId: string, itemIdBefore?: string, itemIdAfter?: string) => {
    const body: MoveItemRequestBody = {
        itemID: itemId,
        itemIDBefore: itemIdBefore,
        itemIDAfter: itemIdAfter
    }
    await fetch(`/api/list/${listId}/move`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" }
    });
  }, [listId]);

  const checkItem = useCallback(async (itemId: string) => {
    const body: CheckItemRequestBody = {
        itemID: itemId
    }
    await fetch(`/api/list/${listId}/check`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" }
    });
  }, [listId]);

  const deleteItem = useCallback(async (itemId: string) => {
    const body: DeletItemRequestBody = {
        itemID: itemId
    }
    await fetch(`/api/list/${listId}/delete`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" }
    });
  }, [listId]);


  const editItem = useCallback(async (itemId: string, text: string) => {
    const body: EditItemRequestBody = {
        itemID: itemId,
        text
    }
    await fetch(`/api/list/${listId}/edit`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" }
    });
  }, [listId]);


  const clearChecked = useCallback(async () => {
    await fetch(`/api/list/${listId}/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
  }, [listId]);


  return {
    list,
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