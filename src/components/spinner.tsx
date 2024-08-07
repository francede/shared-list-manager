"use client"

import { ReactNode} from 'react'
import styles from './spinner.module.css'
import React from 'react';

export default class Spinner extends React.Component{
    constructor(props: any){
        super(props);
        this.state = {list: null, indexToDelete: null, saved: true, input: ''};
    }

    render(): ReactNode {
        return (
            <div className={styles['container']}>
                <div></div>
            </div>
        );
    }
}