import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs"

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const method = request.method;

    console.log("INBOUND REQUEST TO %s - %s", pathname, method)

    const email = await getUserEmail(request)

    const headers = new Headers(request.headers);
    if(email) headers.set("x-user-email", email);

    return NextResponse.next({
        request: { headers }
    });
}

async function getUserEmail(request: NextRequest): Promise<string | null>{
    const token = await getToken({req: request})
    if(process.env.NODE_ENV === "development" && token === null){
        return request.headers.get("x-test-user-email") ?? null
    }
    
    return token?.email ?? null;
}