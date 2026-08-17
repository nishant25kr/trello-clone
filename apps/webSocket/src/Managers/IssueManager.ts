import type { Issue } from "../types";

export class IssueManager{
    private issues: Issue[];
    
    constructor(){
        this.issues = [];
    }

    public addTask(id: number ,title: string, section: string){
        const task = {
            id,
            title,
            section
        }
        this.issues.push(task)
    }

    public deleteTask(id: number): void{
        const filteredIssue = this.issues.filter(item => item.id !== id)
        console.log("filtered Issue", filteredIssue)
    }

    public changeSection(id: number){
        console.log("")
    }


}