import type { Issue } from "../types";

export class IssueManager {
    private issues: Issue[];
    static instance: IssueManager;

    constructor() {
        this.issues = [];
    }

    public static getInstance() {
        if (!IssueManager.instance) {
            IssueManager.instance = new IssueManager()
        }
        return IssueManager.instance
    }

    public addTask(issue: Issue) {
        this.issues.push(issue)
    }

    public deleteTask(issueId: string) {
        // this.issues.fi

    }

    public changeSection(issueId: string, updatedSection: string) {
        if (!this.issues.find(i => i.id === issueId)) return;

        const updatedIssue = this.issues.map((i: Issue) =>
            i.id === issueId
                ? { ...i, sectionId: updatedSection }
                : i
        ); 

        this.issues = updatedIssue;
    }

}