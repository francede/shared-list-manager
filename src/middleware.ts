import { NextRequest, NextResponse } from "next/server";
import { Method, PERMISSIONS} from "./permissions";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs"

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const method = request.method as Method;

    const rule = PERMISSIONS.find(
        r => r.pattern.test(pathname) && r.methods.includes(method)
    );

    console.log("INBOUND REQUEST TO %s - %s --- AUTH REQUIRED %s", pathname, method, rule?.authRequired)

    if (!rule) return notFound("Error code 2001");

    const email = await getUserEmail(request)

    if(!email && rule.authRequired){
        return unauthenticated()
    }

    const headers = new Headers(request.headers);
    if(email) headers.set("x-user-email", email);

    return NextResponse.next({
        request: { headers }
    });
}

function unauthenticated(){
    return NextResponse.json({message: 'unauthenticated'}, {status: 401})
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