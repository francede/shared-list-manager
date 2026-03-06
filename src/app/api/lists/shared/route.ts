import { NextRequest, NextResponse } from "next/server";
import { getSharedListNamesByShareTokens } from "../../services/sharedListRepository";

export async function GET(req: NextRequest) {
    const tokens = await req.json();

    if (!tokens) {
        return NextResponse.json([], {status: 200})
    }

    const sharedLists = await getSharedListNamesByShareTokens(tokens)

    return NextResponse.json(sharedLists, {status: 200});
}