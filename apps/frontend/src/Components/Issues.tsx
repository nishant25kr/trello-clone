import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom"

export const Issue = () => {
    const params = useParams()
    let ws = useRef<WebSocket>(null)
    const wsRef = useRef<WebSocket | null>(null);
    useEffect(()=>{
        const ws = new WebSocket('ws://localhost:8080');
        wsRef.current = ws;
        
        ws.onopen = () => {
            ws.send(JSON.stringify({
                type:'join',
                payload:{
                    boardId:params
                }
            }))
        }
    },[])

    return (
        <>
            <div>
                <h1>issues</h1>
                <h1>{params.token}</h1>
            </div>
        </>
    )
}