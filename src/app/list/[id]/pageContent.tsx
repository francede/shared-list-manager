"use client"

import { useMemo, useState, useTransition } from 'react'
import styles from './styles.module.scss'
import React from 'react';
import Spinner from '@/components/spinner'
import Dialog from '@/components/dialog'
import { useRouter } from 'next/navigation'
import utils from '@/utils/validationUtils'
import { useSession } from 'next-auth/react'
import { useSharedList } from '@/components/hooks/useSharedList'
import { UpdateMetadataRequestBody } from '@/app/api/services/sharedListRepository';
import ListView, { ListViewItem } from '@/components/listView/listView';
import { useTranslation } from '@/components/hooks/useTranslation';
import AvatarPresence from '@/components/avatarPresence';
import ButtonMenu from '@/components/buttonMenu';
import { useUserSettings } from '@/components/hooks/useUserSettings';
import Toggle from '@/components/toggle';

export default function ListsContent(props: Props){
    const router = useRouter();
    const session = useSession();
    const {
        list, 
        listItemsWithStatus,
        loading,
        addItem, 
        editItem, 
        deleteItem,
        checkItem, 
        uncheckItem, 
        moveItem, 
        clearChecked,
        deleteList, 
        updateListMetadata, 
        deletingList, 
        hasPendingOperations,
        presence } = useSharedList(props.params.id);
    const [itemIdToDelete, setItemIdToDelete] = useState<string | null>(null);
    const [newItemInput, setNewItemInput] = useState<string>('');
    const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
    const [editListMetadataDialogOpen, setEditListMetadataDialogOpen] = useState<boolean>(false);
    const [listNameInput, setListNameInput] = useState<string>('');
    const [viewersInputList, setViewerInputList] = useState<string[] | null>(null);
    const [newViewerInput, setNewViewerInput] = useState<string>('');
    const { t } = useTranslation("page.list.");
    const {settings, updateTheme} = useUserSettings();

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
        if(!confirm(t("confirm-delete-prompt"))){
            return;
        }
        deleteList(() => {
            router.replace('/lists');
        })
    }

    const listViewItems = useMemo((): ListViewItem[] => {
        return listItemsWithStatus?.map((item) => {
            return {
                id: item._id,
                text: item.text,
                checked: item.checked,
                loadingState: item.status,
                highlight: item._id === itemIdToDelete,
            }
        }) ?? []
    }, [list, itemIdToDelete, listItemsWithStatus])

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

    const addItemClicked = () => {
        if(newItemInput.length === 0) return
        addItem(newItemInput)
        setNewItemInput("")
    }

    let getSavedText = () => {
        let text = <><span>{t("all-changes-saved")}</span><span className="material-symbols-outlined">check</span></>
        if(hasPendingOperations){
            text = <span>{t("saving-changes")}</span>
        }
        if(loading){
            text = <span>{t("reloading-list")}</span>
        }
        return (<div className={styles['list-saved-text']}>{text}</div>);
    }

    let addNewViewer = () => {
        if(!utils.isValidEmail(newViewerInput) || viewersInputList === null) return;
        setViewerInputList([...viewersInputList, newViewerInput]);
        setNewViewerInput('');
    }

    let getSpinner = () => {
        if(deletingList){
            return <div className={styles['spinner-container']}>{t("deleting-list", {name: list?.name ?? "undefined"})}<Spinner></Spinner></div>
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

    const getSettingsMenuButtons = () => {
        const buttons = [{text: t("clear-checked"), icon: "delete_forever", onClick: () => {clearChecked()}}]
        if(list?.owner === session.data?.user?.email){
            buttons.push({text: t("edit"), icon: "edit", onClick: () => {openEditListDialog()}})
        }
        return buttons;
    }

    return (
        <div className={styles['list-page']}>
            {editListMetadataDialogOpen ? 
            <Dialog title={t("edit-list")} close={() => {closeEditListDialog()}}>
                <div className={styles['dialog-container']}>
                        <div className={styles['input-container']}>
                            <div  className={styles['input-row']}>
                                {t("name")} <input placeholder={list?.name} onChange={(e) => setListNameInput(e.target.value)}></input>
                            </div>
                            <div className={styles['input-row']}>
                                {t("viewers")}
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
                                <button className='warning' onClick={() => {confirmDeleteList()}}>{t("delete-list")}</button>
                            </div>
                            <button className='primary' onClick={() => saveMetaData()}>{t("save-changes")}</button>
                        </div>
                        }
                    </div>
            </Dialog> : ''}
            
            <div className={styles['header']}>
                <div className={styles['header-section']}>
                    <a className="material-symbols-outlined" href='/lists'>arrow_back</a>
                    <Toggle 
                        toggled={settings.theme.name==="Light"}
                        onToggle={() => {updateTheme(settings.theme.name === "Light" ? "dark" : "light")}}
                        iconOff='dark_mode'
                        iconOn='light_mode'></Toggle>
                </div>
                
                <div className={styles['header-section']}>
                    <AvatarPresence avatars={presence}></AvatarPresence>
                    <button 
                        className="material-symbols-outlined" 
                        onClick={() => setSettingsOpen(true)}>settings</button>
                    <ButtonMenu buttons={getSettingsMenuButtons()} 
                        open={settingsOpen} 
                        onClose={() => setSettingsOpen(false)}></ButtonMenu>
                </div>
                
            </div>
            {
                list === null ? <div style={{width: 'fit-content', alignSelf: 'center', padding: '20px'}}><Spinner></Spinner></div> : 
                <>
                    <div className={styles['list-title-row']}>
                        <div className={styles['list-title-container']}>
                            <h3>{list?.name}</h3>
                        </div>
                        {getSavedText()}
                    </div>
                    <ListView 
                        list={listViewItems}
                        onClick={(itemId) => itemWithIdClicked(itemId)}
                        onDelete={(itemId) => {deleteItem(itemId)}}
                        onEdit={(itemId, text) => {editItem(itemId, text)}}
                        onDrag={(itemId, itemIdBefore) => {itemDragged(itemId, itemIdBefore)}}
                        onUndo={(itemId) => {uncheckItem(itemId)}}
                    ></ListView>
                    
                </>
            }
            <div  className={styles['input-container']}>
                <input enterKeyHint='enter'
                    type='text'
                    value={newItemInput}
                    onChange={(e) => setNewItemInput(e.target.value)}
                    onKeyDown={(e) => {if(e.key === 'Enter') addItemClicked()}}></input>
                <button disabled={newItemInput.length === 0} onClick={() => addItemClicked()} className='material-symbols-outlined' style={{width: "32px", height: "32px"}}>add</button>
            </div>
        </div>
    )
}

interface Props{
    params: {id: string}
}