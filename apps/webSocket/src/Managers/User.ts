import { getRandmomId } from "../utils/generateRandomId";
import type WebSocket from "ws";
import jwt from 'jsonwebtoken';
import { prisma } from "@repo/db";
import { UserManager } from "./UserManager";

const JWTSECRET = process.env.JWTSECRET

export class User {
    public id: string;
    public username: string;
    public ws: WebSocket;

    constructor(ws: WebSocket) {
        this.ws = ws;
        this.username =''
        this.initHandler()   
    }

    initHandler() {
        this.ws.on('message', async(data) => {
            const parsedData = JSON.parse(data.toString());
            switch (parsedData.type) {
                case 'join':
                    const token = parsedData.payload.token;
                    const boardId = parsedData.payload.boardId 
                    let user;
                    try {
                        user = jwt.verify(token, JWTSECRET!);
                    } catch (error) {
                        console.error("error",error)
                        this.ws.send("error while fetching user detail from token")
                        return;
                    }
                    this.id = (user as jwt.JwtPayload).userId;
                    const userDetail = await prisma.user.findUnique({
                        where:{
                            id : this.id
                        }
                    })
                    const issues = prisma.issue.findMany({
                        where:{
                            boardId:boardId
                        }
                    })
                    if(!userDetail || !issues) return;
                    this.username = userDetail.username;
                    this.id = userDetail.id;
                    this.ws.send(JSON.stringify({
                        type:"init-state",
                        payload:{
                            id: this.id,
                            users: UserManager.getInstance().getUsers(),
                            issues: issues
                        }
                    }))

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