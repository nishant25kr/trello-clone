import type { Request, Response } from 'express';
import {prisma} from "@repo/db"
import {createMembership, inviteUserSchema} from "../types/index"

const createmembership = async (req:Request, res: Response) =>{
    const parsedData = createMembership.safeParse(req.body)
    if(!parsedData.success) return res.status(404).json({ message: "Validation failed" })

    try {        
        const membership = await prisma.membership.create({
            data:{
                userId:parsedData.data.userId,
                organisationId: parsedData.data.organizationId,
                role: parsedData.data.role === "member" ? "MEMBER" : "ADMIN"
            }
        })             

        if(!membership) return res.status(400).json({message: "Error in creating member"});

        return res.status(200).json({message:"Member created successfully"})

    } catch (error: any) {
        return res.status(400).json({message: error.message})
    }
}

const invite = async (req:Request, res:Response) => {
    const parsedData = inviteUserSchema.safeParse(req.body);
    if(!parsedData.success) return res.status(404).json({message: "Validation failed"});

    try {
        const user = await prisma.user.findUnique({
            where:{
                username: parsedData.data.username
            }
        })
        if(!user ) return ;
        const membership = await prisma.membership.create({
            data: {
                userId: user.id,
                organisationId:parsedData.data.organisationId,
                role:"MEMBER"
            }
        })

          if(!membership) return res.status(400).json({message: "Error in creating member"});

        return res.status(200).json({message:"Member created successfully"})

    } catch (error : any) {
        console.log(error)
                return res.status(400).json({message: error.message})

    }
}

export { createmembership };