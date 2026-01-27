"use client"

import { DynamicListChannelProvider } from '@/components/providers/DynamicListChannelProvider';
import ListsContent from './pageContent';

export default function Lists(props: Props){
    return(
        <DynamicListChannelProvider listId={props.params.id}>
            <ListsContent params={props.params}></ListsContent>
        </DynamicListChannelProvider>
    )
}

interface Props{
    params: {id: string}
}