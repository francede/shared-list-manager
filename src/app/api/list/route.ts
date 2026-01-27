import { createSharedList } from "@/app/api/services/sharedListRepository";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const email = req.headers.get("x-user-email");

    if (!email) {
        return NextResponse.json({message: 'unauthenticated'}, {status: 401})
    }
    
    let response;
    await req.json().then((data) => createSharedList(data.name, email, data.viewers).then(res => {
        response = res;
    }));

    return NextResponse.json(response);
}