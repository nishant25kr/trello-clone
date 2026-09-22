import type { Board } from "@/types"
import axios from "axios"
import { useState } from "react"
import { useParams } from "react-router-dom"

type CreateBoardProps = {
    onBoardCreated: (board: Board) => void;
};

export const CreateBoard = ({ onBoardCreated }: CreateBoardProps) => {
    const [title, setTitle] = useState<string>('')
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
            const response = await axios.post("http://localhost:3000/api/v1/board", {
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
        }
    }
    return (
        <div>
            <h1>Create Board</h1>
            <input 
                className="border" 
                placeholder="Title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <button className="border m-2 p-2" onClick={handleCreateBoard}>
                Create Board
            </button>
        </div>
    )
}