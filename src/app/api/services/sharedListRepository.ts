import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import * as Ably from "ably";

const MONGO_CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING;
const sharedListModel = mongoose.models["SharedList"] || mongoose.model("SharedList", new mongoose.Schema<SharedList>({
    _id: mongoose.Schema.Types.ObjectId,
    version: Number,
    name: {type: String, minlength:1},
    owner: String,
    viewers: [String],
    items: [new mongoose.Schema({
        id: mongoose.Schema.Types.ObjectId,
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
        _id: new ObjectId(),
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

export async function updateSharedListAddItem(listID: string, text?: string): Promise<boolean>{
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

    const element = {
        _id: itemId,
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
        item: {...element, _id: itemId.toString()},
        version: updated.version
    }

    await ably.channels.get(`list:${listID}`).publish("ADD", event)
    return true
}

export async function updateSharedListCheckItem(listID: string, itemId?: string): Promise<boolean>{
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
        version: updated.version
    }

    await ably.channels.get(`list:${listID}`).publish("CHECK", event)
    return true
}

export async function updateSharedListDeleteItem(listID: string, itemId?: string): Promise<boolean>{
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
        version: updated.version
    }

    await ably.channels.get(`list:${listID}`).publish("DELETE", event)
    return true
}

export async function updateSharedListClearChecked(listID: string): Promise<boolean>{
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
        version: updated.version
    }

    await ably.channels.get(`list:${listID}`).publish("CLEAR", event)
    return true
}

export async function updateSharedListEditItem(listID: string, itemId?: string, text?: string): Promise<boolean>{
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
        version: updated.version
    }

    await ably.channels.get(`list:${listID}`).publish("EDIT", event)
    
    return true
}

export async function updateSharedListMoveItem(listID: string, itemId?: string, itemIdBefore?: string, itemIdAfter?: string): Promise<boolean>{
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

    let newPosition;

    if (!elementAfter){
        newPosition = elementBefore.position + 100
    }else if(!elementBefore){
        newPosition = elementAfter.position - 100
    }else{
        newPosition = (elementBefore.position + elementAfter.position) / 2
    }

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
        version: updated.version
    }

    await ably.channels.get(`list:${listID}`).publish("MOVE", event)
    
    return true
}

export type SharedList = {
    _id?: mongoose.Types.ObjectId
    version?: number
    name?: string
    owner?: string
    viewers?: string[]
    items?: {
        id: mongoose.Types.ObjectId
        text: string
        checked: boolean
        position: number
    }[]
};

export type AddItemEvent = {
    item: {
        _id: string
        text: string
        checked: boolean
        position: number
    }
    version: number
}

export type CheckItemEvent = {
    itemId: string
    version: number
}

export type DeleteItemEvent = {
    itemId: string
    version: number
}

export type EditItemEvent = {
    itemId: string
    text: string
    version: number
}

export type MoveItemEvent = {
    itemId: string
    position: number
    version: number
}

export type ClearCheckedEvent = {
    version: number
}