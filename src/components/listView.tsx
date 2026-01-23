"use client"

import styles from './styles.module.scss'


export default function ListView(props: ListViewProps){
    const getItemClassName = (item: ListViewItem) => {
        const s = [styles["list-item"]];
        if(item.checked) s.push(styles['checked']);
        if(item._id === itemIdToDelete) s.push(styles['to-delete']);
        return s.join(" ")
    }

    return(
        <div className={styles['list-container']}>
            {props.list?.map((item, i) => 
                <div key={i} className={getElementClassName(e,i)} onClick={() => props.onClick(item.id)}>
                    <div>{e.name}</div>
                </div>
            )}
        </div>
    )
}

export type ListViewItem = {
    id: string
    text: string
    checked: boolean
    highlighted: boolean
}

export type ListViewProps = {
    list: ListViewItem[]
    onDrag?: (idBefore: string, idAfter: string) => {}
    onClick: (id: string) => {}
}