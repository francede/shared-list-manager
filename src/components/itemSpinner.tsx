"use client"

import styles from './itemSpinner.module.css'
import React, { useState } from 'react';

export default function ItemSpinner(props: ItemSpinnerProps){

    const getContainerStyles = () => {
        const s = [styles["container"]];
        return s.join(" ")
    }

    const getSpinnerStyles = () => {
        const s = [styles["spinner"]];
        if(props.spinningState === "done" || props.spinningState === "gone") s.push(styles['invisible']);
        return s.join(" ")
    }

    const getCheckmarkStyles = () => {
        const s = [styles["checkmark"], "material-symbols-outlined"]
        if(props.spinningState === "spinning" || props.spinningState === "gone") s.push(styles['invisible']);
        return s.join(" ")
    }

    return (
        <div className={getContainerStyles()}>
            <div className={getSpinnerStyles()}>
                <div></div>
            </div>
            <div className={styles["checkmark-container"]}>
                <div className={getCheckmarkStyles()}>check</div>
            </div>
            
        </div>
        
    );

}

export type ItemSpinnerProps = {
    spinningState: "spinning" | "done" | "gone"
}