import { UpdateMetadataRequestBody, deleteSharedList, getSharedList, updateSharedListMetadata } from "@/app/api/services/sharedListRepository";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, params: {params: {id: string}}) {
    let sharedList;
    await getSharedList(params.params.id).then(res => {
        sharedList = res
    });

    return Response.json(sharedList);
}

export async function PATCH(req: NextRequest, params: {params: {id: string}}) {
    const email = req.headers.get("x-user-email");

    if (!email) {
        return NextResponse.json({message: 'unauthenticated'}, {status: 401})
    }

    const body = (await req.json()) as UpdateMetadataRequestBody

    return NextResponse.json(await updateSharedListMetadata(params.params.id, body));
}

export async function DELETE(req: NextRequest, params: {params: {id: string}}) {
    const email = req.headers.get("x-user-email");

    if (!email) {
        return NextResponse.json({message: 'unauthenticated'}, {status: 401})
    }

    let response;

    deleteSharedList(params.params.id).then(res => {
        response = NextResponse.json(res);
    });

    return response;
}