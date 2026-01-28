import { createSharedList } from "@/app/api/services/sharedListRepository";
import { NextRequest, NextResponse } from "next/server";
import { userHasRole } from "../services/userRoleService";

export async function POST(req: NextRequest) {
    if(!await userHasRole(req, "authenticated")){
        return NextResponse.json({message: 'unauthorized'}, {status: 403})
    }

    const email = req.headers.get("x-user-email");

    if(!email){
        return NextResponse.json({message: 'ERROR 45111'}, {status: 400})
    }
    
    let response;
    await req.json().then((data) => createSharedList(data.name, email, data.viewers).then(res => {
        response = res;
    }));

    return NextResponse.json(response);
}