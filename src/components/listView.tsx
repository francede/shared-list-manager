"use client"

import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import styles from './listView.module.css'


export default function ListView(props: ListViewProps){
    const [contextMenuIndex, setContextMenuIndex] = useState<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragPosition, setDragPosition] = useState<{x: number, y:number}>({x:0,y:0})
    const draggedIndexRef = useRef<number | null>(null);
    const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
    const insertionIndexRef = useRef<number | null>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const containerRef = useRef<(HTMLDivElement | null)>(null);
    const dragTimeoutRef = useRef<number | null>(null);
    const dragOccurredRef = useRef(false)

    useEffect(() => {
        if(draggedIndex === null) return
        if(!props.onDrag) return
        const doc = containerRef.current?.ownerDocument.defaultView!
        doc.addEventListener("mousemove", handleMouseMove)
        doc.addEventListener("mouseup", handleMouseUp)

        return () => {
            doc.removeEventListener("mousemove", handleMouseMove)
            doc.removeEventListener("mouseup", handleMouseUp)
        }
    }, [draggedIndex])

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

    const handleMouseMove = (e: MouseEvent) => {
        if(!props.onDrag) return
        if(draggedIndexRef.current === null) return

        setDragPosition({x: e.clientX, y: e.clientY})

        for(let i = 0; i < itemRefs.current.length; i++){
            const rect = itemRefs.current[i]?.getBoundingClientRect();
            if(!rect) continue
            const midY = rect?.top + rect?.height / 2
            if (e.clientY < midY){

                if (i === draggedIndexRef.current || i === draggedIndexRef.current! + 1) {
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

    const handleMouseDown = (e: React.MouseEvent, index: number) => {
        if(!props.onDrag) return
        e.preventDefault()
        dragTimeoutRef.current = window.setTimeout(() => {
            setDraggedIndex(index);
            draggedIndexRef.current = index
            dragTimeoutRef.current = null
            dragOccurredRef.current = true
        }, 250);
    }

    const handleMouseUp = (e: MouseEvent) => {
        if(!props.onDrag) return
        e.preventDefault()
        if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
            dragTimeoutRef.current = null;
        }

        if(draggedIndexRef.current !== null && insertionIndexRef.current !== null){
            
            props.onDrag(props.list[draggedIndexRef.current].id, insertionIndexRef.current)
        }

        setDraggedIndex(null)
        draggedIndexRef.current = null

        setTimeout(() => { //Wait for click event to fire
            dragOccurredRef.current = false;
        }, 0);
    }

    const handleClick = (itemId: string) => {
        if(dragOccurredRef.current) return
        if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
            dragTimeoutRef.current = null;
        }
        props.onClick(itemId)
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

    const getDragPlaceholderStyle = (): CSSProperties => {
        return {
            backgroundColor: "transparent",
            border: "1px dashed #00BFFF",
            background: "#00BFFF17",
            cursor: "default",
            pointerEvents: "none"
        }
    }

    const getDraggedItemStyles = () => {
        if(draggedIndexRef.current === null) return
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
                <>
                {insertionIndex === i && draggedIndex !== null && (
                    <div className={styles['drag-divider']}></div>
                )}
                {draggedIndex === i ?
                    (<>
                    <div key={i} ref={e => {itemRefs.current[i] = e}} className={styles['list-item']} style={getDragPlaceholderStyle()} onClick={() => props.onClick(item.id)} onContextMenu={(e) => {openContextMenu(e, i)}}>
                        <div className={styles['item-text']}>{item.text}</div>
                    </div>
                    <div key={i} ref={e => {itemRefs.current[i] = e}} className={getItemClassName(item)} style={getDraggedItemStyles()} onMouseDown={(e) => {handleMouseDown(e,i)}}>
                        <div className={styles['item-text']}>{item.text}</div>
                    </div>
                    </>)
                : 
                    <div key={i} ref={e => {itemRefs.current[i] = e}} className={getItemClassName(item)} onClick={() => handleClick(item.id)} onMouseDown={(e) => {handleMouseDown(e,i)}} onContextMenu={(e) => {openContextMenu(e, i)}}>
                        <div className={styles['item-text']}>{item.text}</div>
                        <ListViewContextMenu className={getContextMenuClassName(i)} contextButtons={getContextButtons(item)} onOutsideClick={() => {contextMenuIndex === i ? closeContextMenu() : null}}></ListViewContextMenu>
                    </div>
                }
                </>
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
    highlight?: boolean
}

export type ListViewContextMenuButton = {
    icon: string
    onClick: () => void
}

export type ListViewProps = {
    list: ListViewItem[]
    onDrag?: (itemId: string, newIndex: number) => void
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