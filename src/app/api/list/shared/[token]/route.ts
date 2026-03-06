import { getSharedListIdByShareToken } from "@/app/api/services/sharedListRepository";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params:{token} }: {params: {token: string}}) {
    if(!token){
        return NextResponse.json({message: 'Share token not found'}, {status: 403})
    }
    
    let sharedListId;
    await getSharedListIdByShareToken(token).then(res => {
        sharedListId = res
    });

    const res = NextResponse.json(sharedListId);

    return res;
}
