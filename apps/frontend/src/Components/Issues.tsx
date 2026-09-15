import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom"

interface Section{
    id: string;
    title: string;
}

interface Issue {
    id: string;
    title: string;
    sectionId: string;
}

interface Board {
    id: string;
    title: string;
}

export const Issue = () => {
    const params = useParams();
    const wsRef = useRef<WebSocket | null>(null);
    const [boardId, setBoardId] = useState<string>('a00fa65a-556f-4896-96e6-925b8b96bdec');
    const [issues, setIssues] = useState<Issue[]>([]);
    const [users, setUsers] = useState<unknown[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [boards, setBoards] = useState<Board[]>([]);
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(true);


    function addSection() {
        if (!title.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current?.send(
            JSON.stringify({
                type: "add-section",
                payload: {
                    section: title.trim(),
                    boardId: boardId
                }
            })
        )
        setTitle('');
    }

    function deleteSection(id: string){
        if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(
            JSON.stringify({
                type:"delete-section",
                payload:{
                    sectionId:id,
                    boardId:boardId
                }
            })
        )
        setSections(prev => prev.filter(section => section.id !== id))
    }

    function getSections(id: string) {
        setBoardId(id)
        if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(
            JSON.stringify({
                type: 'change-board',
                payload: {
                    boardId: id
                }
            })
        )
    }

    useEffect(() => {
        const firstBoardId = boards[0]?.id || ''
        setBoardId(firstBoardId)
    }, [boards])

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
                    console.log("issue",msg.payload.issues);
                            setIssues(msg.payload.issues ?? [])
                            setUsers(msg.payload.users ?? []);
                            setSections(msg.payload.sections ?? []);
                            setBoards(msg.payload.boards ?? []);
                        setLoading(false);
                    break;

                case 'update-sections':
                    setIssues(msg.payload.issues ?? [])
                    setSections(msg.payload.sections ?? [])
                    setLoading(false);
                    break;

                case 'create-section': {
                    console.log('recieved create message');
                    const section = msg.payload?.section;
                    console.log("section",section);
                    if (!section) {
                        console.warn("create-section: missing payload.section", msg);
                        break;
                    }
                    setSections(prev => [...prev, section]);
                    break;
                }

                case 'delete-section':{
                    const id = msg.payload.sectionId
                    setSections(prev => prev.filter(section => section.id !== id))
                    break;
                }

                default:
                    break;
            }
        }

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [])

    return (
        <>
            {loading ? <p>Loading...</p> : users.length}
            <div>
                <select
                    name="board"
                    id="board"
                    onChange={(e) => getSections(e.target.value)}
                    value={boardId}
                >
                    {boards.map((item) => (
                        <option key={item.id} value={item.id}>{item.title}</option>
                    ))}

                </select>

                <div className="border-2 m-2">
                    <table className="m-2 mx-auto w-full h-full">
                        <thead className="flex w-full">
                            <tr className="bg-gray-100">
                                {sections.map((section) => (
                                    <td key={section.id} className="border px-4 py-2">{section.title}
                                    <button className="border m-2" onClick={()=> deleteSection(section.id)}>x</button>
                                    </td>
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
                                
                                <input type="text" value={title} placeholder="Section name" onChange={(e) => setTitle(e.target.value)} />
                            </div>

                        </thead>
                        <tbody>
                            {issues.map((issue) => (
                                <tr key={issue.id}>
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