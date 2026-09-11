import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom"

export const Issue = () => {
    const params = useParams()
    let ws = useRef<WebSocket>(null)
    const wsRef = useRef<WebSocket | null>(null);
    const [boardId, setBoardId] = useState<string | null>('a00fa65a-556f-4896-96e6-925b8b96bdec')
    const [issues, setIssues] = useState<any[] | null>()
    const [users, setUsers] = useState<any[] | null>(null)
    const [sections, setSections] = useState<any[]>([])
    const [board, setBoard] = useState<string>('')
    const [boards, setBoards] = useState<any[]>([])

    function getSections(id:string) {
        setBoard(boards.find((item) => item.id === id)?.title || '')
        console.log("boardId", boards.find((item) => item.id === id)?.title || '')
        console.log("hello from section")
        if(!wsRef.current) console.log("not ws");

        wsRef.current?.send(
            JSON.stringify({
                type:'change-board',
                payload:{
                    boardId:id
                }
            })
        )
    }

    useEffect(()=>{
        setBoard(boards[0]?.title)
    },[boards])

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080');
        wsRef.current = ws;
        
        ws.onopen = () => {
            ws.send(JSON.stringify({
                type: 'join',
                payload: {
                    boardId: boardId,
                    token: params.token,
                    organizationId: "97680c3a-d8c4-4b7e-ad9d-c55efd671113"
                }
            }))
        }

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data as string);
            switch (msg.type) {
                case "init-state":
                    setIssues(msg.payload.issues)
                    setUsers(msg.payload.users);
                    setSections(msg.payload.sections);
                    setBoards(msg.payload.boards);
                    break;

                case 'update-sections':
                    console.log("hello from inside",msg)
                    setSections(msg.payload.sections)
                    break;

                default:
                    break;
            }
        }
    }, [])

    return (
        <>
        {JSON.stringify(sections)}
            <div>
                <select 
                    name="board" 
                    id="" 
                    onChange={(e) => getSections(e.target.value)} 
                    value={board}
                    >
                        {boards?.map((item) => (
                            <option value={item.id}>{item.title}</option>
                        ))}
                </select>
                
                <select name="board" id="" value={sections}>
                    {sections?.map((item) => (
                        <option value="">{item.title}</option> 
                    ))}
                </select>

                <div className="border-2 m-2">
                    <table className="m-2 mx-auto w-full h-full">
                        <thead>
                            <tr className="bg-gray-100">
                                {sections?.map((section) => (
                                    <td className="border px-4 py-2">{section.title}</td>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {issues?.map((issue) => (
                                    <tr>
                                        <td className="border px-4 py-2">{issue.sectionId === sections?.[0]?.id ? issue.title : ''}</td>
                                        <td className="border px-4 py-2">{issue.sectionId === sections?.[1]?.id ? issue.title : ''}</td>
                                        <td className="border px-4 py-2">{issue.sectionId === sections?.[2]?.id ? issue.title : ''}</td>
                                    </tr>
                                ))
                            }   
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}