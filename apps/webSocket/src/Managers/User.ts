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
                    const boardId = parsedData.payload.boardId
                    if(!token || !boardId){
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
                    const issues = prisma.issue.findMany({
                        where: {
                            boardId: boardId
                        }
                    })
                    if (!userDetail || !issues) return;
                    this.username = userDetail.username;
                    this.id = userDetail.id;
                    UserManager.getInstance().addUser(this);
                    (await issues).forEach((item) =>
                        IssueManager.getInstance().addTask(item)
                    )
                    this.ws.send(JSON.stringify({
                        type: "init-state",
                        payload: {
                            id: this.id,
                            users: UserManager.getInstance().getUsers(),
                            issues: issues
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
                    const updatedSection = parsedData.paylaod.updatedSection;
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