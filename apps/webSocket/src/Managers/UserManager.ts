import type { User, OutgoingMessage } from "../types";

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

    public getUsers(){
        return this.users
    }

    public addUser(user: User) {
        this.users.push(user)
    }

    public RemoveUser(id: string): void {
        const filteredUser = this.users.filter(item => item.id !== id)
        console.log("filtered User", filteredUser)
    }

    public broadcast(id: string, message: any) {
        if (!this.users.find(u => u.id === id)) return;

        this.users.forEach(i => {
            if (i.id !== id) {
                i.ws.send(message)
            }
        }
        )

    }

    public handleIssueChange(id: string ){
        
    }

}