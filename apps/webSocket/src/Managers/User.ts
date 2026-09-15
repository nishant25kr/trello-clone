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
                    if(!token || !organizationId) {
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
                        where:{
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
                    UserManager.getInstance().addUser(this);
                    this.ws.send(JSON.stringify({
                        type: "init-state",
                        payload: {
                            id: this.id,
                            boards,
                            sections,
                            issues,
                            users: UserManager.getInstance().getUsers()
                        }
                    }))
                    break;

                case 'change-board':
                    const boardId = parsedData.payload.boardId;
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
                    console.log("issuesForBoard", issuesForBoard)
                    this.ws.send(JSON.stringify({
                        type: 'update-sections',
                        payload: {
                            sections: sectionsForBoard,
                            issues: issuesForBoard
                        }
                    }))
                    break;

                case 'create-issue':
                    const createdBy = parsedData.payload.createdBy;
                    IssueManager.getInstance().addTask(parsedData.payload.issue);
                    UserManager.getInstance().broadcast(this,
                        JSON.stringify({
                            type: "issue-created",
                            payload: {
                                createdBy: createdBy,
                                issue: parsedData.payload.issue
                            }
                        }));
                    break;

                case 'update-section':
                    const issueId = parsedData.payload.issueId;
                    const updatedSection = parsedData.payload.updatedSection;
                    IssueManager.getInstance().changeSection(issueId, updatedSection)
                    UserManager.getInstance().broadcast(
                        this,
                        JSON.stringify({
                            type: "update-issue",
                            payload: {
                                issueId,
                                updatedSection
                            }
                        }));
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
                        this,
                        JSON.stringify({
                            type: "delete-section",
                            payload: {
                                sectionId: sectionId,
                                boardId: boardIdForDeleteSection
                            }
                        }));
                break;

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