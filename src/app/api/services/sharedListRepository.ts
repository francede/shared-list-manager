import { ChangeStreamUpdateDocument } from "mongodb";
import mongoose, { ObjectId } from "mongoose";
import { SLEvent } from "./events";

export class SharedListRepository{
    static readonly MONGO_CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING;
    static sharedListModel = mongoose.models["SharedList"] || mongoose.model("SharedList", new mongoose.Schema<SharedList>({
        _id: mongoose.Schema.Types.ObjectId,
        name: {type: String, minlength:1},
        owner: String,
        viewers: [String],
        elements: [new mongoose.Schema({
            id: mongoose.Schema.Types.ObjectId,
            name: {type: String, minlength:1}, 
            checked: Boolean
        })],
        
    }), "SharedList");

    static async connect(){
        await mongoose.connect(this.MONGO_CONNECTION_STRING!)
            .then(() => console.log("connected"))
            .catch((e) => console.log("error while connecting", e));
    }

    static async getSharedList(id: string): Promise<SharedListResponse | null>{
        await this.connect();
        return await this.sharedListModel.findById(id).exec();
    }

    static async getSharedListsByOwner(owner: string): Promise<SharedListResponse[]>{
        await this.connect();
        return await this.sharedListModel.find({owner: owner}).exec();
    }

    static async getSharedListsByViewer(viewer: string): Promise<SharedListResponse[]>{
        await this.connect();
        return await this.sharedListModel.find({viewers: viewer}).exec();
    }

    static async createSharedList(name: string, owner: string, viewers: string[]){
        let list: SharedList = {
            name: name,
            owner: owner,
            viewers: viewers,
            elements: []
        }
        await this.connect();
        return await new this.sharedListModel(list).save();
    }

    static async updateSharedList(id: string, list: SharedList, event: SLEvent): Promise<SharedListResponse>{
        await this.connect();
        return await this.sharedListModel.findByIdAndUpdate(id, list).exec();
    }

    static async deleteSharedList(id: string){
        await this.connect();
        return await this.sharedListModel.findByIdAndDelete(id).exec();
    }

    static async setListener(onChange: (data: ChangeStreamUpdateDocument)=>void){
        this.sharedListModel.watch().on("change", onChange);
    }
}

export type SharedListCreateRequest = {
    name: string
    owner: string
    viewers: string[]
}

export type SharedListUpdateRequest = {
    event: SLEvent
    list: SharedList
}

export type SharedListResponse = {
    event: SLEvent
    list: SharedList
};

export type SharedList = {
    _id?: mongoose.Types.ObjectId
    name?: string
    owner?: string
    viewers?: string[]
    elements?: {
        id: mongoose.Types.ObjectId
        name: string
        checked: boolean
    }[]
};

