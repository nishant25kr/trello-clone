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

    function addSection(){
        //todo: add logic of adding section
    }

    function getSections(id:string) {
        const selectedBoard = boards.find((item) => item.id === id)
        setBoardId(id)
        setBoard(selectedBoard?.title || '')
        console.log("boardId", selectedBoard?.title || '')
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
        const firstBoardId = boards[0]?.id || ''
        setBoardId(firstBoardId)
        setBoard(boards[0]?.title || '')
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
        {board}
            <div>
                <select 
                    name="board" 
                    id="board" 
                    onChange={(e) => getSections(e.target.value)} 
                    value={board}
                    >
                        {boards?.map((item) => (
                            <option value={item.id}>{item.title}</option>
                        ))}

                </select>
                
                <div className="border-2 m-2">
                    <table className="m-2 mx-auto w-full h-full">
                        <thead className="flex w-full">
                            <tr className="bg-gray-100">
                                {sections?.map((section) => (
                                    <td className="border px-4 py-2">{section.title}</td>
                                ))}
                            
                            </tr>

                            <div>
                                <button
                                        type="button"
                                        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        onClick={() => addSection()}
                                        >
                                        Add Section
                                </button>   
                                <input type="text" placeholder="Section name" />
                            </div>

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