import type { Request, Response } from 'express';
import { prisma } from "@repo/db";
import { createOrgSchema } from '../types';

const getOrg = async (req: Request, res: Response) => {
    const orgId = req.params.id;

    if(!orgId || Array.isArray(orgId)) {
        return res.status(400).json({ error: "Organization ID is required" });
    }

    const org = await prisma.organization.findUnique({
        where: { id: orgId }
    });

    console.log("Fetched organization:", org);

    if (!org) {
        return res.status(404).json({ error: "Organization not found" });
    }
    res.json(org);
};

const createOrg = async (req: Request, res: Response) => {
    const parsedData = createOrgSchema.safeParse(req.body);

    if(!parsedData.success){
        return res.status(404).json({message: "Validation failed"})
    }

    try {
        const userId = parsedData.data.userId
        const user = await prisma.user.findUnique({
            where:{
                id: userId
            }
        })
        
        if(!user) return res.status(400).json({message: "invalid userId, user not found"});


        const org = await prisma.organization.create({
            data:{
                name : parsedData.data.name,
                description: parsedData.data.descriptin
            }
        })

        const membership = await prisma.membership.create({
            data:{
                userId:userId,
                organisationId: org.id,
                role: 'ADMIN'
            }   
        })

        if(!org || !membership) return res.status(400).json({ message: "failed to create organization" });

        return res.status(200).json({message: "organization created successfully"});
    } catch (error) {
        return res.status(400).json({ message: "Internal server error" });
    }
}

export { getOrg, createOrg }