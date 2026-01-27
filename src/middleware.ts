import { NextRequest, NextResponse } from "next/server";
import { Method, PERMISSIONS, Role } from "./permissions";
import { getToken } from "next-auth/jwt";
import { RoleListResponse } from "./app/api/list/[id]/roles/route";

export const runtime = "nodejs"

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const method = request.method as Method;

    const rule = PERMISSIONS.find(
        r => r.pattern.test(pathname) && r.methods.includes(method)
    );

    console.log("INBOUND REQUEST TO %s - %s --- REQ ROLE %s", pathname, method, rule?.requiredRole)

    if (!rule) return notFound("Error code 2001");

    const listId = extractListId(pathname);

    const email = await getUserEmail(request)

    const roles = await getUserRoles(listId, email, rule.requiredRole, request);
    if (roles === null) return notFound("Error code 2002");

    if (!roleSatisfies(roles, rule.requiredRole)) {
        if (roles.length === 0) return unauthenticated();
        return forbidden();
    }

    const headers = new Headers(request.headers);
    if(email) headers.set("x-user-email", email);

    console.log("SENDING", pathname, email)

    return NextResponse.next({
        request: { headers }
    });
}

function extractListId(pathname: string): string | null {
  const match = pathname.match(/^\/api\/list\/([^\/]+)/);
  return match?.[1] ?? null;
}

async function getUserRoles(listId: string | null, email: string | null, requiredRole: Role | null, request: NextRequest): Promise<Role[] | null>{
    if (!email){
        return []
    }
    //TODO: Extract authenticated from roles
    if (!listId || requiredRole === "authenticated" || requiredRole === null){
        return ["authenticated"]
    }

    const res = await fetch(`${request.nextUrl.origin}/api/list/${listId}/roles?listId=${listId}&email=${email}`);

    if(res.status === 404) return null

    const body = await res.json() as RoleListResponse

    return body.roles
}

function roleSatisfies(roles: Role[], requiredRole: Role | null): boolean{
    return requiredRole === null || roles.includes(requiredRole) 
}

function unauthenticated(){
    return NextResponse.json({message: 'unauthenticated'}, {status: 401})
}
    
function forbidden(){
    return NextResponse.json({message: 'unauthorized'}, {status: 403})
}

function notFound(msg?: string){
    return NextResponse.json({message: msg ?? 'not found'}, {status: 404})
}

async function getUserEmail(request: NextRequest): Promise<string | null>{
    const token = await getToken({req: request})
    if(process.env.NODE_ENV === "development" && token === null){
        return request.headers.get("x-test-user-email") ?? "anon@email.com"
    }
    
    return token?.email ?? null;
}