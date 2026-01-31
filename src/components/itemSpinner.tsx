"use client"

import styles from './itemSpinner.module.css'
import React from 'react';

export default function ItemSpinner(props: ItemSpinnerProps){

    const getContainerStyles = () => {
        const s = [styles["container"]];
        return s.join(" ")
    }

    const getSpinnerStyles = () => {
        const s = [styles["spinner"]];
        if(props.spinningState === "loaded" || props.spinningState === "none") s.push(styles['invisible']);
        return s.join(" ")
    }

    const getCheckmarkStyles = () => {
        const s = [styles["icon"], "material-symbols-outlined"]
        if(props.spinningState === "loading" || props.spinningState === "none") s.push(styles['invisible']);
        return s.join(" ")
    }

    const getNoneIconStyles = () => {
        const s = [styles["icon"], "material-symbols-outlined"]
        if(props.spinningState === "loading" || props.spinningState === "loaded") s.push(styles['invisible']);
        return s.join(" ")
    }

    return (
        <div className={getContainerStyles()}>
            <div className={getSpinnerStyles()}>
                <div></div>
            </div>
            <div className={styles["icon-container"]}>
                <div className={getCheckmarkStyles()}>check</div>
            </div>
            <div className={styles["icon-container"]}>
                <div className={getNoneIconStyles()}>{props.noneIcon ?? ""}</div>
            </div>
            
        </div>
        
    );

}

export type ItemSpinnerState = "loading" | "loaded" | "none"

export type ItemSpinnerProps = {
    spinningState: ItemSpinnerState
    noneIcon?: string
}