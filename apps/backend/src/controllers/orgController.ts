import type { Request, Response } from 'express';
import { prisma } from "@repo/db";
import { createOrgSchema, type AuthenticatedRequest } from '../types';

const getOrg = async (req: Request, res: Response) => {
    const authReq = req as unknown as AuthenticatedRequest;
    if (!authReq.user?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const userID = authReq.user.userId;
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
    const authReq = req as unknown as AuthenticatedRequest;
    if (!authReq.user?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const org = await prisma.organization.create({
            data: {
                name: parsedData.data.name,
                description: parsedData.data.description
            }
        })

        if (!org) return res.status(400).json({ message: "failed to create organization" });

        const userId = authReq.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const membership = await prisma.membership.create({
            data: {
                userId,
                organisationId: org.id,
                role: 'ADMIN',
            }
        })

        if (!org || !membership) return res.status(400).json({ message: "failed to create organization" });

        return res.status(200).json({ message: "organization created successfully", data: org });
    } catch (error: any) {
        return res.status(500).json({ message: "failed to create organization", error: error.message });
    }
}

export { getOrg, createOrg }