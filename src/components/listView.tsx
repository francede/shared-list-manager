"use client"

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './listView.module.css'


export default function ListView(props: ListViewProps){
    const [contextMenuIndex, setContextMenuIndex] = useState<number | null>();

    const closeContextMenu = () => {
        setContextMenuIndex(null)
    }

    const openContextMenu = (event: React.MouseEvent, index: number) => {
        event.preventDefault()
        setContextMenuIndex(index);
    }

    const getContextButtons = (item: ListViewItem) => {
        const contextButtons: ListViewContextMenuButton[] = []
        if(props.onEdit){
            contextButtons.push({icon: "edit", onClick: () => {
                alert(`edit id:${item.id} = ${item.text}`)
            }})
        }

        if(props.onDelete){
            contextButtons.push({icon: "delete", onClick: () => {
                alert(`delete id:${item.id} = ${item.text}`)
            }})
        }

        if(props.onUndo){
            contextButtons.push({icon: "undo", onClick: () => {
                alert(`undo id:${item.id} = ${item.text}`)
            }})
        }
        
        return contextButtons

    }

    const getItemClassName = (item: ListViewItem) => {
        const s = [styles["list-item"]];
        if(item.checked) s.push(styles['checked']);
        if(item.highlight) s.push(styles['highlight']);
        return s.join(" ")
    }

    const getContextMenuClassName = (index: number) => {
        const s = [styles['context-menu-container']];
        if(contextMenuIndex !== index) s.push(styles['closed']);
        return s.join(" ")
    }

    return(
        <div className={styles['list-container']}>
            {props.list?.map((item, i) => 
                <div key={i} className={getItemClassName(item)} onClick={() => props.onClick(item.id)} onContextMenu={(e) => {openContextMenu(e, i)}}>
                    <div className={styles['item-text']}>{item.text}</div>
                    <ListViewContextMenu className={getContextMenuClassName(i)} contextButtons={getContextButtons(item)} onOutsideClick={() => {contextMenuIndex === i ? closeContextMenu() : null}}></ListViewContextMenu>
                </div>
            )}
        </div>
    )
}

export type ListViewItem = {
    id: string
    text: string
    checked: boolean
    highlight?: boolean
}

export type ListViewContextMenuButton = {
    icon: string
    onClick: () => void
}

export type ListViewProps = {
    list: ListViewItem[]
    onDrag?: (idBefore: string, idAfter: string) => {}
    onClick: (itemId: string) => void
    onEdit?: (itemId: string, text: string) => void
    onDelete?: (itemId: string) => void
    onUndo?: (itemId: string) => void
}

export function ListViewContextMenu(props: ListViewContextMenuProps){
    const menuRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
            props.onOutsideClick();
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)

        return () => {document.removeEventListener('mousedown', handleClickOutside);}
    }, [props.onOutsideClick])

    const getContextMenuClassNames = () => {
        const s = [styles['context-menu']];
        if(props.className) s.push(props.className)
        return s.join(" ")
    }

    return (
        <div className={getContextMenuClassNames()} ref={menuRef}>
            {props.contextButtons?.map((button, i) => 
                <button key={i} onClick={() => {button.onClick()}}>
                    <div className="material-symbols-outlined">{button.icon}</div>
                </button>
            )}
        </div>
    );
}

export type ListViewContextMenuProps = {
    contextButtons: ListViewContextMenuButton[]
    onOutsideClick: () => void
    className?: string
}