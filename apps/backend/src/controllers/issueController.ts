import type { Request, Response } from "express";
import { prisma } from "@repo/db"
import { createIssueSchema } from "../types"

const createIssue = async (req:Request, res: Response) => {
    const parsedData = createIssueSchema.safeParse(req.body);
    if(!parsedData.success) return res.status(400).json({message: 'validation failed'})

    try {
        const issue = await prisma.issue.create({
            data:{
                title: parsedData.data.title,
                description: parsedData.data.description,
                boardId: parsedData.data.boardId,
                sectionId: parsedData.data.sectionId
            }
        })
        if(!issue) return res.status(400).json({message: "error creating issue"})
        return res.status(200).json({messag: "issue created success",data: issue})
    } catch (error: any) {
        return res.status(400).json({message: error.message});
    }


}

export { createIssue };