"use client"

import { SharedListResponse } from '@/services/sharedListRepository'
import { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import Spinner from '@/components/spinner';
import { signIn, signOut, useSession } from 'next-auth/react';
import '@/app/globalicons.css'
import Dialog from '@/components/dialog';


export default function Lists() {
    const session = useSession();
    const [ownedLists, setOwnedLists] = useState<SharedListResponse[] | null>(null);
    const [viewableLists, setViewableLists] = useState<SharedListResponse[] | null>(null);
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
        return ownedLists?.map((list, i) => <a key={i} href={`/list/${list._id}`}>{list.name}</a>)
    }

    let getViewableLists = () => {
        if(viewableLists === null){
            return <Spinner></Spinner>;
        }
        if(viewableLists.length === 0){
            return 'no viewable lists'
        }
        return viewableLists?.map((list, i) => <a key={i} href={`/list/${list._id}`}>{list.name}</a>)
    }

    let addViewer = () => {
        if(!isValidEmail(newListViewerInput)) return;
        setNewList({...newList, viewers: [...newList.viewers, newListViewerInput]});
        setNewListViewerInput('');
    }

    let isValidEmail = (email: string) => {
        return String(email).toLowerCase().match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    }

    return (
        <>
            {
                createListDialogOpen ? 
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
                                    <button className="material-symbols-outlined" disabled={!isValidEmail(newListViewerInput)} onClick={() => {addViewer()}}>add</button>
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
                : null
            }
            
            <div className={styles['auth-container']}>
                {
                session.data ? 
                <>
                    Logged in as {session.data.user?.name}
                    <button onClick={() => signOut()}><span className="material-symbols-outlined">logout</span>Logout</button>
                </> :
                <button onClick={() => signIn()}><span className="material-symbols-outlined">login</span> Login</button>
                }
            </div>
            
            
            <div className={styles['content-container']}>
                <h3>My Lists</h3>
                <div className={styles['list-container']}>{getOwnedLists()}</div>
                
                <h3>Viewable Lists</h3>
                <div className={styles['list-container']}>{getViewableLists()}</div>

                <button onClick={() => openCreateListDialog()} style={{marginTop: "24px"}}>Create List</button>
            </div>
            
        </>
    )
}
