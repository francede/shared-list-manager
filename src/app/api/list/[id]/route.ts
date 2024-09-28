import { SharedList, SharedListRepository, SharedListUpdateRequest } from "@/app/api/services/sharedListRepository";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { CheckEvent } from "../../services/events";

export async function GET(_: NextRequest, params: {params: {id: string}}) {
    let sharedList;
    await SharedListRepository.getSharedList(params.params.id).then(res => {
        sharedList = res
    });

    return Response.json(sharedList);
}

export async function PUT(request: NextRequest, params: {params: {id: string}}) {
    const session = await getServerSession(request as any) as any;
    if(!session) return NextResponse.json({message: 'unauthenticated'}, {status: 401})
    const user = session.user.email;
    let response;

    await SharedListRepository.getSharedList(params.params.id).then(async res => {
        await request.json().then(async (updateRequest: SharedListUpdateRequest) =>  {
            await SharedListRepository.updateSharedList(params.params.id, updateRequest).then(res => {
                response = NextResponse.json(res);
        })});
    })

    return response;
}

export async function DELETE(request: NextRequest, params: {params: {id: string}}) {
    const session = await getServerSession(request as any) as any;
    if(!session) return NextResponse.json({message: 'unauthenticated'}, {status: 401})
    const user = session.user.email;
    let response;

    await SharedListRepository.getSharedList(params.params.id).then(res => {
        if(res?.list.owner !== user){
            response =  NextResponse.json({message: 'not list owner'}, {status: 403})
            return;
        }
        SharedListRepository.deleteSharedList(params.params.id).then(res => {
            response = NextResponse.json(res);
        });
    
    })
    return response;
}