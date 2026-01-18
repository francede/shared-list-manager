import { NextRequest, NextResponse } from "next/server";
import { getSharedList } from "@/app/api/services/sharedListRepository";
import { Role } from "@/permissions";

export async function GET(req: NextRequest) {
    const listId = req.nextUrl.searchParams.get("listId");
    const email = req.nextUrl.searchParams.get("email");

    console.log("GET ROLE LIST FOR %s - %s", listId, email)

    const roles: RoleListResponse = {roles: []}

    if (!email){
        return NextResponse.json(roles);
    }

    roles.roles.push("authenticated")

    if (!listId){
        return NextResponse.json(roles);
    }
    //TODO: Fetch only owner/viewers
    const list = await getSharedList(listId);

    if (!list) {
        return NextResponse.json(roles)
    }

    if (list.owner === email) roles.roles.push("owner");

    if (list.owner === email || list.viewers?.includes(email)) roles.roles.push("editor");

    return NextResponse.json(roles);
}

export type RoleListResponse = {
    roles: Role[]
}