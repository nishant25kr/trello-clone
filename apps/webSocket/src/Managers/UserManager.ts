import type { OutgoingMessage } from "../types";
import type { User } from "./User.js";

export class UserManager {
    static instance: UserManager
    private users: Map<string, User[]>;

    constructor() {
        this.users = new Map();
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new UserManager()
        }
        return this.instance
    }

    public getUsers(boardId: string): { id: string, username: string }[] {
        const res: { id: string, username: string }[] = [];
        if (!this.users.has(boardId)) return res;

        this.users.get(boardId)?.forEach((u) => {
            if (!u.id || !u.username) return;
            res.push({ id: u.id, username: u.username });
        });

        return res;
    }

    public addUser(boardId: string, user: User) {
        const boardUsers = this.users.get(boardId) ?? [];
        if (boardUsers.some((u) => u.id === user.id)) return;

        const updatedUsers = [...boardUsers, user];
        this.users.set(boardId, updatedUsers);

        const message = JSON.stringify({
            type: "user-joined",
            payload: {
                id: user.id,
                username: user.username,
            },
        });

        updatedUsers.forEach((member) => {
            if (member.id !== user.id) {
                member.ws.send(message);
            }
        });
    }

    public RemoveUser(boardId: string, user: User) {
        const boardUsers = this.users.get(boardId) ?? [];
        const filteredUsers = boardUsers.filter((item) => item.id !== user.id);

        if (filteredUsers.length === boardUsers.length) {
            return;
        }

        if (filteredUsers.length === 0) {
            this.users.delete(boardId);
        } else {
            this.users.set(boardId, filteredUsers);
        }

        const message = JSON.stringify({
            type: "user-left",
            payload: {
                id: user.id,
                username: user.username,
            },
        });

        filteredUsers.forEach((member) => {
            member.ws.send(message);
        });
    }

    public broadcast(boardId: string, sender: User, message: any) {
        const boardUsers = this.users.get(boardId) ?? [];
        if (!boardUsers.some((u) => u.id === sender.id)) return;

        boardUsers.forEach((member) => {
            if (member.id !== sender.id) {
                member.ws.send(message);
            }
        });
    }

    public handleIssueChange(id: string) {
        //todo: implement issue change handling logic
    }

    public RemoveUserFromAllBoards(user: User) {
        for (const [boardId, boardUsers] of this.users.entries()) {
            const filteredUsers = boardUsers.filter((item) => item.id !== user.id);
            if (filteredUsers.length === boardUsers.length) continue;

            if (filteredUsers.length === 0) {
                this.users.delete(boardId);
            } else {
                this.users.set(boardId, filteredUsers);
            }

            const message = JSON.stringify({
                type: "user-left",
                payload: {
                    id: user.id,
                    username: user.username,
                },
            });

            filteredUsers.forEach((member) => {
                member.ws.send(message);
            });
        }
    }
}