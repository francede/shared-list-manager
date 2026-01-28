import { NextRequest } from "next/server";
import { getSharedList } from "@/app/api/services/sharedListRepository";

export async function userHasRole(request: NextRequest, requiredRole: Role){
    const roles = await getUserRoles(request)
    return roles.includes(requiredRole);
}

async function getUserRoles(request: NextRequest){
    const email = request.headers.get("x-user-email");
    const listId = extractListId(request.nextUrl.pathname);

    const roles: Role[] = []
    if (!email){
        return roles;
    }

    roles.push("authenticated")

    if (!listId){
        return roles;
    }

    //TODO: Fetch only owner/viewers
    const list = await getSharedList(listId);

    if (!list) {
        return roles
    }

    if (list.owner === email) roles.push("owner");

    if (list.owner === email || list.viewers?.includes(email)) roles.push("editor");

    return roles;
}

function extractListId(pathname: string): string | null {
  const match = pathname.match(/^\/api\/list\/([^\/]+)/);
  return match?.[1] ?? null;
}

export type Role = "owner" | "editor" | "authenticated";
