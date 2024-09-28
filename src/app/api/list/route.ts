import { SharedListRepository } from "@/app/api/services/sharedListRepository";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const session = await getServerSession(request as any) as any;
    if(!session) return NextResponse.json({message: 'unauthenticated'}, {status: 401})
    const user = session.user.email;
    
    let response;
    await request.json().then((data) => SharedListRepository.createSharedList(data.name, user, data.viewers).then(res => {
        response = res;
    }));

    return Response.json(response);
}