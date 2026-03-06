import { updateSharedListCheckItem } from "@/app/api/services/sharedListRepository";
import { requestHasRole } from "@/app/api/services/roleService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, params: {params: {id: string}}) {
    if(!await requestHasRole(req, "editor")){
        return NextResponse.json({message: 'unauthorized'}, {status: 403})
    }

    let response;
    const body = (await req.json()) as CheckItemRequestBody

    await updateSharedListCheckItem(params.params.id, body).then(res => {
        response = NextResponse.json(res);
    });

    return response;
}

export type CheckItemRequestBody = {
    itemId: string,
    opId: string
}