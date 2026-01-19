import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import * as Ably from "ably";
import sharedListUtils from "@/utils/sharedListUtils";

const MONGO_CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING;
const sharedListModel = mongoose.models["SharedList"] || mongoose.model("SharedList", new mongoose.Schema<SharedList>({
    _id: mongoose.Schema.Types.ObjectId,
    version: Number,
    name: {type: String, minlength:1},
    owner: String,
    viewers: [String],
    items: [new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        text: {type: String, minlength:1}, 
        checked: Boolean,
        position: Number
    })],
    
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
        items: []
    }
    await connect();
    return await new sharedListModel(list).save();
}

export async function deleteSharedList(id: string){
    await connect();
    return await sharedListModel.findByIdAndDelete(id).exec();
}

export async function updateSharedListAddItem(listID: string, opId: string, text?: string): Promise<boolean>{
    await connect();

    if (!text) return false

    const result = await sharedListModel.aggregate([
        { $match: { _id: new ObjectId(listID) } },
        {
            $project: {
                maxPosition: { $max: "$elements.position" }
            }
        }
    ]);

    const maxPosition: number = result[0]?.maxPosition ?? 0;

    const itemId = new ObjectId()

    const element: SharedListItem = {
        _id: itemId.toString(),
        text: text,
        checked: false,
        position: maxPosition + 100
    }

    await sharedListModel.updateOne(
        {_id: listID},
        {
            $push: {elements: element},
            $inc: {version: 1}
        }
    )
    const updated = await sharedListModel.findOne(
        { _id: new ObjectId(listID) }
    );

    const event: AddItemEvent = {
        item: {...element, id: itemId.toString()},
        version: updated.version,
        opId
    }

    await ably.channels.get(`list:${listID}`).publish("ADD", event)
    return true
}

export async function updateSharedListCheckItem(listID: string, opId: string, itemId?: string): Promise<boolean>{
    await connect();

    if (!itemId) return false
    await sharedListModel.updateOne(
        {_id: listID, "elements._id": new ObjectId(itemId)},
        {
            $set: { "elements.$.checked": true },
            $inc: {version: 1}
        }
    )
    const updated = await sharedListModel.findOne(
        { _id: new ObjectId(listID) },
    );
    
    const event: CheckItemEvent = {
        itemId: itemId,
        version: updated.version,
        opId
    }

    await ably.channels.get(`list:${listID}`).publish("CHECK", event)
    return true
}

export async function updateSharedListDeleteItem(listID: string, opId: string, itemId?: string): Promise<boolean>{
    await connect();

    if (!itemId) return false
    await sharedListModel.updateOne(
        {_id: new ObjectId(listID)},
        {
            $pull: {elements: {_id: new ObjectId(itemId)}},
            $inc: {version: 1}
        }
    )
    const updated = await sharedListModel.findOne(
        { _id: new ObjectId(listID) }
    );

    const event: DeleteItemEvent = {
        itemId,
        version: updated.version,
        opId
    }

    await ably.channels.get(`list:${listID}`).publish("DELETE", event)
    return true
}

export async function updateSharedListClearChecked(listID: string, opId: string): Promise<boolean>{
    await connect();

    await sharedListModel.updateOne(
        {_id: new ObjectId(listID)},
        {
            $pull: {elements: {checked: true}},
            $inc: {version: 1}
        }
    )
    const updated = await sharedListModel.findOne(
        { _id: new ObjectId(listID) }
    );

    const event: ClearCheckedEvent = {
        version: updated.version,
        opId
    }

    await ably.channels.get(`list:${listID}`).publish("CLEAR", event)
    return true
}

export async function updateSharedListEditItem(listID: string, opId: string, itemId?: string, text?: string): Promise<boolean>{
    await connect();

    if (!text || !itemId) return false
    await sharedListModel.updateOne(
        {_id: new ObjectId(listID), "elements._id": new ObjectId(itemId)},
        {
            $set: { 
                "elements.$.name": text,
            },
            $inc: {version: 1}
        }
    )
    const updated = await sharedListModel.findOne(
        { _id: new ObjectId(listID) }
    );

    const event: EditItemEvent = {
        itemId,
        text,
        version: updated.version,
        opId
    }

    await ably.channels.get(`list:${listID}`).publish("EDIT", event)
    
    return true
}

export async function updateSharedListMoveItem(listID: string, opId: string, itemId?: string, itemIdBefore?: string, itemIdAfter?: string): Promise<boolean>{
    await connect();

    if (!itemId || (!itemIdBefore && !itemIdAfter)) return false

    const elementBefore = (await sharedListModel.findOne(
        {_id: new ObjectId(listID), "elements._id": new ObjectId(itemIdBefore)},
        {"elements.$": 1}
    ))?.elements[0];

    const elementAfter = (await sharedListModel.findOne(
        {_id: new ObjectId(listID), "elements._id": new ObjectId(itemIdAfter)},
        {"elements.$": 1}
    ))?.elements[0];

    const newPosition = sharedListUtils.calculatePosition(elementBefore, elementAfter);

    await sharedListModel.updateOne(
        {_id: new ObjectId(listID), "elements._id": new ObjectId(itemId)},
        {
            $set: { 
                "elements.$.position": newPosition,
            },
            $inc: {version: 1}
        }
    )

    const updated = await sharedListModel.findOne(
        { _id: new ObjectId(listID) }
    );

    const event: MoveItemEvent = {
        itemId,
        position: newPosition,
        version: updated.version,
        opId
    }

    await ably.channels.get(`list:${listID}`).publish("MOVE", event)
    
    return true
}

export type SharedList = {
    _id?: string
    version?: number
    name?: string
    owner?: string
    viewers?: string[]
    items?: SharedListItem[]
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