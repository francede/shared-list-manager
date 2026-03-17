import { getSharedList, updateSharedListMoveItem } from "@/app/api/services/sharedListRepository";
import { getListItemsSortedIntoCategories } from "@/app/api/services/smartSortService";
import { userHasRole } from "@/app/api/services/userRoleService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, {params}: {params: {id: string}}) {
    if(!await userHasRole(req, "editor")){
        return NextResponse.json({message: 'unauthorized'}, {status: 403})
    }

    const list = await getSharedList(params.id);

    if(!list){
        return NextResponse.json({message: 'List not found'}, {status: 404})
    }

    const categorizedItemsIds = (await getListItemsSortedIntoCategories(list));

    if(!categorizedItemsIds){
        return NextResponse.json({message: 'Sort service error'}, {status: 502})
    }

    const categorizedItems = categorizedItemsIds?.map((item) => {
        const originalItem = list.items.find((i) => i._id === item.itemId);
        const originalCategory = list.categories.find(c => c.id === item.categoryId)
        return {
            item: originalItem,
            category: originalCategory
        }
    });

    categorizedItems.sort((a,b) => (a.category?.position ?? 0) < (b.category?.position ?? 0)  ? -1 : ((a.category?.position ?? 0) > (b.category?.position ?? 0) ? 1 : 0))

}
