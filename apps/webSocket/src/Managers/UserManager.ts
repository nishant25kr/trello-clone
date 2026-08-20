import type { OutgoingMessage } from "../types";
import type { User } from "./User.js";


export class UserManager {
    private users: User[];
    static instance: UserManager


    constructor() {
        this.users = [];
    }

    static getInstance() {
        if (!this.instance) {
            console.log("creating meetingroommanager")
            this.instance = new UserManager()
        }
        return this.instance
    }

    public getUsers() {
        return this.users
    }

    public addUser(user: User) {
        this.users.push(user)
        const message = {
            type: "user-joined",
            payload: {
                id: user.id,
                username: user.username
            }
        }
        this.broadcast(user, message)
    }

    public RemoveUser(user: User){
        const filteredUser = this.users.filter(item => item.id !== user.id)
        
    }

    public broadcast(sender: User, message: any) {
        if (!this.users.find(u => u.id === sender.id)) return;

        this.users.forEach(i => {
            if (i.id !== sender.id) {
                i.ws.send(message)
            }
        }
        )

    }

    public handleIssueChange(id: string) {

    }

}