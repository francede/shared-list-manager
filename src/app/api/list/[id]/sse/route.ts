import { SharedListRepository } from "@/app/api/services/sharedListRepository";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, params: {params: {id: string}}) {
    //if(req.headers.get('accept') !== 'text/event-stream') return NextResponse.json({message: 'header accept=text/event-stream missing'}, {status: 400});

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    SharedListRepository.setListener((change)=> {
        const id = change.documentKey._id.toString();

        if(params.params.id !== id) return;

        write(writer, "updated: " + id);
    });

    return new NextResponse(stream.readable, {headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    }});
}

function write(writer: WritableStreamDefaultWriter<any>, value: string){
    const encoder = new TextEncoder();
    console.log("Writing: " + value, encoder.encode(value));
    writer.write("data:"+value+"\n\n");
}