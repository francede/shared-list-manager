"use client"

import { Avatar } from "./providers/SettingsProvider"
import styles from './avatarPresence.module.css'
import ButtonMenu from "./buttonMenu"
import { useState } from "react"

export default function AvatarPresence(props: AvatarPresenceProps){
    const [avatarOpenIndex, setAvatarOpenIndex] = useState<number | null>(null)
    if(props.avatars.length === 0) return null

    return (
        <div className={styles["avatar-container"]}>
            {props.avatars.map((a,i) => 
                <div key={i} className={styles["avatar"]} style={{
                    backgroundColor: a.avatar.color,
                    zIndex: props.avatars.length - i}}>
                    {a.avatar.initial}
                    <div onMouseEnter={() => setAvatarOpenIndex(i)} 
                        onMouseLeave={() => setAvatarOpenIndex(null)} 
                        className={styles["tooltip-trigger"]}
                        >
                    </div>
                    <div className={styles["tooltip-container"]}>
                        <ButtonMenu open={i === avatarOpenIndex} text={a.user} onClose={() => setAvatarOpenIndex(null)}></ButtonMenu>
                    </div>
                </div>
            )}
        </div>
    )
}


export type AvatarPresenceProps = {
    avatars: ({avatar: Avatar, user: string})[]
}