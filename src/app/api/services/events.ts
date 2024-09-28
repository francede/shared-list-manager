export type CheckEvent = SLEvent & {
    index: number
}

export type DeleteEvent = SLEvent & {
    index: number
}

export type AddEvent = SLEvent & {
    value: number
}

export type ClearEvent = SLEvent & {
    
}

export type MetadataEvent = SLEvent & {
    //TODO
}

export type MoveEvent = SLEvent & {
    //TODO
}

export type SLEvent = {
    type: "CHECK" | "DELETE" | "ADD" | "CLEAR" | "MOVE" | "METADATA"
    updatedElements: {
        name: string
        checked: boolean
    }[]
}