import { NextRequest, NextResponse } from "next/server";
import Ably from "ably";

const ably = new Ably.Rest(process.env.ABLY_CLIENT_API_KEY!);

export async function GET(req: NextRequest) {
    const email = req.headers.get("x-user-email");

    if (!email) {
        return NextResponse.json({message: 'unauthenticated'}, {status: 401})
    }

    const tokenRequest = await ably.auth.createTokenRequest({
        clientId: email,
        //ttl: 120*60*1000 //2h, default 1h
    });

    console.log(tokenRequest)

    return NextResponse.json(tokenRequest);
}