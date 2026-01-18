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

    const roles = await getUserRoles(listId, email, request);
    if (roles.length === 0) return unauthenticated();

    if (!roleSatisfies(roles, rule.requiredRole)) {
        return forbidden();
    }

    const headers = new Headers(request.headers);
    if(email) headers.set("x-user-email", email);

    return NextResponse.next({
    request: { headers }
    });
}

function extractListId(pathname: string): string | null {
  const match = pathname.match(/^\/api\/list\/([^\/]+)/);
  return match?.[1] ?? null;
}

async function getUserRoles(listId: string | null, email: string | null, request: NextRequest): Promise<Role[]>{
    if (!email){
        return []
    }

    if (!listId){
        return ["authenticated"]
    }

    const res = await fetch(`${request.nextUrl.origin}/api/list/${listId}/roles?listId=${listId}&email=${email}`);

    const body = await res.json() as RoleListResponse

    return body.roles
}

function roleSatisfies(roles: Role[], requiredRole: Role): boolean{
    return roles.includes(requiredRole)
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
    if(process.env.NODE_ENV === "development"){
        return request.headers.get("x-test-user-email")
    }

    const token = await getToken({req: request})
    return token?.email ?? null;
}