"use client"

import { ReactNode} from 'react'
import styles from './dialog.module.css'
import React from 'react';

export default class Dialog extends React.Component<Props>{
    constructor(props: Props){
        super(props);
    }

    render(): ReactNode {
        return (
            <>
                <div className={styles['background']} onClick={() => this.props.close()}></div>
                <div className={styles['dialog']}>
                    <div>
                        <span>{this.props.title}</span>
                        <button className={["material-symbols-outlined", styles['close-button']].join(" ")} 
                            onClick={() => this.props.close()}>close</button>
                    </div>
                    <div>
                        {this.props.children}
                    </div>
                    
                </div>
            </>
        );
    }
}

interface Props{
    close: () => void
    children: any
    title: string
}