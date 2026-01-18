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
    elements: [new mongoose.Schema({
        id: mongoose.Schema.Types.ObjectId,
        name: {type: String, minlength:1}, 
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
        elements: []
    }
    await connect();
    return await new sharedListModel(list).save();
}

export async function deleteSharedList(id: string){
    await connect();
    return await sharedListModel.findByIdAndDelete(id).exec();
}

export type SharedList = {
    _id?: mongoose.Types.ObjectId
    version?: number
    name?: string
    owner?: string
    viewers?: string[]
    elements?: {
        id: mongoose.Types.ObjectId
        name: string
        checked: boolean
    }[]
};

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

    const maxPosition = result[0]?.maxPosition ?? 0;

    const element = {
        _id: new ObjectId(),
        name: text,
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

    await ably.channels.get(`list:${listID}`).publish("SLEvent", {
        type: "ADD",
        element: element,
        version: updated.version
    })
    return true
}

export async function updateSharedListCheckItem(listID: string, elementID?: string): Promise<boolean>{
    await connect();

    if (!elementID) return false
    await sharedListModel.updateOne(
        {_id: listID, "elements._id": new ObjectId(elementID)},
        {
            $set: { "elements.$.checked": true },
            $inc: {version: 1}
        }
    )
    const updated = await sharedListModel.findOne(
        { _id: new ObjectId(listID) },
    );

    await ably.channels.get(`list:${listID}`).publish("SLEvent", {
        type: "CHECK",
        elementID,
        version: updated.version
    })
    return true
}

export async function updateSharedListDeleteItem(listID: string, elementID?: string): Promise<boolean>{
    await connect();

    if (!elementID) return false
    await sharedListModel.updateOne(
        {_id: new ObjectId(listID)},
        {
            $pull: {elements: {_id: new ObjectId(elementID)}},
            $inc: {version: 1}
        }
    )
    const updated = await sharedListModel.findOne(
        { _id: new ObjectId(listID) }
    );

    await ably.channels.get(`list:${listID}`).publish("SLEvent", {
        type: "DELETE",
        elementID,
        version: updated.version
    })
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

    await ably.channels.get(`list:${listID}`).publish("SLEvent", {
        type: "CLEAR",
        version: updated.version
    })
    return true
}

export async function updateSharedListEditItem(listID: string, elementID?: string, text?: string): Promise<boolean>{
    await connect();

    if (!text || !elementID) return false
    await sharedListModel.updateOne(
        {_id: new ObjectId(listID), "elements._id": new ObjectId(elementID)},
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

    await ably.channels.get(`list:${listID}`).publish("SLEvent", {
        type: "EDIT",
        elementID,
        newText: text,
        version: updated.version
    })
    
    return true
}

export async function updateSharedListMoveItem(listID: string, elementID?: string, elementIDBefore?: string, elementIDAfter?: string): Promise<boolean>{
    await connect();

    if (!elementID || (!elementIDBefore && !elementIDAfter)) return false

    const elementBefore = (await sharedListModel.findOne(
        {_id: new ObjectId(listID), "elements._id": new ObjectId(elementIDBefore)},
        {"elements.$": 1}
    ))?.elements[0];

    const elementAfter = (await sharedListModel.findOne(
        {_id: new ObjectId(listID), "elements._id": new ObjectId(elementIDAfter)},
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
        {_id: new ObjectId(listID), "elements._id": new ObjectId(elementID)},
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

    await ably.channels.get(`list:${listID}`).publish("SLEvent", {
        type: "MOVE",
        elementID,
        newPosition: newPosition,
        version: updated.version
    })
    
    return true
}