import { UpdateMetadataRequestBody, deleteSharedList, getSharedList, updateSharedListMetadata } from "@/app/api/services/sharedListRepository";
import { NextRequest, NextResponse } from "next/server";
import { requestHasRole } from "../../services/roleService";

export async function GET(req: NextRequest, params: {params: {id: string}}) {
    if(!await requestHasRole(req, "viewer")){
        return NextResponse.json({message: 'unauthorized'}, {status: 403})
    }
    
    let sharedList;
    await getSharedList(params.params.id).then(res => {
        sharedList = res
    });

    return Response.json(sharedList);
}

export async function PATCH(req: NextRequest, params: {params: {id: string}}) {
    if(!await requestHasRole(req, "owner")){
        return NextResponse.json({message: 'unauthorized'}, {status: 403})
    }

    const body = (await req.json()) as UpdateMetadataRequestBody

    return NextResponse.json(await updateSharedListMetadata(params.params.id, body));
}

export async function DELETE(req: NextRequest, params: {params: {id: string}}) {
    if(!await requestHasRole(req, "owner")){
        return NextResponse.json({message: 'unauthorized'}, {status: 403})
    }

    let response;

    deleteSharedList(params.params.id).then(res => {
        response = NextResponse.json(res);
    });

    return response;
}