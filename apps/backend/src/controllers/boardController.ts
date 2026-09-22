import type { Response, Request } from "express";
import { prisma } from "@repo/db"
import { connectRepositorySchema, createBoardSchema } from "../types";

function parseGitHubRepositoryUrl(value: string) {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        return null;
    }

    if (url.hostname !== "github.com") return null;

    const [owner, name] = url.pathname.split("/").filter(Boolean);
    if (!owner || !name || name.includes(".")) return null;

    return { owner, name };
}

const getRepositoryBranches = async (req: Request, res: Response) => {
    const repository = parseGitHubRepositoryUrl(String(req.query.url ?? ""));
    if (!repository) {
        return res.status(400).json({ message: "A valid public GitHub repository URL is required" });
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${repository.owner}/${repository.name}`,
            { headers: { Accept: "application/vnd.github+json" } },
        );

        if (!response.ok) {
            return res.status(response.status).json({ message: "GitHub repository not found or unavailable" });
        }

        const data = await response.json() as {
            id: number;
            name: string;
            owner: { login: string };
            default_branch: string;
        };

        const branchesResponse = await fetch(
            `https://api.github.com/repos/${data.owner.login}/${data.name}/branches`,
            { headers: { Accept: "application/vnd.github+json" } },
        );
        const branches = branchesResponse.ok
            ? await branchesResponse.json() as Array<{ name: string }>
            : [];

        return res.json({
            githubId: String(data.id),
            owner: data.owner.login,
            name: data.name,
            defaultBranch: data.default_branch,
            branches: branches.map(branch => branch.name),
        });
    } catch {
        return res.status(502).json({ message: "Unable to reach GitHub" });
    }
};

const connectRepository = async (req: Request, res: Response) => {
    const parsedData = connectRepositorySchema.safeParse(req.body);
    const boardId = String(req.params.boardId ?? "");

    if (!boardId || !parsedData.success) {
        return res.status(400).json({ message: "Board and repository details are required" });
    }

    try {
        const board = await prisma.board.findUnique({ where: { id: boardId } });
        if (!board) return res.status(404).json({ message: "Board not found" });

        const repository = await prisma.repository.create({
            data: {
                ...parsedData.data,
                boardId,
            },
        });

        return res.status(201).json({ data: repository });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

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
    getBoard,
    getRepositoryBranches,
    connectRepository,
}