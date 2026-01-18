import { updateSharedListAddItem } from "@/app/api/services/sharedListRepository";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, params: {params: {id: string}}) {
    const email = req.headers.get("x-user-email");

    if (!email) {
        return NextResponse.json({message: 'unauthenticated'}, {status: 401})
    }

    let response;
    const body = (await req.json()) as AddItemRequestBody

    await updateSharedListAddItem(params.params.id, body.text).then(res => {
        response = NextResponse.json(res);
    });

    return response;
}

export type AddItemRequestBody = {
    text: string
}