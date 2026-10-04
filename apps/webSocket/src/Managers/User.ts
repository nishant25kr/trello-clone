import type WebSocket from "ws";
import jwt from 'jsonwebtoken';
import { prisma } from "@repo/db";
import { UserManager } from "./UserManager";
import { IssueManager } from "./IssueManager";
import { jwtSecret } from '../../config.ts';
import { ChangeBoardSchema, CreateSectionSchema, CreateTaskSchema, DeleteSectionSchema, DeleteTaskSchema, JoinRoomSchema, MoveTaskSchema } from "../utils/PayloadSchema.ts";

export class User {
    public id!: string;
    public username!: string;
    public ws: WebSocket;

    constructor(ws: WebSocket) {
        this.ws = ws;
        this.initHandler()
    }

    initHandler() {
        this.ws.on('message', async (data) => {
            const parsedData = JSON.parse(data.toString());
            switch (parsedData.type) {
                case 'join': {
                    const isValid = JoinRoomSchema.safeParse(parsedData.payload);
                    if (!isValid.success) {
                        this.ws.send(
                            JSON.stringify({
                                type: "error",
                                payload: {
                                    message: "Invalid payload for join"
                                }
                            })
                        )
                        return;
                    }
                    const token = parsedData.payload.token;
                    const organizationId = parsedData.payload.organizationId
                    let user;
                    try {
                        user = jwt.verify(token, jwtSecret as string);
                    } catch (error) {
                        console.error("error", error)
                        this.ws.send(
                            JSON.stringify({
                                type: "error",
                                payload: {
                                    message: "Invalid token"
                                }
                            })
                        )
                        return;
                    }
                    this.id = (user as jwt.JwtPayload).userId;
                    const userDetail = await prisma.user.findUnique({
                        where: {
                            id: this.id
                        }
                    })
                    const boards = await prisma.board.findMany({
                        where: {
                            organisationId: organizationId
                        }
                    })
                    if (!boards) {
                        this.ws.send(
                            JSON.stringify({
                                type: "error",
                                payload: {
                                    message: "No boards found for this organization"
                                }
                            })
                        )
                        return;
                    }
                    const repo = await prisma.repository.findFirst({
                        where: {
                            boardId: boards[0]?.id
                        }
                    })
                    const sections = await prisma.section.findMany({
                        where: {
                            boardId: boards[0]?.id
                        },
                        select: {
                            id: true,
                            title: true,
                        }
                    })
                    const issues = await prisma.issue.findMany({
                        where: {
                            boardId: boards[0]?.id
                        }
                    })
                    if (!issues) {
                        console.error("No issues found for this board")
                    }
                    if (!userDetail) return;
                    this.username = userDetail.username;
                    this.id = userDetail.id;
                    UserManager.getInstance().addUser(boards[0]?.id || "", this);
                    issues.forEach((issue) => {
                        IssueManager.getInstance().addTask(boards[0]?.id || "", issue);
                    })
                    this.ws.send(JSON.stringify({
                        type: "init-state",
                        payload: {
                            user: {
                                id: this.id,
                                username: this.username,
                            },
                            boards,
                            sections,
                            issues,
                            boardId: boards[0]?.id || "",
                            users: UserManager.getInstance().getUsers(boards[0]?.id || ""),
                            repository: repo!
                        }
                    }))
                    break;
                }

                case 'change-board': {
                    console.log("change-board", parsedData.payload)
                    const isValid = ChangeBoardSchema.safeParse(parsedData.payload);
                    if (!isValid.success) {
                        this.ws.send(
                            JSON.stringify({
                                type: "error",
                                payload: {
                                    message: "Invalid payload for change-board"
                                }
                            })
                        )
                        return;
                    }
                    const boardId = parsedData.payload.newBoardId;
                    const currentBoardId = parsedData.payload.currentBoardId;
                    UserManager.getInstance().RemoveUser(currentBoardId, this);
                    UserManager.getInstance().addUser(boardId, this);
                    const sectionsForBoard = await prisma.section.findMany({
                        where: {
                            boardId: boardId
                        }
                    })
                    const repo = await prisma.repository.findFirst({
                        where: {
                            boardId: boardId
                        }
                    })
                    const issuesForBoard = await prisma.issue.findMany({
                        where: {
                            boardId: boardId
                        }
                    })
                    issuesForBoard.forEach((issue) => {
                        IssueManager.getInstance().addTask(boardId, issue);
                    })
                    this.ws.send(JSON.stringify({
                        type: 'update-sections',
                        payload: {
                            sections: sectionsForBoard,
                            issues: issuesForBoard,
                            repository: repo!
                        }
                    }))
                    break;
                }

                case 'create-task': {
                    console.log("create-task", parsedData.payload)
                    const isValid = CreateTaskSchema.safeParse(parsedData.payload);
                    if (!isValid.success) {
                        this.ws.send(
                            JSON.stringify({
                                type: "error",
                                payload: {
                                    message: "Invalid payload for create-task"
                                }
                            })
                        )
                        return;
                    }
                    let newIssue;
                    try {
                        newIssue = await prisma.issue.create({
                            data: {
                                title: parsedData.payload.title,
                                description: parsedData.payload.description,
                                boardId: parsedData.payload.boardId,
                                sectionId: parsedData.payload.sectionId,
                                createdBy: parsedData.payload.createdBy
                            }
                        })
                    } catch (error: any) {
                        console.error("error while creating issue", error)
                        this.ws.send(JSON.stringify({
                            type: "error",
                            payload: {
                                message: error.message
                            }
                        }))
                        return;
                    }
                    IssueManager.getInstance().addTask(parsedData.payload.boardId, newIssue);
                    UserManager.getInstance().broadcast(
                        parsedData.payload.boardId,
                        this,
                        JSON.stringify({
                            type: "create-task",
                            payload: {
                                id: newIssue.id,
                                title: parsedData.payload.title,
                                sectionId: parsedData.payload.sectionId,
                            }
                        }));
                    break;
                }

                case 'update-section': {
                    const issueId = parsedData.payload.issueId;
                    const updatedSection = parsedData.payload.updatedSection;
                    const boardId = parsedData.payload.boardId;
                    try {
                        await prisma.issue.update({
                            where: {
                                id: issueId
                            },
                            data: {
                                sectionId: updatedSection
                            }
                        })
                    } catch (error: any) {
                        console.error("error while updating issue section", error)
                        this.ws.send(JSON.stringify({
                            type: "error",
                            payload: {
                                message: error.message
                            }
                        }))
                        return;
                    }
                    IssueManager.getInstance().changeSection(boardId, issueId, updatedSection)
                    UserManager.getInstance().broadcast(
                        boardId,
                        this,
                        JSON.stringify({
                            type: "update-issue",
                            payload: {
                                issueId,
                                updatedSection
                            }
                        }));
                    break;
                }

                case 'add-section': {
                    const isValid = CreateSectionSchema.safeParse(parsedData.payload);
                    if (!isValid.success) {
                        this.ws.send(
                            JSON.stringify({
                                type: "error",
                                payload: {
                                    message: "Invalid payload for add-section"
                                }
                            })
                        )
                        return;
                    }
                    let createdSection;
                    try {
                        createdSection = await prisma.section.create({
                            data: {
                                title: parsedData.payload.title,
                                boardId: parsedData.payload.boardId,
                                createdBy: this.id
                            }
                        })
                    } catch (error: any) {
                        console.error("error while creating section", error)
                        this.ws.send(JSON.stringify({
                            type: "error",
                            payload: {
                                message: error.message
                            }
                        }))
                        return;
                    }
                    UserManager.getInstance().broadcast(
                        parsedData.payload.boardId,
                        this,
                        JSON.stringify({
                            type: "create-section",
                            payload: {
                                section: createdSection,
                                boardId: parsedData.payload.boardId
                            }
                        }));
                    break;
                }

                case 'delete-section': {
                    const isValid = DeleteSectionSchema.safeParse(parsedData.payload);
                    if (!isValid.success) {
                        this.ws.send(
                            JSON.stringify({
                                type: "error",
                                payload: {
                                    message: "Invalid payload for delete-section"
                                }
                            })
                        )
                        return;
                    }
                    try {
                        await prisma.section.delete({
                            where: {
                                id: parsedData.payload.sectionId
                            }
                        })
                    } catch (error: any) {
                        console.error("error while deleting section", error)
                        this.ws.send(JSON.stringify({
                            type: "error",
                            payload: {
                                message: error.message
                            }
                        }))
                        return;
                    }
                    UserManager.getInstance().broadcast(
                        parsedData.payload.boardId,
                        this,
                        JSON.stringify({
                            type: "delete-section",
                            payload: {
                                sectionId: parsedData.payload.sectionId,
                                boardId: parsedData.payload.boardId
                            }
                        }));
                    break;
                }

                case 'move-task': {
                    const isValid = MoveTaskSchema.safeParse(parsedData.payload);
                    if (!isValid.success) {
                        this.ws.send(
                            JSON.stringify({
                                type: "error",
                                payload: {
                                    message: "Invalid payload for move-task"
                                }
                            })
                        )
                        return;
                    }
                    try {
                        await prisma.issue.update({
                            where: {
                                id: parsedData.payload.issueId
                            },
                            data: {
                                sectionId: parsedData.payload.updatedSection
                            }
                        })
                    } catch (error: any) {
                        console.error("error while moving issue", error)
                        this.ws.send(JSON.stringify({
                            type: "error",
                            payload: {
                                message: error.message
                            }
                        }))
                        return;
                    }
                    IssueManager.getInstance().changeSection(parsedData.payload.boardId, parsedData.payload.issueId, parsedData.payload.updatedSection)
                    UserManager.getInstance().broadcast(
                        parsedData.payload.boardId,
                        this,
                        JSON.stringify({
                            type: "update-issue",
                            payload: {
                                issueId: parsedData.payload.issueId,
                                updatedSection: parsedData.payload.updatedSection
                            }
                        }));
                    break;
                }

                case 'delete-task': {
                    const isValid = DeleteTaskSchema.safeParse(parsedData.payload);
                    if (!isValid.success) {
                        this.ws.send(
                            JSON.stringify({
                                type: "error",
                                payload: {
                                    message: "Invalid payload for delete-task"
                                }
                            })
                        )
                        return;
                    }
                    console.log("message", parsedData.payload)
                    try {
                        await prisma.issue.delete({
                            where: {
                                id: parsedData.payload.issueId
                            }
                        })
                    } catch (error: any) {
                        this.ws.send(
                            JSON.stringify({
                                type: "error",
                                message: error.message
                            })
                        )
                    }
                    IssueManager.getInstance().deleteTask(parsedData.payload.boardId, parsedData.payload.issueId)
                    UserManager.getInstance().broadcast(
                        parsedData.payload.boardId,
                        this,
                        JSON.stringify({
                            type: "delete-issue",
                            payload: {
                                issueId: parsedData.payload.issueId
                            }
                        }));
                    break;
                }

                case 'create-board': {
                    const isValid = CreateSectionSchema.safeParse(parsedData.payload);
                    if (!isValid.success) {
                        this.ws.send(
                            JSON.stringify({
                                type: "error",
                                payload: {
                                    message: "Invalid payload for create-board"
                                }
                            })
                        )
                        return;
                    }
                    const createdBoard = await prisma.board.create({
                        data: {
                            title: parsedData.payload.title,
                            organisationId: parsedData.payload.organizationId
                        }
                    })
                    UserManager.getInstance().broadcast(
                        parsedData.payload.organizationId,
                        this,
                        JSON.stringify({
                            type: "create-board",
                            payload: {
                                board: createdBoard,
                                organizationId: parsedData.payload.organizationId
                            }
                        }));
                    break;
                }

                default:
                    console.log('Unknown message type: %s', parsedData.type);
            }
        });
        this.ws.on('close', () => {
            console.log('Client disconnected');
            UserManager.getInstance().RemoveUserFromAllBoards(this);
        });
    }

    destroy() {
        // this.ws.removeAllListeners('message');

        // if (this.ws.readyState === this.ws.OPEN) {
        //     this.ws.close();
        // }
    }

}