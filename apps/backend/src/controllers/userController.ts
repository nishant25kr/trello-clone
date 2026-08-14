import type { Request, Response } from 'express';
import { prisma } from "@repo/db";

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
    console.log("Received request to create user:", req.body);
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

export default { getUser, createUser };
