import type { Request, Response } from 'express';
import { prisma } from "@repo/db";
import { signInSchema } from '../types';
import jwt from "jsonwebtoken"
 
const getUser = async (req: Request, res: Response) => {
    const userId = req.params.id;
    
    if(!userId || Array.isArray(userId)) {
        return res.status(400).json({ error: "User ID is required" });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
};

const createUser = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    console.log("Received request to create user:", { username, password });
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }
    try {
        const user = await prisma.user.create({
            data: { username: username, password: password }
        });

        console.log("User created successfully:", user);
        if(!user) {
            return res.status(500).json({ error: "Error creating user" });
        }
        res.status(201).json(user);

    } catch (error: any) {
        console.error("Error creating user:", error);
        return res.status(500).json({ errorj: error });
    }

};

const signIn = async (req:Request, res:Response) => {
    const parsedData = signInSchema.safeParse(req.body);
    console.log(parsedData)
    if(!parsedData.success){
        return res.status(400).json({ message:"Validation failed "});
    }
    try {
        const user = await prisma.user.findUnique({
            where:{
                username: parsedData.data.username
            }
        })
        console.log("user",user)
        //todo: add bcrypt while saving the password in db
        if(!user) return res.status(400).json({ message:"invalid username" })
        if(user.password !== parsedData.data.password){
            return res.status(400).json({message:"Wrong password"})
        }
        console.log('jwt',process.env.JWTSECRET)
        const token = jwt.sign({
            userId : user.id,
            username: user.username,
            //todo:figure out how to store user role
            // role : user.role
        },process.env.JWTSECRET!)
        if(!token) return res.status(400).json( {message:'Error while creating token'} )
        
        return res.status(200).json({user:user, token: token});
        
    } catch (error:any) {
        return res.status(500).json({ message: error.message });
    }
}

export  { 
    getUser,
    createUser, 
    signIn
};