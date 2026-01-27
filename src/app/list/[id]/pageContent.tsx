"use client"

import { useMemo, useState } from 'react'
import styles from './styles.module.scss'
import '@/app/globalicons.css'
import React from 'react';
import Spinner from '@/components/spinner'
import Dialog from '@/components/dialog'
import { useRouter } from 'next/navigation'
import utils from '@/utils/validationUtils'
import { useSession } from 'next-auth/react'
import { useSharedList } from '@/components/hooks/useSharedList'
import { UpdateMetadataRequestBody } from '@/app/api/services/sharedListRepository';
import ListView, { ListViewItem } from '@/components/listView/listView';
import { useSharedListWithLoadingStatus } from '@/components/hooks/useSharedListLoadingItems';

export default function ListsContent(props: Props){
    const router = useRouter();
    const session = useSession();
    const {list, addItem, editItem, deleteItem, checkItem, moveItem, deleteList, loadingItemIds, updateListMetadata, deletingList, clearChecked} = useSharedList(props.params.id);
    const listItemsWithLoadingStatus = useSharedListWithLoadingStatus(list?.items ?? [], loadingItemIds)
    const [itemIdToDelete, setItemIdToDelete] = useState<string | null>(null);
    const [newItemInput, setNewItemInput] = useState<string>('');
    const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
    const [editListMetadataDialogOpen, setEditListMetadataDialogOpen] = useState<boolean>(false);
    const [listNameInput, setListNameInput] = useState<string>('');
    const [viewersInputList, setViewerInputList] = useState<string[] | null>(null);
    const [newViewerInput, setNewViewerInput] = useState<string>('');

    const saveMetaData = () => {
        const body: UpdateMetadataRequestBody = {};
        if(listNameInput) {
            body.name = listNameInput
        }
        if(viewersInputList !== null){
            body.viewers = viewersInputList
        }

        updateListMetadata(body, () => {
            router.replace('/lists');
        })
    }

    const confirmDeleteList = () => {
        if(!confirm("Are you sure you want to delete this list permanently? This actin cannot be undone.")){
            return;
        }
        deleteList(() => {
            router.replace('/lists');
        })
    }

    const listViewItems = useMemo((): ListViewItem[] => {
        return listItemsWithLoadingStatus?.map((item, i) => {
            return {
                id: item._id,
                text: item.text,
                checked: item.checked,
                loadingState: item.status
            }
        })
    }, [list, listItemsWithLoadingStatus])

    const itemWithIdClicked = (itemId: string) => {
        const item = list?.items?.find((i) => i._id === itemId);
        if(!item) return;

        if(item?.checked){
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

    const itemDragged = (itemId: string, itemIdBefore: string | null) => {
        if(!list?.items) return
        const itemBeforeIndex = list.items.findIndex(i => i._id === itemIdBefore);
        const itemAfterIndex = itemBeforeIndex === undefined ? 0 : 
             (itemBeforeIndex + 1 === list.items.length ? null : itemBeforeIndex + 1)
        const itemAfter = itemAfterIndex === null ? null : list.items[itemAfterIndex]
        moveItem(itemId, itemIdBefore, itemAfter?._id ?? null)
    }

    let getSavedText = () => {
        return (<div className={styles['list-saved']}>{loadingItemIds.length === 0 ? 
            <span>all changes saved</span> : 
            <span>saving...<span className="material-symbols-outlined">check</span></span>
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
        setEditListMetadataDialogOpen(true);
        setListNameInput('');
        setViewerInputList(list?.viewers || []);
    }

    let closeEditListDialog = () => {
        if(deletingList) return;
        setEditListMetadataDialogOpen(false);
    }

    return (
        <div className={styles['list-page']}>
            {editListMetadataDialogOpen ? 
            <Dialog title='Edit List' close={() => {closeEditListDialog()}}>
                <div className={styles['dialog-container']}>
                        <div className={styles['input-container']}>
                            <div  className={styles['input-row']}>
                                name: <input placeholder={list?.name} onChange={(e) => setListNameInput(e.target.value)}></input>
                            </div>
                            <div className={styles['input-row']}>
                                viewers:
                                <div className={styles['add-viewers-container']}>
                                    <input placeholder='email' value={newViewerInput} onChange={(e) => {setNewViewerInput(e.target.value)}} onKeyDown={(e) => {if(e.code === 'Enter') addNewViewer()}}></input>
                                    <button className="material-symbols-outlined" disabled={!utils.isValidEmail(newViewerInput)} onClick={() => {addNewViewer()}}>add</button>
                                </div>
                            </div>
                            {
                            viewersInputList?.map((v, i) => 
                                <div key={i} className={styles['viewer-row']}>
                                    {v}
                                    <button className="material-symbols-outlined" 
                                    onClick={() => {setViewerInputList(viewersInputList.toSpliced(i, 1))}}>close</button>
                                </div>
                            )}
                        </div>

                        {
                        getSpinner() ||
                        <div className={styles['button-container']}>
                            <div style={{position: 'relative'}}>
                                <button className='warning' onClick={() => {confirmDeleteList()}}>Delete List</button>
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
                    <button className={styles['menu-button']}
                        onClick={() => clearChecked()}>
                            <span className="material-symbols-outlined">delete_forever</span>
                            Clear checked
                        </button>
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
                    <ListView 
                        list={listViewItems}
                        onClick={(itemId) => itemWithIdClicked(itemId)}
                        onDelete={(itemId) => {deleteItem(itemId)}}
                        onEdit={(itemId, text) => {editItem(itemId, text)}}
                        onDrag={(itemId, itemIdBefore) => {itemDragged(itemId, itemIdBefore)}}
                    ></ListView>
                    <div  className={styles['input-container']}>
                        <input enterKeyHint='enter'
                            type='text'
                            value={newItemInput}
                            onChange={(e) => setNewItemInput(e.target.value)}
                            onKeyDown={(e) => {if(e.key === 'Enter') addItem(newItemInput)}}></input>
                        <button disabled={newItemInput.length === 0} onClick={() => addItem(newItemInput)}>+</button>
                    </div>
                </>
            }
        </div>
    )
}

interface Props{
    params: {id: string}
}