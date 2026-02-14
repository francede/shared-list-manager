"use client"

import styles from './buttonMenu.module.css'
import React, { useEffect, useRef } from 'react';

export default function ButtonMenu(props: ButtonMenuProps){
    const menuRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!props.open) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && e.target instanceof Node && !menuRef.current.contains(e.target)) {
                props.onClose();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open, props.onClose]);

    const getMenuClassName = () => {
        const s = [styles["menu"]]
        s.push(props.open ? styles['open'] : styles['closed'])
        return s.join(" ")
    }

    return (
        <div className={getMenuClassName()} ref={menuRef}>
            {props.text && <div className={styles["text"]}>{props.text}</div>}
            {props.buttons && 
            <div className={styles["button-container"]}>
                {props.buttons.map((button, i) => {
                    return (
                    <React.Fragment key={i}>
                    {button.href &&
                        <a href={button.href}>
                            {button.icon && <span className="material-symbols-outlined">{button.icon}</span>}
                            {button.text}
                        </a>
                    }
                    {!button.href && button.onClick &&
                        <button onClick={() => {button.onClick && button.onClick(); props.onClose()}}>
                            {button.icon && <span className="material-symbols-outlined">{button.icon}</span>}
                            {button.text}
                        </button>
                    }
                    {props.buttons && i < props.buttons.length - 1 && <div className={styles["button-divider"]}/>}
                    </React.Fragment>
                    )
                })}     
            </div>}       
        </div>
    );

}

export type ButtonMenuProps = {
    open: boolean
    text?: string
    buttons?: {
        text: string
        icon?: string
        onClick?: () => void
        href?: string
    }[]
    onClose: () => void
}