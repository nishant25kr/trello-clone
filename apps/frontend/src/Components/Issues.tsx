import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom"

export const Issue = () => {
    const params = useParams()
    let ws = useRef<WebSocket>(null)
    const wsRef = useRef<WebSocket | null>(null);
    const [boardId, setBoardId] = useState<string | null>('a00fa65a-556f-4896-96e6-925b8b96bdec')
    const [issues, setIssues] = useState<any[] | null>()
    const [users, setUsers] = useState<any[] | null>(null)
    const [sections, setSections] = useState<any[] | null>(null)
    const [boards, setBoards] = useState<any[]>([])
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080');
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({
                type: 'join',
                payload: {
                    boardId: boardId,
                    token: params.token
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

                default:
                    break;
            }
        }
    }, [])

    return (
        <>
            <div>
                <select name="board" id="" value={boards}>
                    {boards?.map((item) => (
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