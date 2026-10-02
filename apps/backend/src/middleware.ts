import type { NextFunction, Request, Response } from "express";
import { jwtSecret } from '../config.ts';
import jwt from "jsonwebtoken";

export const Middleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Token missing" });
    }

    try {
        const decodedToken = jwt.verify(token, jwtSecret as string);
        console.log("Decoded Token:", decodedToken);
        (req as any).user = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
}