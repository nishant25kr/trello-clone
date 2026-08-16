import type { Response, Request } from "express";
import { prisma } from "@repo/db"
import { createBoardSchema } from "../types";

const createBoard = async (req: Request, res: Response) => {
    console.log("hello from createboard")
    const parsedData = createBoardSchema.safeParse(req.body);
    console.log("parseddata",parsedData)
    if (!parsedData.success) return res.status(400).json({ message: "Validation failed" });

    try {
        const board = await prisma.board.create({
            data: {
                title: parsedData.data.title,
                organisationId: parsedData.data.organizationId
            }
        })

        if (!board) return res.status(400).json({ messag: "Error while craeting board" })

        return res.status(200).json({ data: board });
    } catch (error: any) {
        return res.status(400).json({ message: error.message })
    }
}

const getBoard = async (req: Request, res: Response) => {
    try {
        const boards = await prisma.board.findMany();

        if (!boards) return res.status(404).json({ message: "Error in fetching board" })

        return res.status(200).json({
            boards: boards
        })

    } catch (error) {
        return res.status(400).json({ message: "Internal server error" })
    }
}

export {
    createBoard,
    getBoard
}