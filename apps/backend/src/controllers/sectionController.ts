import {prisma} from "@repo/db"
import type { Request, Response } from "express"
import { createSectionSchema } from "../types"

const createSection = async (req:Request,res:Response) => {
    const parsedData = createSectionSchema.safeParse(req.body);
    if(!parsedData.success){
        return res.status(400).json({
            message:"Validation failed",
            errors:parsedData.error.flatten()
        })
    }

    try {
        const section = await prisma.section.create({
            data:{
                title: parsedData.data.title,
                boardId: parsedData.data.boardId
            }
        })
        res.status(201).json(section)
    } catch (error) {
        res.status(500).json({
            message: "Failed to create section",
            error
        })
    }
}

const getSection = async(req:Request, res:Response) => {
    try {
        const sections = await prisma.section.findMany();
        if(!sections) return res.status(400).json({ message:"Error fetching sections" })
        
        return res.status(200).json({ sections : sections })
        
    } catch (error: any) {
        return res.status(500).json({message: error.message})
    }
}

export { createSection,getSection }