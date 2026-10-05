import type WebSocket from "ws";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/db";
import { UserManager } from "./UserManager";
import { IssueManager } from "./IssueManager";
import { jwtSecret } from "../../config.ts";
import {
    ChangeBoardSchema,
    CreateBoardSchema,
    CreateSectionSchema,
    CreateTaskSchema,
    DeleteSectionSchema,
    DeleteTaskSchema,
    JoinRoomSchema,
    MoveTaskSchema,
} from "../utils/PayloadSchema.ts";

export class User {
    public id!: string;
    public username!: string;
    public ws: WebSocket;

    constructor(ws: WebSocket) {
        this.ws = ws;
        this.initHandler();
    }

    private sendError(message: string) {
        this.ws.send(
            JSON.stringify({
                type: "error",
                payload: { message },
            })
        );
    }

    private async ensureOrganizationMembership(userId: string, organizationId: string) {
        const membership = await prisma.membership.findFirst({
            where: {
                userId,
                organisationId: organizationId,
            },
        });

        if (!membership) {
            throw new Error("Forbidden");
        }

        return membership;
    }

    private async ensureBoardMembership(userId: string, boardId: string) {
        const board = await prisma.board.findUnique({
            where: { id: boardId },
            select: { id: true, organisationId: true },
        });

        if (!board) {
            throw new Error("Board not found");
        }

        const membership = await this.ensureOrganizationMembership(userId, board.organisationId);
        return { board, membership };
    }

    private async ensureIssueInBoard(issueId: string, boardId: string) {
        const issue = await prisma.issue.findFirst({
            where: {
                id: issueId,
                boardId,
            },
        });

        if (!issue) {
            throw new Error("Issue not found for this board");
        }

        return issue;
    }

    private async ensureSectionInBoard(sectionId: string, boardId: string) {
        const section = await prisma.section.findFirst({
            where: {
                id: sectionId,
                boardId,
            },
        });

        if (!section) {
            throw new Error("Section not found for this board");
        }

        return section;
    }

    initHandler() {
        this.ws.on("message", async (data) => {
            try {
                const parsedData = JSON.parse(data.toString());
                switch (parsedData.type) {
                    case "join": {
                        const isValid = JoinRoomSchema.safeParse(parsedData.payload);
                        if (!isValid.success) {
                            this.sendError("Invalid payload for join");
                            return;
                        }

                        const token = parsedData.payload.token;
                        const organizationId = parsedData.payload.organizationId;

                        let user;
                        try {
                            user = jwt.verify(token, jwtSecret as string);
                        } catch {
                            this.sendError("Invalid token");
                            return;
                        }

                        this.id = (user as jwt.JwtPayload).userId;
                        const userDetail = await prisma.user.findUnique({
                            where: { id: this.id },
                        });

                        if (!userDetail) {
                            this.sendError("User not found");
                            return;
                        }

                        await this.ensureOrganizationMembership(this.id, organizationId);

                        const boards = await prisma.board.findMany({
                            where: { organisationId: organizationId },
                        });

                        if (!boards.length) {
                            this.sendError("No boards found for this organization");
                            return;
                        }

                        const firstBoard = boards[0];
                        if (!firstBoard) {
                            this.sendError("No boards found for this organization");
                            return;
                        }

                        const boardId = firstBoard.id;
                        const repo = await prisma.repository.findFirst({
                            where: { boardId },
                        });
                        const sections = await prisma.section.findMany({
                            where: { boardId },
                            select: { id: true, title: true },
                        });
                        const issues = await prisma.issue.findMany({
                            where: { boardId },
                        });

                        this.username = userDetail.username;
                        this.id = userDetail.id;
                        UserManager.getInstance().addUser(boardId, this);
                        issues.forEach((issue) => {
                            IssueManager.getInstance().addTask(boardId, issue);
                        });

                        this.ws.send(
                            JSON.stringify({
                                type: "init-state",
                                payload: {
                                    user: {
                                        id: this.id,
                                        username: this.username,
                                    },
                                    boards,
                                    sections,
                                    issues,
                                    boardId,
                                    users: UserManager.getInstance().getUsers(boardId),
                                    repository: repo ?? null,
                                },
                            })
                        );
                        break;
                    }

                    case "change-board": {
                        const isValid = ChangeBoardSchema.safeParse(parsedData.payload);
                        if (!isValid.success) {
                            this.sendError("Invalid payload for change-board");
                            return;
                        }

                        if (!this.id) {
                            this.sendError("Unauthorized");
                            return;
                        }

                        const { newBoardId, currentBoardId } = parsedData.payload;
                        await this.ensureBoardMembership(this.id, newBoardId);

                        UserManager.getInstance().RemoveUser(currentBoardId, this);
                        UserManager.getInstance().addUser(newBoardId, this);

                        const sectionsForBoard = await prisma.section.findMany({
                            where: { boardId: newBoardId },
                        });
                        const repo = await prisma.repository.findFirst({
                            where: { boardId: newBoardId },
                        });
                        const issuesForBoard = await prisma.issue.findMany({
                            where: { boardId: newBoardId },
                        });

                        issuesForBoard.forEach((issue) => {
                            IssueManager.getInstance().addTask(newBoardId, issue);
                        });

                        this.ws.send(
                            JSON.stringify({
                                type: "update-sections",
                                payload: {
                                    sections: sectionsForBoard,
                                    issues: issuesForBoard,
                                    repository: repo ?? null,
                                },
                            })
                        );
                        break;
                    }

                    case "create-task": {
                        const isValid = CreateTaskSchema.safeParse(parsedData.payload);
                        if (!isValid.success) {
                            this.sendError("Invalid payload for create-task");
                            return;
                        }

                        if (!this.id) {
                            this.sendError("Unauthorized");
                            return;
                        }

                        const { title, description, boardId, sectionId } = parsedData.payload;
                        await this.ensureBoardMembership(this.id, boardId);
                        await this.ensureSectionInBoard(sectionId, boardId);

                        const newIssue = await prisma.issue.create({
                            data: {
                                title,
                                description,
                                boardId,
                                sectionId,
                                createdBy: this.id,
                            },
                        });

                        IssueManager.getInstance().addTask(boardId, newIssue);
                        UserManager.getInstance().broadcast(
                            boardId,
                            this,
                            JSON.stringify({
                                type: "create-task",
                                payload: {
                                    id: newIssue.id,
                                    title: newIssue.title,
                                    sectionId: newIssue.sectionId,
                                },
                            })
                        );
                        break;
                    }

                    case "update-section": {
                        const issueId = parsedData.payload.issueId;
                        const updatedSection = parsedData.payload.updatedSection;
                        const boardId = parsedData.payload.boardId;

                        if (!this.id) {
                            this.sendError("Unauthorized");
                            return;
                        }

                        await this.ensureBoardMembership(this.id, boardId);
                        await this.ensureIssueInBoard(issueId, boardId);
                        await this.ensureSectionInBoard(updatedSection, boardId);

                        try {
                            await prisma.issue.update({
                                where: { id: issueId },
                                data: { sectionId: updatedSection },
                            });
                        } catch (error: any) {
                            this.sendError(error.message || "Failed to update task section");
                            return;
                        }

                        IssueManager.getInstance().changeSection(boardId, issueId, updatedSection);
                        UserManager.getInstance().broadcast(
                            boardId,
                            this,
                            JSON.stringify({
                                type: "update-issue",
                                payload: { issueId, updatedSection },
                            })
                        );
                        break;
                    }

                    case "add-section": {
                        const isValid = CreateSectionSchema.safeParse(parsedData.payload);
                        if (!isValid.success) {
                            this.sendError("Invalid payload for add-section");
                            return;
                        }

                        if (!this.id) {
                            this.sendError("Unauthorized");
                            return;
                        }

                        const { title, boardId } = parsedData.payload;
                        await this.ensureBoardMembership(this.id, boardId);

                        const createdSection = await prisma.section.create({
                            data: {
                                title,
                                boardId,
                                createdBy: this.id,
                            },
                        });

                        UserManager.getInstance().broadcast(
                            boardId,
                            this,
                            JSON.stringify({
                                type: "create-section",
                                payload: {
                                    section: createdSection,
                                    boardId,
                                },
                            })
                        );
                        break;
                    }

                    case "delete-section": {
                        const isValid = DeleteSectionSchema.safeParse(parsedData.payload);
                        if (!isValid.success) {
                            this.sendError("Invalid payload for delete-section");
                            return;
                        }

                        if (!this.id) {
                            this.sendError("Unauthorized");
                            return;
                        }

                        const { sectionId, boardId } = parsedData.payload;
                        await this.ensureBoardMembership(this.id, boardId);
                        await this.ensureSectionInBoard(sectionId, boardId);

                        try {
                            await prisma.section.delete({
                                where: { id: sectionId },
                            });
                        } catch (error: any) {
                            this.sendError(error.message || "Failed to delete section");
                            return;
                        }

                        UserManager.getInstance().broadcast(
                            boardId,
                            this,
                            JSON.stringify({
                                type: "delete-section",
                                payload: { sectionId, boardId },
                            })
                        );
                        break;
                    }

                    case "move-task": {
                        const isValid = MoveTaskSchema.safeParse(parsedData.payload);
                        if (!isValid.success) {
                            this.sendError("Invalid payload for move-task");
                            return;
                        }

                        if (!this.id) {
                            this.sendError("Unauthorized");
                            return;
                        }

                        const { issueId, updatedSection, boardId } = parsedData.payload;
                        await this.ensureBoardMembership(this.id, boardId);
                        await this.ensureIssueInBoard(issueId, boardId);
                        await this.ensureSectionInBoard(updatedSection, boardId);

                        try {
                            await prisma.issue.update({
                                where: { id: issueId },
                                data: { sectionId: updatedSection },
                            });
                        } catch (error: any) {
                            this.sendError(error.message || "Failed to move task");
                            return;
                        }

                        IssueManager.getInstance().changeSection(boardId, issueId, updatedSection);
                        UserManager.getInstance().broadcast(
                            boardId,
                            this,
                            JSON.stringify({
                                type: "update-issue",
                                payload: { issueId, updatedSection },
                            })
                        );
                        break;
                    }

                    case "delete-task": {
                        const isValid = DeleteTaskSchema.safeParse(parsedData.payload);
                        if (!isValid.success) {
                            this.sendError("Invalid payload for delete-task");
                            return;
                        }

                        if (!this.id) {
                            this.sendError("Unauthorized");
                            return;
                        }

                        const { issueId, boardId } = parsedData.payload;
                        await this.ensureBoardMembership(this.id, boardId);
                        await this.ensureIssueInBoard(issueId, boardId);

                        try {
                            await prisma.issue.delete({
                                where: { id: issueId },
                            });
                        } catch (error: any) {
                            this.sendError(error.message || "Failed to delete task");
                            return;
                        }

                        IssueManager.getInstance().deleteTask(boardId, issueId);
                        UserManager.getInstance().broadcast(
                            boardId,
                            this,
                            JSON.stringify({
                                type: "delete-issue",
                                payload: { issueId },
                            })
                        );
                        break;
                    }

                    case "create-board": {
                        const isValid = CreateBoardSchema.safeParse(parsedData.payload);
                        if (!isValid.success) {
                            this.sendError("Invalid payload for create-board");
                            return;
                        }

                        if (!this.id) {
                            this.sendError("Unauthorized");
                            return;
                        }

                        const { title, organizationId } = parsedData.payload;
                        const membership = await this.ensureOrganizationMembership(this.id, organizationId);
                        if (membership.role !== "ADMIN") {
                            this.sendError("Forbidden");
                            return;
                        }

                        const createdBoard = await prisma.board.create({
                            data: {
                                title,
                                organisationId: organizationId,
                            },
                        });

                        UserManager.getInstance().broadcast(
                            organizationId,
                            this,
                            JSON.stringify({
                                type: "create-board",
                                payload: {
                                    board: createdBoard,
                                    organizationId,
                                },
                            })
                        );
                        break;
                    }

                    default:
                        this.sendError(`Unknown message type: ${parsedData.type ?? "undefined"}`);
                }
            } catch (error: any) {
                this.sendError(error.message || "Unexpected error");
            }
        });

        this.ws.on("close", () => {
            UserManager.getInstance().RemoveUserFromAllBoards(this);
        });
    }

    destroy() {
        // intentionally left empty as a lifecycle hook
    }
}