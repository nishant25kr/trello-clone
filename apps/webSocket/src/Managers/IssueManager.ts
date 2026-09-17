import type { Issue } from "../types";

export class IssueManager {
    private issues: Map<string, Issue[]>;
    static instance: IssueManager;

    constructor() {
        this.issues = new Map();
    }

    public static getInstance() {
        if (!IssueManager.instance) {
            IssueManager.instance = new IssueManager()
        }
        return IssueManager.instance
    }

    public addTask(boardId: string, issue: Issue) {
        if (!this.issues.has(boardId)) {
            this.issues.set(boardId, []);
        }
        this.issues.get(boardId)?.push(issue);
    }

    public deleteTask(boardId: string, issueId: string) {
        if (this.issues.has(boardId)) {
            const issues = this.issues.get(boardId)?.filter((i: Issue) => i.id !== issueId);
            this.issues.set(boardId, issues || []);
        }
    }

    public changeSection(boardId: string, issueId: string, updatedSection: string) {
        if (!this.issues.has(boardId)) return;

        const issues = this.issues.get(boardId);
        if (!issues) return;

        const updatedIssue = issues.map((i: Issue) =>
            i.id === issueId
                ? { ...i, sectionId: updatedSection }
                : i
        ); 

        this.issues.set(boardId, updatedIssue);
    }

}