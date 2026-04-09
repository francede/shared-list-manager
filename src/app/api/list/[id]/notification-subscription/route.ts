import { updateSharedListMetadata } from "@/services/sharedListRepository";
import { userHasRole } from "@/services/userRoleService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, params: {params: {id: string}}) {
    if(!await userHasRole(req, "editor")){
        return NextResponse.json({message: 'unauthorized'}, {status: 403})
    }

    const body = (await req.json()) as UpdateMetadataRequestBody

    return NextResponse.json(await updateSharedListMetadata(params.params.id, body));
}

export type UpdateMetadataRequestBody = {
    name?: string,
    owner?: string,
    viewers?: string[]
}