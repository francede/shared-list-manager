import { SharedList, SharedListRepository } from "@/services/sharedListRepository";
import { NextRequest } from "next/server";

export async function GET(_: NextRequest, params: {params: {id: string}}) {
    let sharedList;
    await SharedListRepository.getSharedList(params.params.id).then(res => {
        sharedList = res
    });

    return Response.json(sharedList);
}

export async function PUT(request: NextRequest, params: {params: {id: string}}) {
    let response;
    await request.json().then((data: SharedList) => SharedListRepository.updateSharedList(params.params.id, data).then(res => {
        response = res;
    }));

    return Response.json(response);
}

export async function DELETE(request: NextRequest, params: {params: {id: string}}) {
    let response;
    await SharedListRepository.deleteSharedList(params.params.id).then(res => {
        response = res;
    });

    return Response.json(response);
}