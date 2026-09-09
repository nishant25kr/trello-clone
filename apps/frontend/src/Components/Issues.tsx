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
                    setUsers(msg.payload.users)
                    setSections(msg.payload.sections)
                    break;

                default:
                    break;
            }
        }
    }, [])

    return (
        <>
            <div>
                <h1>issues</h1>
                <h1>{params.token}</h1>
                <div>
                    <table>
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