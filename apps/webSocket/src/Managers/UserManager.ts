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

    public getUsers(boardId: string): {id: string, username: string}[] {
        const res: any[] = [];
        if(!this.users.has(boardId)) return res;
        this.users.get(boardId)?.forEach( (u) => {
            res.push({id:u.id, username:u.username});
        })
        return res
    }

    public addUser(boardId: string, user: User) {
        if(this.users.has(boardId)) return;
        this.users.set(boardId, [...(this.users.get(boardId) || []), user])
        const message = JSON.stringify({
            type: "user-joined",
            payload: {
                id: user.id,
                username: user.username
            }
        })
        this.broadcast(boardId, user, message)
    }

    public RemoveUser(boardId: string, user: User){
        const filteredUser = this.users.get(boardId)?.filter(item => item.id !== user.id)
        if(filteredUser) {
            this.users.set(boardId, filteredUser)
        }
    }

    public broadcast(boardId: string, sender: User, message: any) {
        console.log("broadcasting message to boardId", boardId, "from sender", sender.id, "message", message)
        if (!this.users.get(boardId)?.find(u => u.id === sender.id)) return;
        console.log(this.users.get(boardId));
        this.users.get(boardId)?.forEach(i => {
            if (i.id !== sender.id) {
                i.ws.send(message)
            }
        }
        )
    }

    public handleIssueChange(id: string) {

    }

}