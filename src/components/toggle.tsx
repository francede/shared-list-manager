"use client"

import styles from './toggle.module.css'
import React from 'react';

export default function Toggle(props: ToggleProps){

    const getThumbContainerClassName = () => {
        const s = [styles["thumb-container"]]
        props.toggled && s.push(styles["toggled"])
        return s.join(" ")
    }

    return (
        <div className={styles["toggle"]} onClick={() => {props.onToggle()}}>
            <div className={getThumbContainerClassName()}> 
                <div className={styles["thumb"]}>
                    <div className='material-symbols-outlined'>{props.iconOff}</div>
                    <div className='material-symbols-outlined'>{props.iconOn}</div>
                </div>
            </div>
        </div>
        
    );
}


export type ToggleProps = {
    toggled: boolean
    onToggle: () => void
    iconOn: string
    iconOff: string
}