import { updateSharedListDeleteItem } from "@/services/sharedListRepository";
import { userHasRole } from "@/services/userRoleService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, params: {params: {id: string}}) {
    if(!await userHasRole(req, "editor")){
        return NextResponse.json({message: 'unauthorized'}, {status: 403})
    }

    let response;
    const body = (await req.json()) as DeleteItemRequestBody

    await updateSharedListDeleteItem(params.params.id, body).then(res => {
        response = NextResponse.json(res);
    });

    return response;
}

export type DeleteItemRequestBody = {
    itemId: string
    opId: string
}