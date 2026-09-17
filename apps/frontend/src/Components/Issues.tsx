import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom"

interface Section {
  id: string;
  title: string;
}

interface Task {
  id: string;
  title: string;
  sectionId: string;
}

interface Board {
  id: string;
  title: string;
}

interface User {
  id: string,
  username: string
}

export const Issue = () => {
  const params = useParams();
  const wsRef = useRef<WebSocket | null>(null);
  const [user, setUser] = useState<User>()
  const [boardId, setBoardId] = useState<string>('a00fa65a-556f-4896-96e6-925b8b96bdec');
  const [task, setTask] = useState<Task[]>([]);
  const [users, setUsers] = useState<unknown[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true);
  const [changingBoard, setChangingBoard] = useState<boolean>(false);
  const [newtask, setNewtask] = useState<string>('')
  const [description, setDescription] = useState<string>();

  function addtask(sectionId: string) {
    if (!newtask.trim() || !wsRef.current || !description?.trim()) {
      alert("validation failed")
      return;
    }
    wsRef.current?.send(
      JSON.stringify({
        type: 'create-task',
        payload: {
          title: newtask,
          boardId: boardId,
          createdBy: user?.id,
          description: description,
          sectionId: sectionId
        }
      })
    )
  }


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
    setSections(prev => [...prev, { id: crypto.randomUUID(), title: title.trim() }])
    setTitle('');
  }

  function deleteSection(id: string) {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(
      JSON.stringify({
        type: "delete-section",
        payload: {
          sectionId: id,
          boardId: boardId
        }
      })
    )
    setSections(prev => prev.filter(section => section.id !== id))
  }

  function getSections(id: string) {
    setBoardId(id)
    setChangingBoard(true)
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
    setChangingBoard(true)
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
          setUser(msg.payload.user ?? {});
          setTask(msg.payload.issues ?? []);
          setUsers(msg.payload.users ?? []);
          setSections(msg.payload.sections ?? []);
          setBoards(msg.payload.boards ?? []);
          setLoading(false);
          setChangingBoard(false);
          break;

        case 'update-sections':
          setTask(msg.payload.issues ?? [])
          setSections(msg.payload.sections ?? [])
          setLoading(false);
          setChangingBoard(false);
          break;

        case 'create-section': 
          console.log('recieved create message');
          const section = msg.payload?.section;
          console.log("section", section);
          if (!section) {
            console.warn("create-section: missing payload.section", msg);
            break;
          }
          setSections(prev => [...prev, section]);
          break;

        case 'create-task':
          console.log("inside create task",msg)
          const title = msg.payload.task;
          const sectionId = msg.payload.sectionId;
          const id = msg.payload.id;
          const task = {
            id: id,
            title: title,
            sectionId: sectionId
          }
          setSections(prev => [...prev, task]);
          break;

        default:
          console.log(msg)
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
        {user?.username}
        {user?.id}

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
          {changingBoard == true ?
            <p>Changing board...</p> :
            <table className="m-2 mx-auto w-full max-w-full h-full">
              <tbody className="flex w-full overflow-hidden">
                <div className="flex w-full gap-4 overflow-x-scroll max-w-screen p-4">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className="w-72 shrink-0 rounded-lg bg-gray-100 p-3"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="font-semibold">
                          {section.title}
                        </h2>

                        <button
                          className="rounded border px-2 py-1"
                          onClick={() => deleteSection(section.id)}
                        >
                          ×
                        </button>
                      </div>

                      <div className="space-y-2">
                        {task
                          .filter((issue) => issue.sectionId === section.id)
                          .map((issue) => (
                            <div
                              key={issue.id}
                              className="rounded border bg-white p-3 shadow-sm"
                            >
                              {issue.title}
                            </div>
                          ))}
                      </div>

                      <div className="mt-3">
                        <input
                          type="text"
                          className="border"
                          onChange={(e) =>
                            setNewtask(e.target.value)
                          }
                          placeholder="Add task"
                        />
                        <input
                          type="text"
                          className="border"
                          onChange={(e) =>
                            setDescription(e.target.value)
                          }
                          placeholder="Add Description"
                        />
                        <button
                          className="rounded border text-white bg-blue-500 p-1 shadow-sm"
                          onClick={() => addtask(section.id)}
                        >
                          createTask
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="w-72 shrink-0">
                    <input
                      type="text"
                      value={title}
                      placeholder="Section name"
                      onChange={(e) => setTitle(e.target.value)}
                      className="mb-2 w-full rounded border p-2"
                    />
                    <button
                      type="button"
                      className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white"
                      onClick={addSection}
                    >
                      Add Section
                    </button>
                  </div>
                </div>
              </tbody>
            </table>
          }
        </div>
      </div>
    </>
  )
}