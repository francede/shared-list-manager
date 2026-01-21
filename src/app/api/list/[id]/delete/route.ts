import { updateSharedListDeleteItem } from "@/app/api/services/sharedListRepository";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, params: {params: {id: string}}) {
    const email = req.headers.get("x-user-email");

    if (!email) {
        return NextResponse.json({message: 'unauthenticated'}, {status: 401})
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