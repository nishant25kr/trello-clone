import type { Request, Response } from "express";
import { prisma } from "@repo/db"
import { createIssueSchema, getIssueSchema, updateIssueSchema } from "../types"

const createIssue = async (req:Request, res: Response) => {
    const parsedData = createIssueSchema.safeParse(req.body);
    console.log(parsedData)

    if(!parsedData.success){
        return res.status(404).json({message: "Validation failed"})
    }
    
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

const getIssue = async(req:Request, res:Response) => {
    
    const parsedData = getIssueSchema.safeParse(req.params.id)
    if(!parsedData.success) return res.status(400).json({message : "validation failed"})

    try {
        const issue = await prisma.issue.findUnique({
            where:{
                id : parsedData.data
            }
        })

        if(!issue) return res.status(400).json({ message: "Failed to fetch issue" })

        return res.status(200).json({issue: issue})
    } catch (error) {
        return res.status(500).json({message:"Internal server error"})
    }
}

const updateIssue = async(req:Request, res:Response) => {
    const parsedData = updateIssueSchema.safeParse(req.body)
    if(!parsedData.success) return res.status(400).json({message : "validation failed"})

    try {
        const issue = await prisma.issue.update({
            where:{
                id : parsedData.data.id
            },
            data: req.body
        })

        if(!issue) return res.status(400).json({ message: "Failed to update issue" })

        return res.status(200).json({issue: issue})
    } catch (error) {
        return res.status(500).json({message:"Internal server error"})
    }
}

export { 
    createIssue, 
    getIssue,
    updateIssue
};