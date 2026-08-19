import { getRandmomId } from "../utils/generateRandomId";
import type WebSocket from "ws";
import jwt from 'jsonwebtoken';
import { prisma } from "@repo/db";
import { UserManager } from "./UserManager";

const JWTSECRET = process.env.JWTSECRET

export class User {
    public id: number;
    public username: string;
    public ws: WebSocket;

    constructor(ws: WebSocket) {
        this.id = getRandmomId();
        this.ws = ws;
        this.initHandler()   
    }

    initHandler() {
        this.ws.on('message', async(data) => {
            const parsedData = JSON.parse(data.toString());
            switch (parsedData.type) {
                case 'join':
                    const token = parsedData.payload.token;
                    let user;
                    try {
                        user = jwt.verify(token, JWTSECRET!);
                    } catch (error) {
                        console.error("error",error)
                        this.ws.send("error while fetching user detail from token")
                        return;
                    }
                    this.id = (user as jwt.JwtPayload).userId;
                    // const userDetail = await prisma.

                    this.ws.send(JSON.stringify({
                        type:"init_message",
                        payload:{
                            id:this.id,
                            users: UserManager.getInstance().getUsers       
                        }
                    }))
                    break;

                default:
                    console.log('Unknown message type: %s', parsedData.type);
            }
        });
    }


}