import type { Request, Response } from "express";
import { prisma } from "@repo/db";

const startAgentJob = async (req: Request, res: Response) => {
    const issueId = req.params.issueId;
    if (!issueId || Array.isArray(issueId)) {
        return res.status(400).json({ message: "Task ID is required" });
    }

    try {
        const issue = await prisma.issue.findUnique({
            where: { id: issueId },
            include: { board: { include: { repositories: true } } },
        });

        if (!issue) return res.status(404).json({ message: "Task not found" });

        const repository = issue.board.repositories[0];
        if (!repository) {
            return res.status(409).json({ message: "Connect a GitHub repository to this board first" });
        }

        const job = await prisma.agentJob.create({
            data: {
                taskId: issue.id,
                repositoryId: repository.id,
                status: "QUEUED",
                logs: "Waiting for an agent worker",
            },
        });

        return res.status(202).json({ job });
    } catch (error) {
        console.error("Unable to queue agent job:", error);
        return res.status(500).json({ message: "Unable to start agent job" });
    }
};

const getAgentJob = async (req: Request, res: Response) => {
    const jobId = req.params.jobId;
    if (!jobId || Array.isArray(jobId)) {
        return res.status(400).json({ message: "Job ID is required" });
    }

    try {
        const job = await prisma.agentJob.findUnique({
            where: { id: jobId },
            select: {
                id: true,
                taskId: true,
                status: true,
                branchName: true,
                logs: true,
                resultDiff: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!job) return res.status(404).json({ message: "Agent job not found" });
        return res.json({ job });
    } catch (error) {
        console.error("Unable to fetch agent job:", error);
        return res.status(500).json({ message: "Unable to fetch agent job" });
    }
};

export { startAgentJob, getAgentJob };
