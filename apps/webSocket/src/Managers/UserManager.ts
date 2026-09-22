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
            console.log("creating meetingroommanager")
            this.instance = new UserManager()
        }
        return this.instance
    }

    public getUsers(boardId: string): { id: string, username: string }[] {
        const res: any[] = [];
        if (!this.users.has(boardId)) return res;
        this.users.get(boardId)?.forEach((u) => {
            res.push({ id: u.id, username: u.username });
        })
        return res
    }

    public addUser(boardId: string, user: User) {
        console.log("adding user")
        if (this.users.has(boardId)) {
            console.log("boardId", boardId, "already exists in users map")
            if (this.users.get(boardId)?.find(u => u.id === user.id)) return;
            this.users.set(boardId, [...(this.users.get(boardId) || []), user])
            const message = JSON.stringify({
                type: "user-joined",
                payload: {
                    id: user.id,
                    username: user.username
                }
            })
            this.broadcast(boardId, user, message)
            console.log(this.users.get(boardId)?.length, "users in boardId", boardId)
            return;
        }
        this.users.set(boardId, [user])
        console.log(this.users.get(boardId)?.length, "users in boardId", boardId)

    }

    public RemoveUser(boardId: string, user: User) {
        const filteredUser = this.users.get(boardId)?.filter(item => item.id !== user.id)
        if (filteredUser) {
            this.users.set(boardId, filteredUser)
        }
    }

    public broadcast(boardId: string, sender: User, message: any) {
        if (!this.users.get(boardId)?.find(u => u.id === sender.id)) return;
        this.users.get(boardId)?.forEach(i => {
            if (i.id !== sender.id) {
                i.ws.send(message)
            }
        })
    }

    public handleIssueChange(id: string) {
        //todo: implement issue change handling logic
    }

    public RemoveUserFromAllBoards(user: User) {
        this.users.forEach((users, boardId) => {
            const filteredUser = users.filter(item => item.id !== user.id)
            if (filteredUser.length !== users.length) {
                this.users.set(boardId, filteredUser)
                const message = JSON.stringify({
                    type: "user-left",
                    payload: {
                        id: user.id,
                        username: user.username
                    }
                })
                this.broadcast(boardId, user, message)
            }
        })
    }
}