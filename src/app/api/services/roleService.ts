import { NextRequest } from "next/server";
import { getSharedList } from "@/app/api/services/sharedListRepository";

export async function requestHasRole(request: NextRequest, requiredRole: Role){
    const roles = await getRoles(request)
    return roles.includes(requiredRole);
}

async function getRoles(request: NextRequest){
    const email = request.headers.get("x-user-email");
    const shareToken = request.headers.get("x-share-token");
    const listId = extractListId(request.nextUrl.pathname);

    const roles: Role[] = []
    if (!email && !shareToken){
        return roles;
    }

    email && roles.push("authenticated")

    if (!listId){
        return roles;
    }

    //TODO: Fetch only owner/viewers/shareTokens
    const list = await getSharedList(listId);
    const listToken = list?.shareTokens.find(t => t.token === shareToken);
    console.log(list)

    if (!list) {
        return roles
    }

    if (list.owner === email) roles.push("owner");

    if (roles.includes("owner") || 
            (email && list.viewers?.includes(email)) ||
            (listToken && listToken.permissions === "edit")) {
        roles.push("editor");
    }

    if (roles.includes("editor") ||
            (listToken && listToken.permissions === "view")) {
        roles.push("viewer");
    }

    return roles;
}

function extractListId(pathname: string): string | null {
  const match = pathname.match(/^\/api\/list\/([^\/]+)/);
  return match?.[1] ?? null;
}

export type Role = "owner" | "editor" | "viewer" | "authenticated";
