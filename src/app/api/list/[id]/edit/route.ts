import { updateSharedListAddItem, updateSharedListEditItem } from "@/app/api/services/sharedListRepository";
import { requestHasRole } from "@/app/api/services/roleService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, params: {params: {id: string}}) {
    if(!await requestHasRole(req, "editor")){
        return NextResponse.json({message: 'unauthorized'}, {status: 403})
    }

    let response;
    const body = (await req.json()) as EditItemRequestBody

    await updateSharedListEditItem(params.params.id, body).then(res => {
        response = NextResponse.json(res);
    });

    return response;
}

export type EditItemRequestBody = {
    itemId: string
    text: string
    opId: string
}