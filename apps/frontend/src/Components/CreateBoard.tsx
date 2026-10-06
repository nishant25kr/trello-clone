import type { Board } from "@/types"
import axios from "axios"
import { useState } from "react"
import { useParams } from "react-router-dom"
import { API_BASE_URL } from "../config"

type CreateBoardProps = {
    onBoardCreated: (board: Board) => void;
};

export const CreateBoard = ({ onBoardCreated }: CreateBoardProps) => {
    const [title, setTitle] = useState<string>('')
    const [creating, setCreating] = useState(false);
    const params = useParams();

    async function handleCreateBoard() {
        try {
            if (!title.trim()) {
                alert("Title cannot be empty")
                return;
            }
            const token = localStorage.getItem("token");
            if (!token) {
                console.log("No token found");
                return;
            }
            setCreating(true);
            const response = await axios.post(`${API_BASE_URL}/board`, {
                title: title,
                organizationId: params.organizationId
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.status !== 200) {
                console.log("Error creating board");
                return;
            }
            const board: Board = response.data.data;
            onBoardCreated(board);
            setTitle('');
            console.log(response.data);
        } catch (error) {
            console.error("Error creating board:", error);
        } finally {
            setCreating(false);
        }
    }

    return (
        <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
                e.preventDefault();
                if (!creating) handleCreateBoard();
            }}
        >
            <label htmlFor="new-board-title" className="sr-only">New board title</label>
            <input
                id="new-board-title"
                className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 sm:w-48"
                placeholder="New board title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <button
                type="submit"
                disabled={creating || !title.trim()}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {creating ? (
                    <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                            <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        </svg>
                        Creating…
                    </>
                ) : (
                    "Create board"
                )}
            </button>
        </form>
    )
}