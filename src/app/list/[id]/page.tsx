"use client"

import { SharedListResponse } from '@/services/sharedListRepository'
import { ReactNode, createRef, useEffect, useRef, useState } from 'react'
import styles from './styles.module.css'
import '@/app/globalicons.css'
import React from 'react';
import Spinner from '@/components/spinner'
import Dialog from '@/components/dialog'
import { useRouter } from 'next/navigation'

export default function Lists(props: Props){
    const router = useRouter();
    const [list, setList] = useState<SharedListResponse | null>(null);
    const [indexToDelete, setIndexToDelete] = useState<number | null>(null);
    const [saved, setSaved] = useState<boolean>(true);
    const [input, setInput] = useState<string>('');
    const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
    const [editListDialogOpen, setEditListDialogOpen] = useState<boolean>(false);
    const [aboutToDelete, setAboutToDelete] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);

    useEffect(() => {
        fetch("/api/list/" + props.params.id)
        .then((res) => res.json()).catch((e) => {console.log("error", e)})
        .then((data: SharedListResponse) => {
            setList(data)
        }).catch((e) => {console.log("error", e)})}, []
    )

    let saveList = () => {
        setSaved(false);
        console.log("saving ", list)
        fetch("/api/list/" + props.params.id, {
            method: "PUT",
            body: JSON.stringify(list)
        })
        .then((res) => res.json())
        .then((data) => {
            //TODO: change to check response
            setSaved(true)
        });
    }

    let deleteList = () => {
        if(!aboutToDelete){
            setAboutToDelete(true);
            return;
        }
        setDeleting(true);

        fetch("/api/list/" + props.params.id, {
            method: "DELETE",
        })
        .then((res) => res.json())
        .then((data) => {
            router.replace('/lists');
        });
    }

    let openEditListDialog = () => {
        setEditListDialogOpen(true);
    }

    let closeEditListDialog = () => {
        if(deleting) return;
        setEditListDialogOpen(false);
    }

    let clearChecked = () => {
        let elements = [...list!.elements];
        elements = elements.filter((e) => !e.checked);
        if(elements.length === list?.elements.length) return;

        let newList = list;
        list!.elements = elements;

        setList(newList);
        saveList();
    }

    let clickElement = (i: number) => {
        let elements = [...list!.elements];
        if(elements[i].checked){
            if(i === indexToDelete){
                elements.splice(i, 1);
                setIndexToDelete(null);
            }else{
                setIndexToDelete(i);
                return
            }
        }else{
            elements[i].checked = true;
        }
        let newList = list;
        list!.elements = elements;
        setList(newList);
        saveList();
    };

    let createElement = () => {
        if(!input) return;
        let elements = [...list!.elements, {name: input, checked: false}]
        let newList = list;
        newList!.elements = elements;
        setList(newList);
        setInput('');
        saveList();
    }
    
    let getElementClassName = (e: {name: string, checked: boolean}, i: number) => {
        const s = [styles["list-item"]];
        if(e.checked) s.push(styles['checked']);
        if(i === indexToDelete) s.push(styles['to-delete']);
        return s.join(" ")
    }

    let getSavedText = () => {
        if(saved){
            return (<><span>saved</span><span className="material-symbols-outlined">done</span></>);
        }
        return <span>saving...</span>;
    }
    
    return (
        <div className={styles['list-page']}>
            {editListDialogOpen ? 
            <Dialog title='Edit List' close={() => {closeEditListDialog()}}>
                <div style={{display: 'flex', flexDirection: 'column', gap: '18px', padding: '12px'}}>
                    <div>
                        name: <input placeholder={list?.name}></input>
                    </div>
                    {
                        deleting ? <div className={styles['deleting-spinner-container']}>Deleting<Spinner></Spinner></div> :
                        <div className={styles['button-container']}>
                        
                            <div style={{position: 'relative'}}>
                                {aboutToDelete ? <div className={styles['delete-warning']}>Click again to confirm</div> : null}
                                <button className='warning' onClick={() => {deleteList()}} onBlur={() => setAboutToDelete(false)}>Delete List</button>
                            </div>
                            <button onClick={() => {alert(list?._id)}}>Save</button>
                        </div>
                    }
                </div>
            </Dialog> : ''}
            
            <div  className={styles['top-bar']}>
                <a className="material-symbols-outlined" href='/lists'>arrow_back</a>
                <button 
                    className="material-symbols-outlined" 
                    onClick={() => setSettingsOpen(true)}
                    onBlur={() => setSettingsOpen(false)}>settings</button>

                <div className={settingsOpen ? styles['open'] : styles['closed']}>
                    <button className={styles['menu-button']} onClick={() => clearChecked()}><span className="material-symbols-outlined">delete_forever</span>Clear Checked</button>
                    <button className={styles['menu-button']} onClick={() => openEditListDialog()}><span className="material-symbols-outlined">edit</span>Edit</button>
                    <button className={styles['menu-button']} disabled><span className="material-symbols-outlined">undo</span>Undo</button>
                    
                </div>
            </div>
            {
                list === null ? <div style={{width: 'fit-content', alignSelf: 'center', padding: '20px'}}><Spinner></Spinner></div> : 
                <>
                    <div className={styles['list-title']}>
                        {list?.name}
                        <div>{getSavedText()}</div>
                    </div>
                    <div className={styles['list-container']}>
                        {list?.elements.map((e, i) => 
                            <div key={i} className={getElementClassName(e,i)} onClick={() => clickElement(i)}>
                                <span>{e.name}</span>
                            </div>
                        )}
                    </div>
                    <div  className={styles['input-container']}>
                        <input type='text' value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => {if(e.code === 'Enter') createElement()}}></input>
                        <button disabled={input.length === 0} onClick={() => createElement()}>+</button>
                    </div>
                </>
            }
            
        </div>
    )
    

    
}

interface Props{
    params: {id: string}
}