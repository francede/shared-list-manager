import { updateSharedListUncheckItem } from "@/app/api/services/sharedListRepository";
import { userHasRole } from "@/app/api/services/userRoleService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, params: {params: {id: string}}) {
    if(!await userHasRole(req, "editor")){
        return NextResponse.json({message: 'unauthorized'}, {status: 403})
    }

    let response;
    const body = (await req.json()) as UncheckItemRequestBody

    await updateSharedListUncheckItem(params.params.id, body).then(res => {
        response = NextResponse.json(res);
    });

    return response;
}

export type UncheckItemRequestBody = {
    itemId: string,
    opId: string
}