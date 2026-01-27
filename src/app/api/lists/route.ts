import { NextRequest, NextResponse } from "next/server";
import { getSharedListsByOwner, getSharedListsByViewer } from "../services/sharedListRepository";

export async function GET(req: NextRequest) {
    const email = req.headers.get("x-user-email");

    if (!email) {
        return NextResponse.json({message: 'unauthenticated'}, {status: 401})
    }

    const role = req.nextUrl.searchParams.get("role");
    
    let sharedLists;
    if(role === "owner"){
        await getSharedListsByOwner(email)
            .then(res => sharedLists = res);
    }
    else if(role === "viewer"){
        await getSharedListsByViewer(email)
            .then(res => sharedLists = res);
    }else{
        return NextResponse.json({message: 'bad request'}, {status: 404})
    }
    
    return NextResponse.json(sharedLists, {status: 200});
}