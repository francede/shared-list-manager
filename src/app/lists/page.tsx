"use client"

import { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import Spinner from '@/components/spinner';
import { signIn, signOut, useSession } from 'next-auth/react';
import Dialog from '@/components/dialog';
import utils from '@/utils/validationUtils';
import { SharedList } from '../api/services/sharedListRepository';
import { LinkListView } from '@/components/listView/listView';


export default function Lists() {
    const session = useSession();
    const [ownedLists, setOwnedLists] = useState<SharedList[] | null>(null);
    const [viewableLists, setViewableLists] = useState<SharedList[] | null>(null);
    const [createListDialogOpen, setCreateListDialogOpen] = useState<boolean>(false);
    const [newList, setNewList] = useState<{name: string, viewers: string[]}>({name: '', viewers: []});
    const [newListViewerInput, setNewListViewerInput] = useState<string>('');
    const [creatingList, setCreatingList] = useState<boolean>(false);

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
            alert("Must be valid name");
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
            return 'no owned lists'
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
            return 'no viewable lists'
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
                <Dialog title='Create New List' close={() => {setCreateListDialogOpen(false)}}>
                    <div className={styles['dialog-container']}>
                        <div className={styles['input-container']}>
                            <div  className={styles['input-row']}>
                                name: <input placeholder='name' onChange={(e) => setNewList({...newList, name: e.target.value})}></input>
                            </div>
                            <div className={styles['input-row']}>
                                viewers:
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
                        creatingList ? <div className={styles['spinner-container']}>Creating &quot;{newList.name}&quot;<Spinner></Spinner></div> :
                        <div className={styles['button-container']}>
                            <button onClick={() => {setCreateListDialogOpen(false)}}>Cancel</button>
                            <button className='primary' onClick={() => {createList()}}>Create</button>
                        </div>
                        }
                    </div>
                </Dialog>
            }
            
            <div className={styles['auth-container']}>
                {
                session.data ? 
                <>
                    Logged in as {session.data.user?.email}
                    <button onClick={() => signOut()}><span className="material-symbols-outlined">logout</span>Logout</button>
                </> :
                <button onClick={() => signIn()}><span className="material-symbols-outlined">login</span> Login</button>
                }
            </div>
            
            
            <div className={styles['content-container']}>
                <h3 className={styles["lists-header"]}>My Lists</h3>
                <div className={styles['list-container']}>{getOwnedLists()}</div>
                <div className={styles["content-divider"]}></div>
                <h3 className={styles["lists-header"]}>Viewable Lists</h3>
                <div className={styles['list-container']}>{getViewableLists()}</div>
            </div>

            <button onClick={() => openCreateListDialog()} className={getCreateListButtonClassName()}>add</button>
        </>
    )
}
