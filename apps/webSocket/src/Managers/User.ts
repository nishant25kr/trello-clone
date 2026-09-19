import type WebSocket from "ws";
import jwt from 'jsonwebtoken';
import { prisma } from "@repo/db";
import { UserManager } from "./UserManager";
import { IssueManager } from "./IssueManager";

const JWTSECRET = process.env.JWTSECRET

export class User {
    public id!: string;
    public username!: string;
    public ws: WebSocket;

    constructor(ws: WebSocket) {
        this.ws = ws;
        this.initHandler()
        setTimeout(() => {
            console.log("user added", this.username, this.id)
        }, 2000);
    }

    initHandler() {
        this.ws.on('message', async (data) => {
            const parsedData = JSON.parse(data.toString());
            switch (parsedData.type) {
                case 'join':
                    const token = parsedData.payload.token;
                    const organizationId = parsedData.payload.organizationId
                    if (!token || !organizationId) {
                        this.ws.send("error while fetching user detail from token")
                        return;
                    }
                    let user;
                    try {
                        user = jwt.verify(token, JWTSECRET!);
                    } catch (error) {
                        console.error("error", error)
                        this.ws.send("error while fetching user detail from token")
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
                        this.ws.send("no boards found for this organization")
                        return;
                    }
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
                        this.ws.send("no issues found for this board")
                        return;
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
                            users: UserManager.getInstance().getUsers(boards[0]?.id || "")
                        }
                    }))
                    break;

                case 'change-board':
                    const boardId = parsedData.payload.newBoardId;
                    const currentBoardId = parsedData.payload.currentBoardId;
                    UserManager.getInstance().RemoveUser(currentBoardId, this);
                    UserManager.getInstance().addUser(boardId, this);
                    const sectionsForBoard = await prisma.section.findMany({
                        where: {
                            boardId: boardId
                        }
                    })
                    console.log("sectionsForBoard", sectionsForBoard)
                    const issuesForBoard = await prisma.issue.findMany({
                        where: {
                            boardId: boardId
                        }
                    })
                    issuesForBoard.forEach((issue) => {
                        IssueManager.getInstance().addTask(boardId, issue);
                    })
                    console.log("issuesForBoard", issuesForBoard)
                    this.ws.send(JSON.stringify({
                        type: 'update-sections',
                        payload: {
                            sections: sectionsForBoard,
                            issues: issuesForBoard
                        }
                    }))
                    break;

                case 'create-task':
                    const createdBy = parsedData.payload.createdBy;
                    //todo: add createdBy to issue model and add it to the issue object
                    console.log("parsedData", parsedData)
                    let newIssue;
                    try {
                        newIssue = await prisma.issue.create({
                            data: {
                                title: parsedData.payload.title,
                                description: parsedData.payload.description,
                                boardId: parsedData.payload.boardId,
                                sectionId: parsedData.payload.sectionId
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

                case 'update-section':{
                    const issueId = parsedData.payload.issueId;
                    const updatedSection = parsedData.payload.updatedSection;
                    const boardId = parsedData.payload.boardId;
                    await prisma.issue.update({
                        where: {
                            id: issueId
                        },
                        data: {
                            sectionId: updatedSection
                        }
                    })
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
                    }
                    break;

                case 'add-section':
                    const newSection = parsedData.payload.section;
                    const boardIdForSection = parsedData.payload.boardId;
                    const createdSection = await prisma.section.create({
                        data: {
                            title: newSection,
                            boardId: boardIdForSection
                        }
                    })
                    UserManager.getInstance().broadcast(
                        boardIdForSection,
                        this,
                        JSON.stringify({
                            type: "create-section",
                            payload: {
                                section: createdSection,
                                boardId: boardIdForSection
                            }
                        }));
                    break;

                case 'delete-section':
                    const sectionId = parsedData.payload.sectionId;
                    const boardIdForDeleteSection = parsedData.payload.boardId;
                    await prisma.section.delete({
                        where: {
                            id: sectionId
                        }
                    })
                    UserManager.getInstance().broadcast(
                        boardIdForDeleteSection,
                        this,
                        JSON.stringify({
                            type: "delete-section",
                            payload: {
                                sectionId: sectionId,
                                boardId: boardIdForDeleteSection
                            }
                        }));
                    break;

                case 'move-task':
                    const issueIdToMove = parsedData.payload.issueId;
                    const updatedSectionForMove = parsedData.payload.updatedSection;
                    const boardIdForMove = parsedData.payload.boardId;
                    await prisma.issue.update({
                        where: {
                            id: issueIdToMove
                        },
                        data: {
                            sectionId: updatedSectionForMove
                        }
                    })
                    IssueManager.getInstance().changeSection(boardIdForMove, issueIdToMove, updatedSectionForMove)
                    UserManager.getInstance().broadcast(
                        boardIdForMove,
                        this,
                        JSON.stringify({
                            type: "update-issue",
                            payload: {
                                issueId: issueIdToMove,
                                updatedSection: updatedSectionForMove
                            }
                        }));
                    break;

                case 'delete-task':
                    const issueIdToDelete = parsedData.payload.issueId;
                    const boardIdForDelete = parsedData.payload.boardId;
                    await prisma.issue.delete({
                        where: {
                            id: issueIdToDelete
                        }
                    })
                    IssueManager.getInstance().deleteTask(boardIdForDelete, issueIdToDelete)
                    UserManager.getInstance().broadcast(
                        boardIdForDelete,
                        this,
                        JSON.stringify({
                            type: "delete-issue",
                            payload: {
                                issueId: issueIdToDelete
                            }
                        }));
                    break;    

                case 'create-board':{
                    const newBoard = parsedData.payload.board;
                    const organizationId = parsedData.payload.organizationId;
                    const createdBoard = await prisma.board.create({
                        data: {
                            title: newBoard,
                            organisationId: organizationId
                        }
                    })
                    UserManager.getInstance().broadcast(
                        organizationId,
                        this,
                        JSON.stringify({
                            type: "create-board",
                            payload: {
                                board: createdBoard,
                                organizationId: organizationId
                            }
                        }));
                        break;
                }

                default:
                    console.log('Unknown message type: %s', parsedData.type);
            }
        });
    }

    destroy() {
        // this.ws.removeAllListeners('message');

        // if (this.ws.readyState === this.ws.OPEN) {
        //     this.ws.close();
        // }
    }

}