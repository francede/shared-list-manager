import { SharedListItem } from "@/app/api/services/sharedListRepository";

const sharedListUtils = {
    calculatePosition: (itemBefore?: SharedListItem, itemAfter?: SharedListItem): number => {
        if(itemAfter && itemBefore) return (itemBefore.position + itemAfter.position) / 2

        if(!itemAfter && itemBefore) return itemBefore.position + 100;

        if(!itemBefore && itemAfter) return itemAfter.position - 100;

        return 0
    }
}

export default sharedListUtils;