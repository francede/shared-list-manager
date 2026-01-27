"use client"

import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import styles from './listView.module.css'
import React from 'react';
import ItemSpinner, { ItemSpinnerState } from '../itemSpinner';


export default function ListView(props: ListViewProps){
    const [contextMenuIndex, setContextMenuIndex] = useState<number | null>(null);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editInput, setEditInput] = useState<string>("");
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragPosition, setDragPosition] = useState<{x: number, y:number}>({x:0,y:0})
    const draggedIndexRef = useRef<number | null>(null);
    const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
    const insertionIndexRef = useRef<number | null>(null);
    const itemRefs = useRef<(HTMLElement | null)[]>([]);
    const containerRef = useRef<(HTMLDivElement | null)>(null);
    const dragTimeoutRef = useRef<number | null>(null);
    const dragOccurredRef = useRef(false)
    const touchStartPositionRef = useRef<{x: number, y:number, itemIndex: number} | null>(null)

    /* DRAG CONTROLS */
    const startDrag = (index: number, startX: number, startY: number) => {
        setDraggedIndex(index);
        setDragPosition({x: startX, y: startY})
        draggedIndexRef.current = index
        dragTimeoutRef.current = null
        dragOccurredRef.current = true
    }

    const endDrag = () => {
        if(!props.onDrag) return
        if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
            dragTimeoutRef.current = null;
        }

        if(draggedIndexRef.current !== null && insertionIndexRef.current !== null){
            const itemBefore = insertionIndexRef.current === 0 ? null : props.list[insertionIndexRef.current-1]
            props.onDrag(props.list[draggedIndexRef.current].id, itemBefore?.id ?? null)
        }

        setDraggedIndex(null)
        draggedIndexRef.current = null

        setTimeout(() => { //Wait for click event to fire
            dragOccurredRef.current = false;
        }, 0);
    }

    const updateDrag = (newX: number, newY: number) => {
        if(!props.onDrag || !itemRefs.current) return
        if(draggedIndexRef.current === null) return

        setDragPosition({x: newX, y: newY})

        for(let i = 0; i < itemRefs.current.length; i++){
            const rect = itemRefs.current[i]?.getBoundingClientRect();
            if(!rect) continue

            const midY = rect?.top + rect?.height / 2
            if (newY < midY){
                if (i === draggedIndexRef.current || i === draggedIndexRef.current + 1) {
                    setInsertionIndex(null);
                    insertionIndexRef.current = null;
                    return;
                }
                setInsertionIndex(i)
                insertionIndexRef.current = i;
                return
            }
        }

        if (draggedIndexRef.current !== itemRefs.current.length - 1) {
            setInsertionIndex(itemRefs.current.length);
            insertionIndexRef.current = itemRefs.current.length;
        }
    }

    /* CONTEXT MENU CONTROLS */
    const handleContextMenu = (event: React.MouseEvent, index: number) => {
        event.preventDefault()
        openContextMenu(index);
    }

    const closeContextMenu = () => {
        setContextMenuIndex(null)
    }

    const openContextMenu = (index: number) => {
        setContextMenuIndex(index);
    }

    const getContextButtons = (item: ListViewItem, index: number) => {
        const contextButtons: ListViewContextMenuButton[] = []
        if(props.onEdit){
            contextButtons.push({icon: "edit", onClick: () => {
                setEditIndex(index);
                setEditInput(item.text)
            }})
        }

        if(props.onDelete){
            contextButtons.push({icon: "delete", onClick: () => {
                props.onDelete && props.onDelete(item.id)
            }})
        }

        if(props.onUndo){
            contextButtons.push({icon: "undo", onClick: () => {
                props.onUndo && props.onUndo(item.id)
            }})
        }
        
        return contextButtons
    }

    /* EDIT CONTROLS */
    const saveEdit = () => {
        if(editIndex === null || !props.onEdit) return
        props.onEdit(props.list[editIndex].id, editInput);
        setEditIndex(null);
        setEditInput("");
    }

    /* INPUT EVENTS */
    const handlePointerMove = (e: React.PointerEvent) => {
        if(e.pointerType === "mouse"){  
            updateDrag(e.clientX, e.clientY);
        }else{
            if (!touchStartPositionRef.current) return;
            e.preventDefault();
            if(draggedIndexRef.current !== null){
                updateDrag(e.clientX, e.clientY)
                return
            }
            const DRAG_TOLERANCE = 10 //px
            const dx = e.clientX - touchStartPositionRef.current.x
            const dy = e.clientY - touchStartPositionRef.current.y
            const distance = Math.hypot(dx, dy);
            if(distance > DRAG_TOLERANCE){
                startDrag(touchStartPositionRef.current.itemIndex, e.clientX, e.clientY);
                closeContextMenu();
            }
        }
    }

    const handlePointerDown = (e: React.PointerEvent, index: number) => {
        if(!props.onDrag || e.button !== 0 || editIndex) return
        if((e.target as HTMLElement).closest('button, input, textarea, select, [contenteditable="true"]')){
            return
        }
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        if(e.pointerType === "mouse"){
            dragTimeoutRef.current = window.setTimeout(() => {
                startDrag(index, e.clientX, e.clientY)
            }, 100);
        }else{
            touchStartPositionRef.current = {
                x: e.clientX,
                y: e.clientY,
                itemIndex: index
            }
            dragTimeoutRef.current = window.setTimeout(() => {
                if(draggedIndexRef.current !== null) return
                openContextMenu(index)
            }, 350);
        }
    }

    const handlePointerUp = (e: React.PointerEvent) => {
        e.preventDefault()
        const target = e.currentTarget as HTMLElement
        target.releasePointerCapture(e.pointerId)
        touchStartPositionRef.current = null
        endDrag();
    }

    const handleClick = (itemId: string) => {
        if(dragOccurredRef.current) return
        endDrag();
        if(editIndex !== null) return
        props.onClick(itemId)
        closeContextMenu();
    }
 
    /* CSS CLASS NAMES AND STYLES*/
    const getItemClassName = (item: ListViewItem, index: number) => {
        if(editIndex === index){
            return getEditedClassName()
        }
        const s = [styles["list-item"]];
        if(item.checked) s.push(styles['checked']);
        if(item.highlight) s.push(styles['highlight']);
        return s.join(" ")
    }

    const getEditedClassName = () => {
        const s = [styles["list-item"], styles["edited"]];
        return s.join(" ")
    }

    const getContextMenuClassName = (index: number) => {
        const s = [styles['context-menu-container']];
        if(contextMenuIndex !== index) s.push(styles['closed']);
        return s.join(" ")
    }

    const getDragPlaceholderClassName = () => {
        return [styles["placeholder"], styles['list-item']].join(" ")
    }

    const getDraggedItemStyles = (index: number) => {
        if(draggedIndexRef.current !== index) return
        const itemHeight = itemRefs.current[draggedIndexRef.current]?.getBoundingClientRect().height
        const itemWidth = itemRefs.current[draggedIndexRef.current]?.getBoundingClientRect().width
        const styles: CSSProperties = {
            position: "fixed",
            top: itemHeight ? dragPosition.y - itemHeight / 2 : 0,
            left: itemWidth ? dragPosition.x - itemWidth / 2 : 0,
            zIndex: 1000,
            pointerEvents: "none",
            cursor: "grabbing"
        }
        return styles;
    }

    return(
        <div className={styles['list-container']} ref={containerRef}>
            {props.list?.map((item, i) => 
                <React.Fragment key={i}>
                {insertionIndex === i && draggedIndex !== null && (
                    <div className={styles['drag-divider']}></div>
                )}

                <div ref={e => {itemRefs.current[i] = e}}>
                    {draggedIndex === i &&
                        <div key={"placeholder"} ref={e => {itemRefs.current[i] = e}} className={getDragPlaceholderClassName()}>
                            <div className={styles['item-text']}>{item.text}</div>
                        </div>
                    }

                    <div key={i} 
                        ref={(e: HTMLElement | null) => {itemRefs.current[i] = e}} 
                        className={getItemClassName(item,i)}
                        style={getDraggedItemStyles(i)}
                        onClick={() => handleClick(item.id)} 
                        onPointerDown={(e) => {handlePointerDown(e,i)}}
                        onPointerMove={(e) => {handlePointerMove(e)}}
                        onPointerUp={(e) => {handlePointerUp(e)}}
                        onContextMenu={(e) => {handleContextMenu(e,i)}}>

                        {editIndex === i ? 
                            <>
                                <input value={editInput} onChange={e => {setEditInput(e.target.value)}}></input>
                                <button className="material-symbols-outlined" onClick={() => saveEdit()}>save</button>
                            </>
                        :
                            <div className={styles['item-text']}>{item.text}</div>
                        }
                        <ItemSpinner spinningState={item.loadingState}></ItemSpinner>
                        <ListViewContextMenu className={getContextMenuClassName(i)} contextButtons={getContextButtons(item, i)} onOutsideClick={() => {contextMenuIndex === i ? closeContextMenu() : null}}></ListViewContextMenu>
                    </div>
                </div>

                </React.Fragment>
            )}

            {insertionIndex === itemRefs.current.length && draggedIndex !== null && (
                <div className={styles['drag-divider']}></div>
            )}
        </div>
    )
}

export type ListViewItem = {
    id: string
    text: string
    checked: boolean
    highlight?: boolean,
    loadingState: ItemSpinnerState
}

export type ListViewContextMenuButton = {
    icon: string
    onClick: () => void
}

export type ListViewProps = {
    list: ListViewItem[]
    onDrag?: (itemId: string, itemIdBefore: string | null) => void
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

    const handleClick = (e: React.MouseEvent, button: ListViewContextMenuButton) => {
        e.preventDefault();
        e.stopPropagation()
        button.onClick();
        props.onOutsideClick()
    }

    return (
        <div className={getContextMenuClassNames()} ref={menuRef}>
            {props.contextButtons?.map((button, i) => 
                <button key={i} onClick={(e) => {handleClick(e, button)}} onPointerDown={e => e.stopPropagation()}>
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

export function LinkListView(props: LinkListViewProps){
    return(
        <div className={styles['list-container']}>
            {props.list?.map((item, i) => 
                <a key={i} className={styles["list-item"]} href={item.href}>
                    <div className={styles["item-text"]}>{item.text}</div>
                </a>
            )}
        </div>
    )
}

export type LinkListViewItem = {
    text: string
    href: string
}

export type LinkListViewProps = {
    list: LinkListViewItem[]
}