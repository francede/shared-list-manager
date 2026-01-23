"use client"

import styles from './spinner.module.css'
import React from 'react';

export default function Spinner(props: any){
    return (
        <div className={styles['container']}>
            <div></div>
        </div>
    );
}