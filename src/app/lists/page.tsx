"use client"

import { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import Spinner from '@/components/spinner';
import { signIn, signOut, useSession } from 'next-auth/react';
import Dialog from '@/components/dialog';
import utils from '@/utils/validationUtils';
import { SharedList } from '../api/services/sharedListRepository';
import { LinkListView } from '@/components/listView/listView';
import ButtonMenu from '@/components/buttonMenu';
import { useUserSettings } from '@/components/hooks/useUserSettings';
import Toggle from '@/components/toggle';
import { useTranslation } from '@/components/hooks/useTranslation';
import AvatarPresence from '@/components/avatarPresence';


export default function Lists() {
    const session = useSession();
    const [ownedLists, setOwnedLists] = useState<SharedList[] | null>(null);
    const [viewableLists, setViewableLists] = useState<SharedList[] | null>(null);
    const [createListDialogOpen, setCreateListDialogOpen] = useState<boolean>(false);
    const [newList, setNewList] = useState<{name: string, viewers: string[]}>({name: '', viewers: []});
    const [newListViewerInput, setNewListViewerInput] = useState<string>('');
    const [creatingList, setCreatingList] = useState<boolean>(false);
    const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
    const {settings, updateTheme} = useUserSettings();
    const { t } = useTranslation("page.lists.");

    useEffect(() => {
        if(!session.data) {
            setOwnedLists([]);
            setViewableLists([]);
            return;
        };

        fetch("/api/lists?role=owner").then((res) => res.json())
        .then((data) => {
            setOwnedLists(data);
        })

        fetch("/api/lists?role=viewer").then((res) => res.json())
        .then((data) => {
            setViewableLists(data)
        })
    }, [session.data])

    let openCreateListDialog = () => {
        setNewList({name: '', viewers: []});
        setCreateListDialogOpen(true);
    }

    let createList = () => {
        if(!newList.name){
            alert(t("must-be-valid-name"));
            return;
        }
        setCreatingList(true);
        fetch("/api/list", {
            method: "POST",
            body: JSON.stringify({name: newList.name, viewers: newList.viewers})
        })
        .then((res) => res.json())
        .then((data) => {
            setOwnedLists([...(ownedLists || []), data])
            setCreatingList(false);
            setCreateListDialogOpen(false);
    })};

    let getOwnedLists = () => {
        if(ownedLists === null){
            return <Spinner></Spinner>;
        }
        if(ownedLists.length === 0){
            return  session.data ? t("no-owned-lists") : t("you-must-log-in-to-view-lists")
        }
        const ownedListsToView = ownedLists?.map(ownedList => {
            return {
                text: ownedList.name ?? "UNDEFINED",
                href: `/list/${ownedList._id}`
            }
        })

        return <LinkListView list={ownedListsToView}></LinkListView>
    }

    let getViewableLists = () => {
        if(viewableLists === null){
            return <Spinner></Spinner>;
        }
        if(viewableLists.length === 0){
            return session.data ? t("no-viewable-lists") : t("you-must-log-in-to-view-lists")
        }
        const viewableListsToView = viewableLists?.map(viewableList => {
            return {
                text: viewableList.name ?? "UNDEFINED",
                href: `/list/${viewableList._id}`
            }
        })
        return <LinkListView list={viewableListsToView}></LinkListView>
    }

    let addViewer = () => {
        if(!utils.isValidEmail(newListViewerInput)) return;
        setNewList({...newList, viewers: [...newList.viewers, newListViewerInput]});
        setNewListViewerInput('');
    }

    const getCreateListButtonClassName = () => {
        return [styles["create-list-button"], "material-symbols-outlined", "primary"].join(" ");
    }

    return (
        <>
            {
                createListDialogOpen && 
                <Dialog title={t("create-new-list")} close={() => {setCreateListDialogOpen(false)}}>
                    <div className={styles['dialog-container']}>
                        <div className={styles['input-container']}>
                            <div  className={styles['input-row']}>
                                {t("name")} <input placeholder='name' onChange={(e) => setNewList({...newList, name: e.target.value})}></input>
                            </div>
                            <div className={styles['input-row']}>
                                {t("viewers")}
                                <div className={styles['add-viewers-container']}>
                                    <input placeholder='email' value={newListViewerInput} onChange={(e) => {setNewListViewerInput(e.target.value)}} onKeyDown={(e) => {if(e.code === 'Enter') addViewer()}}></input>
                                    <button className="material-symbols-outlined" disabled={!utils.isValidEmail(newListViewerInput)} onClick={() => {addViewer()}}>add</button>
                                </div>
                            </div>
                            {
                            newList.viewers.map((v, i) => 
                                <div key={i} className={styles['viewer-row']}>
                                    {v}
                                    <button className="material-symbols-outlined" 
                                    onClick={() => {setNewList({...newList, viewers: newList.viewers.toSpliced(i, 1)})}}>close</button>
                                </div>
                            )}
                        </div>

                        {
                        creatingList ? <div className={styles['spinner-container']}>{t("creating-list", {name: newList.name})}<Spinner></Spinner></div> :
                        <div className={styles['button-container']}>
                            <button onClick={() => {setCreateListDialogOpen(false)}}>{t("cancel")}</button>
                            <button className='primary' onClick={() => {createList()}}>{t("create")}</button>
                        </div>
                        }
                    </div>
                </Dialog>
            }
            
            <div className={styles['auth-container']}>
                <Toggle 
                    toggled={settings.theme.name==="Light"}
                    onToggle={() => {updateTheme(settings.theme.name === "Light" ? "dark" : "light")}}
                    iconOff='dark_mode'
                    iconOn='light_mode'></Toggle>
                {
                session.data ? 
                <>
                    <button 
                        className="material-symbols-outlined icon" 
                        onClick={() => setSettingsOpen(true)}>account_circle</button>
                    <ButtonMenu 
                        open={settingsOpen} 
                        buttons={[
                            {text: t("settings"), href: "/settings", icon: "settings"}, 
                            {text: t("log-out"), onClick: () => {signOut()}, icon: "logout"}]}
                            text={session.data.user?.email ?? ""}
                        onClose={() => {setSettingsOpen(false)}}>
                        <div className={styles['button-menu-avatar-container']}><AvatarPresence avatars={[{avatar: settings.avatar}]}/></div>
                    </ButtonMenu>
                </> :
                <button onClick={() => signIn()}><span className="material-symbols-outlined">login</span> {t("log-in")}</button>
                }
                
            </div>
            
            
            <div className={styles['content-container']}>
                <h3 className={styles["lists-header"]}>{t("my-lists")}</h3>
                <div className={styles['list-container']}>{getOwnedLists()}</div>
                <div className="content-divider"></div>
                <h3 className={styles["lists-header"]}>{t("viewable-lists")}</h3>
                <div className={styles['list-container']}>{getViewableLists()}</div>
            </div>

            <button onClick={() => openCreateListDialog()} className={getCreateListButtonClassName()}>add</button>
        </>
    )
}
