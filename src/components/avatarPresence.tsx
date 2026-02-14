"use client"

import { Avatar } from "./providers/SettingsProvider"
import styles from './avatarPresence.module.css'
import ButtonMenu from "./buttonMenu"
import { useState } from "react"
import { text } from "stream/consumers"

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
                        {a.text &&
                            <ButtonMenu open={i === avatarOpenIndex} text={a.text} onClose={() => setAvatarOpenIndex(null)}></ButtonMenu>
                        }
                    </div>
                </div>
            )}
        </div>
    )
}


export type AvatarPresenceProps = {
    avatars: ({avatar: Avatar, text?: string})[]
}