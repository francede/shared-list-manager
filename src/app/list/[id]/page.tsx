"use client"

import { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import '@/app/globalicons.css'
import React from 'react';
import Spinner from '@/components/spinner'
import Dialog from '@/components/dialog'
import { useRouter } from 'next/navigation'
import utils from '@/utils/validationUtils'
import { useSession } from 'next-auth/react'
import { useSharedList } from '@/components/hooks/useSharedList'
import { SharedListItem, UpdateMetadataRequestBody } from '@/app/api/services/sharedListRepository';

export default function Lists(props: Props){
    const router = useRouter();
    const session = useSession();
    const {list, deleteItem, checkItem, deleteList, loadingItemIds, updateListMetadata, deletingList} = useSharedList(props.params.id);
    const [itemIdToDelete, setItemIdToDelete] = useState<string | null>(null);
    const [input, setInput] = useState<string>('');
    const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
    const [editListDialogOpen, setEditListDialogOpen] = useState<boolean>(false);
    const [aboutToDelete, setAboutToDelete] = useState<boolean>(false);
    const [nameInput, setNameInput] = useState<string>('');
    const [viewersInputList, setViewerInputList] = useState<string[] | null>(null);
    const [newViewerInput, setNewViewerInput] = useState<string>('');

    let saveMetaData = () => {
        const body: UpdateMetadataRequestBody = {};
        if(nameInput) {
            body.name = nameInput
        }
        if(viewersInputList !== null){
            body.viewers = viewersInputList
        }

        updateListMetadata(body, () => {
            router.replace('/lists');
        })
    }

    let deleteListWithConfirmation = () => {
        if(!aboutToDelete){
            setAboutToDelete(true);
            return;
        }

        deleteList(() => {
            router.replace('/lists');
        })
    }

    let clickElement = (item: SharedListItem) => {
        if(item.checked){
            if(item._id === itemIdToDelete){
                deleteItem(item._id)
                setItemIdToDelete(null);
            }else{
                setItemIdToDelete(item._id);
                return
            }
        }else{
            checkItem(item._id);
        }
    };
    
    let getElementClassName = (item: SharedListItem) => {
        const s = [styles["list-item"]];
        if(item.checked) s.push(styles['checked']);
        if(item._id === itemIdToDelete) s.push(styles['to-delete']);
        return s.join(" ")
    }

    let getSavedText = () => {
        return (<div className={styles['list-saved']}>{loadingItemIds.length === 0 ? 
            <span>"all changes saved"</span> : 
            <span>"saving..."<span className="material-symbols-outlined">done</span></span>
        }</div>);
    }

    let addNewViewer = () => {
        if(!utils.isValidEmail(newViewerInput) || viewersInputList === null) return;
        setViewerInputList([...viewersInputList, newViewerInput]);
        setNewViewerInput('');
    }

    let getSpinner = () => {
        if(deletingList){
            return <div className={styles['spinner-container']}>Deleting &quot;{list?.name}&quot;<Spinner></Spinner></div>
        }
    }

    let openEditListDialog = () => {
        setEditListDialogOpen(true);
        setNameInput('');
        setViewerInputList(list?.viewers || []);
    }

    let closeEditListDialog = () => {
        if(deletingList) return;
        setEditListDialogOpen(false);
    }

    return (
        <div className={styles['list-page']}>
            {editListDialogOpen ? 
            <Dialog title='Edit List' close={() => {closeEditListDialog()}}>
                <div className={styles['dialog-container']}>
                        <div className={styles['input-container']}>
                            <div  className={styles['input-row']}>
                                name: <input placeholder={list?.name} onChange={(e) => setNewName(e.target.value)}></input>
                            </div>
                            <div className={styles['input-row']}>
                                viewers:
                                <div className={styles['add-viewers-container']}>
                                    <input placeholder='email' value={newViewerInput} onChange={(e) => {setNewViewerInput(e.target.value)}} onKeyDown={(e) => {if(e.code === 'Enter') addNewViewer()}}></input>
                                    <button className="material-symbols-outlined" disabled={!utils.isValidEmail(newViewerInput)} onClick={() => {addNewViewer()}}>add</button>
                                </div>
                            </div>
                            {
                            newViewers.map((v, i) => 
                                <div key={i} className={styles['viewer-row']}>
                                    {v}
                                    <button className="material-symbols-outlined" 
                                    onClick={() => {setNewViewers(newViewers.toSpliced(i, 1))}}>close</button>
                                </div>
                            )}
                        </div>

                        {
                        getSpinner() ||
                        <div className={styles['button-container']}>
                            <div style={{position: 'relative'}}>
                                {aboutToDelete ? <div className={styles['delete-warning']}>Click again to confirm</div> : null}
                                <button className='warning' onClick={() => {deleteList()}} onBlur={() => setAboutToDelete(false)}>Delete List</button>
                            </div>
                            <button className='primary' onClick={() => saveMetaData()}>Save Changes</button>
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
                    <button className={styles['menu-button']} onClick={() => clearChecked()}><span className="material-symbols-outlined">delete_forever</span>Clear checked</button>
                    {list?.owner === session.data?.user?.email ?
                    <button className={styles['menu-button']} onClick={() => openEditListDialog()}><span className="material-symbols-outlined">edit</span>Edit</button>
                    : null}                    
                </div>
            </div>
            {
                list === null ? <div style={{width: 'fit-content', alignSelf: 'center', padding: '20px'}}><Spinner></Spinner></div> : 
                <>
                    <div className={styles['list-title-row']}>
                        <div className={styles['list-title-container']}>
                            <span className={styles['list-title']}>{list?.name}</span>
                            <span className={styles['list-owner']}>created by: {list.owner}</span>
                        </div>
                        {getSavedText()}
                    </div>
                    <div className={styles['list-container']}>
                        {list?.elements?.map((e, i) => 
                            <div key={i} className={getElementClassName(e,i)} onClick={() => clickElement(i)}>
                                <div>{e.name}</div>
                            </div>
                        )}
                    </div>
                    <div  className={styles['input-container']}>
                        <input enterKeyHint='enter' type='text' value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => {if(e.key === 'Enter') createElement()}}></input>
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