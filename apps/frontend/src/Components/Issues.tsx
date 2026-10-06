import type { User, Task, Section, Board } from "@/types";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { CreateBoard } from "./CreateBoard";
import { ConnectRepository } from "./ConnectRepository";
import { AgentRunButton } from "./AgentRunButton";
import { Navbar } from "./Navbar";
import { WS_URL } from "../config";

export const Issue = () => {
  const params = useParams();
  const navigate = useNavigate();
  const wsRef = useRef<WebSocket | null>(null);
  const [user, setUser] = useState<User>()
  const [boardId, setBoardId] = useState<string>('');
  const [task, setTask] = useState<Task[]>([]);
  const [users, setUsers] = useState<unknown[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true);
  const [changingBoard, setChangingBoard] = useState<boolean>(false);
  const [newtask, setNewtask] = useState<string>('')
  const [description, setDescription] = useState<string>();
  const [organizationId, setOrganizationId] = useState<string>(params.organizationId || '')
  const [repository, setRepository] = useState<any | null>(null);

  function addtask(sectionId: string) {
    if (!newtask.trim() || !wsRef.current || !description?.trim()) {
      alert("validation failed")
      return;
    }
    const temporiryId = crypto.randomUUID();
    wsRef.current?.send(
      JSON.stringify({
        type: 'create-task',
        payload: {
          temporaryId: temporiryId,
          title: newtask,
          boardId: boardId,
          createdBy: user?.id,
          description: description,
          sectionId: sectionId
        }
      })
    )
    setTask(prev => [...prev, { id: temporiryId, title: newtask, sectionId: sectionId }])
  }

  function moveForward(id: string) {
    const currentTask = task.find(item => item.id === id);
    const currentSectionIndex = sections.findIndex(
      section => section.id === currentTask?.sectionId
    );
    const nextSection = sections[currentSectionIndex + 1];

    if (!nextSection) return;

    setTask(prev => prev.map(item =>
      item.id === id ? { ...item, sectionId: nextSection.id } : item
    ));
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current?.send(
      JSON.stringify({
        type: 'move-task',
        payload: {
          issueId: id,
          boardId: boardId,
          updatedSection: nextSection?.id
        }
      })
    )
  }

  function moveBackward(id: string) {
    const currentTask = task.find(item => item.id === id);
    const currentSectionIndex = sections.findIndex(
      section => section.id === currentTask?.sectionId
    );
    const previousSection = sections[currentSectionIndex - 1];

    if (!previousSection) return;

    setTask(prev => prev.map(item =>
      item.id === id ? { ...item, sectionId: previousSection.id } : item
    ));
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current?.send(
      JSON.stringify({
        type: 'move-task',
        payload: {
          issueId: id,
          boardId: boardId,
          updatedSection: previousSection?.id
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
          title: title.trim(),
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

  function changeBoard(id: string) {
    setChangingBoard(true)
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(
      JSON.stringify({
        type: 'change-board',
        payload: {
          currentBoardId: boardId,
          newBoardId: id,
          user: user
        }
      })
    )
    setBoardId(id)
  }

  function handleBoardCreated(board: Board) {
    setBoards(prev => [...prev, board]);
    changeBoard(board.id);
  }

  function deleteIssue(id: string) {
    if (!id) return;
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "delete-task",
            payload: {
              issueId: id,
              boardId: boardId
            }
          })
        )
      }
      setTask(issue => issue.find(i => i.id ===id ) ? (issue.filter(i => i.id !== id)) : (issue))
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (!boardId && boards[0]) setBoardId(boards[0].id)
  }, [boards, boardId])

  useEffect(() => {
    setChangingBoard(true)
    if (!localStorage.getItem("token") || !params.organizationId) {
      navigate("/auth/login");
      return;
    }
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join',
        payload: {
          token: localStorage.getItem("token"),
          organizationId: params.organizationId
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
          setRepository(msg.payload.repository ?? {});
          setLoading(false);
          setChangingBoard(false);
          setBoardId(msg.payload.boardId ?? '');
          break;

        case 'update-sections':
          setTask(msg.payload.issues ?? [])
          setSections(msg.payload.sections ?? [])
          setLoading(false);
          setChangingBoard(false);
          setRepository(msg.payload.repository ?? null)
          break;

        case 'create-section':
          console.log('recieved create section message');
          const section = msg.payload?.section;
          console.log("section", section);
          if (!section) {
            console.warn("create-section: missing payload.section", msg);
            break;
          }
          setSections(prev => [...prev, section]);
          break;

        case 'create-task':
          console.log("inside create task", msg)
          const title = msg.payload.title;
          const sectionId = msg.payload.sectionId;
          const id = msg.payload.id;
          const task = {
            id: id,
            title: title,
            sectionId: sectionId
          }
          setTask(prev => [...prev, task]);
          break;

        case 'update-issue':
          const issueId = msg.payload.issueId;
          const updatedSection = msg.payload.updatedSection;
          setTask(prev => prev.map(item =>
            item.id === issueId ? { ...item, sectionId: updatedSection } : item
          ));
          break;

        case 'delete-section':
          const sectionIdToDelete = msg.payload.sectionId;
          setSections(prev => prev.filter(section => section.id !== sectionIdToDelete));
          break;

        case 'user-joined':
          const newUser = msg.payload;
          setUsers(prev => [...prev, newUser]);
          break;

        case 'user-left':
          const userIdToRemove = msg.payload.id;
          setUsers(prev => prev.filter((user: any) => user.id !== userIdToRemove));
          break;

        case 'create-task-success':
          console.log("create-task-success", msg)
          const temporaryId = msg.payload.temporaryId;
          const permanentId = msg.payload.permanentId;
          setTask(prev => prev.map(item =>
            item.id === temporaryId ? { ...item, id: permanentId } : item
          ));
          break;

        case "error":
          console.error("WebSocket error:", msg.payload);
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
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace</p>
            <h1 className="text-2xl font-semibold text-slate-900">Board</h1>
          </div>

          <div className="flex items-center gap-3">
            <CreateBoard onBoardCreated={handleBoardCreated} />
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <label htmlFor="board" className="sr-only">Choose board</label>
              <select
                id="board"
                name="board"
                onChange={(e) => changeBoard(e.target.value)}
                value={boardId}
                className="bg-transparent text-sm font-medium text-slate-700 outline-none"
              >
                {boards.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Loading board...</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Current board</p>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {boards.find((board) => board.id === boardId)?.title || "Board"}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(users as Array<{ id: string; username: string }>).map((member) => (
                    <span
                      key={member.id}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                    >
                      {member.username}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {boardId && <ConnectRepository boardId={boardId} repo={repository} />}

            {changingBoard ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Changing board...</div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="w-[310px] shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{section.title}</h3>
                      <button
                        type="button"
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-600"
                        onClick={() => deleteSection(section.id)}
                      >
                        Delete
                      </button>
                    </div>

                    <div className="space-y-3">
                      {task
                        .filter((issue) => issue.sectionId === section.id)
                        .map((issue) => {
                          const sectionIndex = sections.findIndex((item) => item.id === section.id);

                          return (
                            <div key={issue.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                              <div className="flex justify-end px-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => deleteIssue(issue.id)}
                                  className="rounded border border-slate-300 px-2 py-1 text-[10px] font-medium text-slate-600"
                                >
                                  X
                                </button>
                              </div>

                              <div className="flex items-stretch gap-1 px-2 pb-2">
                                <button
                                  type="button"
                                  className="w-8 rounded border border-slate-200 bg-slate-50 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                  onClick={() => moveBackward(issue.id)}
                                  disabled={sectionIndex <= 0}
                                  aria-label={`Move ${issue.title} to the previous section`}
                                  title="Move to previous section"
                                >
                                  ←
                                </button>

                                <div className="min-w-0 flex-1 rounded-md bg-slate-50 p-2">
                                  <p className="break-words text-sm font-medium text-slate-700">{issue.title}</p>
                                  <div className="mt-2">
                                    <AgentRunButton issueId={issue.id} />
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className="w-8 rounded border border-slate-200 bg-slate-50 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                  onClick={() => moveForward(issue.id)}
                                  disabled={sectionIndex >= sections.length - 1}
                                  aria-label={`Move ${issue.title} to the next section`}
                                  title="Move to next section"
                                >
                                  →
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    <div className="mt-4 space-y-2 rounded-lg border border-dashed border-slate-300 bg-white p-2">
                      <input
                        type="text"
                        className="w-full rounded border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-400"
                        onChange={(e) => setNewtask(e.target.value)}
                        placeholder="Add task"
                      />
                      <input
                        type="text"
                        className="w-full rounded border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-400"
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description"
                      />
                      <button
                        type="button"
                        className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                        onClick={() => addtask(section.id)}
                      >
                        Create task
                      </button>
                    </div>
                  </div>
                ))}

                <div className="w-[310px] shrink-0 rounded-xl border border-dashed border-slate-300 bg-white p-3 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">Add section</h3>
                  <input
                    type="text"
                    value={title}
                    placeholder="Section name"
                    onChange={(e) => setTitle(e.target.value)}
                    className="mb-3 w-full rounded border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-400"
                  />
                  <button
                    type="button"
                    className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                    onClick={addSection}
                  >
                    Add Section
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}