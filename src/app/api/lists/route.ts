import { SharedListRepository } from "@/app/api/services/sharedListRepository";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const session = await getServerSession(request as any) as any;
    if(!session) return NextResponse.json({message: 'unauthenticated'}, {status: 401})
    const role = request.nextUrl.searchParams.get("role");
    const user = session.user.email;
    
    let sharedLists;
    if(role==="owner"){
        await SharedListRepository.getSharedListsByOwner(user)
            .then(res => sharedLists = res);
    }
    else if(role==="viewer"){
        await SharedListRepository.getSharedListsByViewer(user)
            .then(res => sharedLists = res);
    }else{
        return NextResponse.json({message: 'bad request'}, {status: 404})
    }
    
    return Response.json(sharedLists, {status: 200});
}