import { createShareToken, revokeShareLink, ShareTokenPermissions, updateSharedListAddItem } from "@/app/api/services/sharedListRepository";
import { requestHasRole } from "@/app/api/services/roleService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, params: {params: {id: string}}) {
    if(!await requestHasRole(req, "owner")){
        return NextResponse.json({message: 'unauthorized'}, {status: 403})
    }

    let response;
    const body = (await req.json()) as CreateShareTokenRequestBody

    await createShareToken(params.params.id, body.type).then(res => {
        response = NextResponse.json({res});
    });

    return response;
}

export async function DELETE(req: NextRequest, params: {params: {id: string}}) {
    if(!await requestHasRole(req, "owner")){
        return NextResponse.json({message: 'unauthorized'}, {status: 403})
    }

    let response;
    const body = (await req.json()) as RevokeShareTokenRequestBody

    revokeShareLink(params.params.id, body.token).then(res => {
        response = NextResponse.json(res);
    });

    return response;
}

export type CreateShareTokenRequestBody = {
    type: ShareTokenPermissions
}

export type RevokeShareTokenRequestBody = {
    token: string
}