import type { Request, Response } from 'express';
import { prisma } from "@repo/db";
import { createOrgSchema, type AuthenticatedRequest } from '../types';

const getOrg = async (req: Request, res: Response) => {
    const userID = (req as unknown as AuthenticatedRequest).user.userId;
    console.log(userID)
    if (!userID || Array.isArray(userID)) {
        return res.status(400).json({ error: "Organization ID is required" });
    }

    const org = await prisma.membership.findMany({
        where: {
            userId: userID
        }
    })

    const response = await prisma.organization.findMany({
        where: {
            id: {
                in: org.map(o => o.organisationId)
            }
        }
    });

    if (!org) {
        return res.status(404).json({ error: "Organization not found" });
    }
    res.json(response);
};

const createOrg = async (req: Request, res: Response) => {
    const parsedData = createOrgSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(404).json({ message: "Validation failed" })
    }
    console.log(parsedData)
    console.log("user", (req as unknown as AuthenticatedRequest).user.userId)

    try {
        const org = await prisma.organization.create({
            data: {
                name: parsedData.data.name,
                description: parsedData.data.description
            }
        })


        const membership = await prisma.membership.create({
            data: {
                userId: (req as unknown as AuthenticatedRequest).user.userId,
                organisationId: org.id,
                role: 'ADMIN'
            }
        })

        if (!org || !membership) return res.status(400).json({ message: "failed to create organization" });

        return res.status(200).json({ message: "organization created successfully", data: org });
    } catch (error) {
        return res.status(500).json({ message: "failed to create organization", error });
    }
}

export { getOrg, createOrg }