import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import * as Ably from "ably";
import sharedListUtils from "@/utils/sharedListUtils";
import { AddItemRequestBody } from "../list/[id]/add/route";
import { CheckItemRequestBody } from "../list/[id]/check/route";
import { DeleteItemRequestBody } from "../list/[id]/delete/route";
import { ClearCheckedRequestBody } from "../list/[id]/clear/route";
import { EditItemRequestBody } from "../list/[id]/edit/route";
import { MoveItemRequestBody } from "../list/[id]/move/route"
import dns from "dns/promises";

export const runtime = "nodejs";

console.log(process.env.NODE_OPTIONS)

const MONGO_CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING;
const SharedListItemSchema = new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        text: {type: String, minlength:1}, 
        checked: Boolean,
        position: Number
    })
const sharedListModel: mongoose.Model<SharedList> = mongoose.models["SharedList"] || mongoose.model("SharedList", new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    version: Number,
    name: {type: String, minlength:1},
    owner: String,
    viewers: [String],
    items: [SharedListItemSchema],
    
}), "SharedList");

const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!)


async function connect(){
    await mongoose.connect(MONGO_CONNECTION_STRING!)
        .catch((e) => console.log("error while connecting", e));
}

export async function getSharedList(id: string): Promise<SharedList | null>{
    await connect();
    return await sharedListModel.findById(id).exec();
}

export async function getSharedListsByOwner(owner: string): Promise<SharedList[]>{
    await connect();
    return await sharedListModel.find({owner: owner}).exec();
}

export async function getSharedListsByViewer(viewer: string): Promise<SharedList[]>{
    await connect();
    return await sharedListModel.find({viewers: viewer}).exec();
}

export async function createSharedList(name: string, owner: string, viewers: string[]){
    let list: SharedList = {
        _id: new ObjectId().toString(),
        name: name,
        owner: owner,
        viewers: viewers,
        items: [],
        version: 1
    }
    await connect();
    return await new sharedListModel(list).save();
}

export async function updateSharedListMetadata(listId: string, body: UpdateMetadataRequestBody){
    await connect();

    // TODO: Figure out how to check for typing
    const updates: mongoose.AnyKeys<any> = {}

    if(body.name){
        updates["name"] = body.name
    }

    if(body.owner){
        updates["owner"] = body.owner
    }

    if(body.viewers){
        updates["viewers"] = body.viewers
    }


    await sharedListModel.updateOne(
        {_id: listId},
        {
            $set: updates,
        }
    )
    return true;
}

export async function deleteSharedList(id: string){
    await connect();
    return await sharedListModel.findByIdAndDelete(id).exec();
}

export async function updateSharedListAddItem(listID: string, body: AddItemRequestBody): Promise<boolean>{
    await connect();

    if (!body.text) return false

    const result = await sharedListModel.aggregate([
        { $match: { _id: new ObjectId(listID) } },
        {
            $project: {
                maxPosition: { $max: "$items.position" }
            }
        }
    ]);

    console.log(result)

    const maxPosition: number = result[0]?.maxPosition ?? 0;

    const itemId = new ObjectId()

    const item: SharedListItem = {
        _id: itemId.toString(),
        text: body.text,
        checked: false,
        position: maxPosition + 100
    }

    const r = await sharedListModel.updateOne(
        {_id: listID},
        {
            $push: {items: item},
            $inc: {version: 1}
        }
    )
    
    const updated = await sharedListModel.findOne(
        { _id: listID }
    );

    if(!updated) return false

    const event: AddItemEvent = {
        item: {
            id: item._id,
            text: item.text,
            checked: item.checked,
            position: item.position
        },
        version: updated.version,
        opId: body.opId
    }

    await ably.channels.get(`list:${listID}`).publish("ADD", event)
    return true
}

export async function updateSharedListCheckItem(listID: string, body: CheckItemRequestBody): Promise<boolean>{
    await connect();

    if (!body.itemId) return false
    await sharedListModel.updateOne(
        {_id: listID, "items._id": body.itemId},
        {
            $set: { "items.$.checked": true },
            $inc: {version: 1}
        }
    )
    const updated = await sharedListModel.findOne(
        { _id: listID },
    );

    if(!updated) return false
    
    const event: CheckItemEvent = {
        itemId: body.itemId,
        version: updated.version,
        opId: body.opId
    }

    await ably.channels.get(`list:${listID}`).publish("CHECK", event)
    return true
}

export async function updateSharedListDeleteItem(listID: string, body: DeleteItemRequestBody): Promise<boolean>{
    await connect();

    if (!body.itemId) return false
    await sharedListModel.updateOne(
        {_id: listID},
        {
            $pull: {items: {_id: body.itemId}},
            $inc: {version: 1}
        }
    )
    const updated = await sharedListModel.findOne(
        { _id: listID }
    );

    if(!updated) return false

    const event: DeleteItemEvent = {
        itemId: body.itemId,
        version: updated.version,
        opId: body.opId
    }

    await ably.channels.get(`list:${listID}`).publish("DELETE", event)
    return true
}

export async function updateSharedListClearChecked(listID: string, body: ClearCheckedRequestBody): Promise<boolean>{
    await connect();

    await sharedListModel.updateOne(
        {_id: listID},
        {
            $pull: {items: {checked: true}},
            $inc: {version: 1}
        }
    )
    const updated = await sharedListModel.findOne(
        { _id: listID }
    );

    if(!updated) return false

    const event: ClearCheckedEvent = {
        version: updated.version,
        opId: body.opId
    }

    await ably.channels.get(`list:${listID}`).publish("CLEAR", event)
    return true
}

export async function updateSharedListEditItem(listID: string, body: EditItemRequestBody): Promise<boolean>{
    await connect();

    if (!body.text || !body.itemId) return false
    await sharedListModel.updateOne(
        {_id: listID, "items._id": body.itemId},
        {
            $set: { 
                "items.$.name": body.text,
            },
            $inc: {version: 1}
        }
    )
    const updated = await sharedListModel.findOne(
        { _id: listID }
    );

    if(!updated) return false

    const event: EditItemEvent = {
        itemId: body.itemId,
        text: body.text,
        version: updated.version,
        opId: body.opId
    }

    await ably.channels.get(`list:${listID}`).publish("EDIT", event)
    
    return true
}

export async function updateSharedListMoveItem(listID: string, body: MoveItemRequestBody): Promise<boolean>{
    await connect();

    if (!body.itemId || (!body.itemIdBefore && !body.itemIdAfter)) return false

    const itemBefore = (await sharedListModel.findOne(
        {_id: listID, "items._id": body.itemIdBefore},
        {"items.$": 1}
    ))?.items[0];

    const itemAfter = (await sharedListModel.findOne(
        {_id: listID, "items._id": body.itemIdAfter},
        {"items.$": 1}
    ))?.items[0];

    const newPosition = sharedListUtils.calculatePosition(itemBefore, itemAfter);

    await sharedListModel.updateOne(
        {_id: listID, "items._id": body.itemId},
        {
            $set: { 
                "items.$.position": newPosition,
            },
            $inc: {version: 1}
        }
    )

    const updated = await sharedListModel.findOne(
        { _id: listID }
    );

    if(!updated) return false

    const event: MoveItemEvent = {
        itemId: body.itemId,
        position: newPosition,
        version: updated.version,
        opId: body.opId
    }

    await ably.channels.get(`list:${listID}`).publish("MOVE", event)
    
    return true
}

export type SharedList = {
    _id: string
    version: number
    name: string
    owner: string
    viewers: string[]
    items: SharedListItem[]
};

export type SharedListItem = {
    _id: string
    text: string
    checked: boolean
    position: number
    opId?: string
}

export type SLEvent = {
    version: number
    opId: string
}

export type AddItemEvent = {
    item: {
        id: string
        text: string
        checked: boolean
        position: number
    }
} & SLEvent

export type CheckItemEvent = {
    itemId: string
} & SLEvent

export type DeleteItemEvent = {
    itemId: string
} & SLEvent

export type EditItemEvent = {
    itemId: string
    text: string
} & SLEvent

export type MoveItemEvent = {
    itemId: string
    position: number
} & SLEvent

export type ClearCheckedEvent = {
} & SLEvent

export type UpdateMetadataRequestBody = {
    name?: string,
    owner?: string,
    viewers?: string[]
}