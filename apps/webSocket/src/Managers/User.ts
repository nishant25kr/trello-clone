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
                        }
                    })
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
                            users: UserManager.getInstance().getUsers()

                        }
                    }))
                    break;

                case 'change-board':
                    const boardId = parsedData.payload.boardId;
                    console.log("boardId", boardId)
                    const sectionsForBoard = await prisma.section.findMany({
                        where: {
                            boardId: boardId
                        }
                    })
                    console.log("sectionsForBoard", sectionsForBoard)
                    this.ws.send(JSON.stringify({
                        type: 'update-sections',
                        payload: {
                            sections: sectionsForBoard
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