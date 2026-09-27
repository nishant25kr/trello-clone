import { prisma } from "@repo/db";
import { lstat, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { Sandbox } from 'e2b'
import { KeyObject } from "node:crypto";
import dotenv from "dotenv"
dotenv.config()


const REPO_DIR = "/home/user/repo";
const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const pollingIntervalMs = 2_000;
const maxIterations = 12;
const maxFileBytes = 100_000;

const API_KEY = process.env.E2B_API_KEY
console.log(API_KEY);
if (!API_KEY) {
    console.log("no api key");
}

async function executeTool(root: string, name: string, args: Record<string, unknown>) {
    if (name === "list_files") return await listFiles(root);

    if (name === "read_file") {
        const path = await safePath(root, String(args.path ?? ""));
        const content = await Bun.file(path).text();
        if (new TextEncoder().encode(content).byteLength > maxFileBytes) {
            throw new Error("File is too large to read");
        }
        return content;
    }

    if (name === "write_file") {
        const path = await safePath(root, String(args.path ?? ""));
        const content = args.content;
        if (typeof content !== "string") throw new Error("File content must be text");
        if (new TextEncoder().encode(content).byteLength > maxFileBytes) {
            throw new Error("File is too large to write");
        }
        await mkdir(dirname(path), { recursive: true });
        await Bun.write(path, content);
        return `Wrote ${relative(root, path)}`;
    }

    throw new Error(`Unsupported tool: ${name}`);
}

const tools = [
    {
        type: "function",
        function: {
            name: "list_files",
            description: "List tracked files in the repository.",
            parameters: { type: "object", properties: {}, additionalProperties: false },
        },
    },
    {
        type: "function",
        function: {
            name: "read_file",
            description: "Read a UTF-8 text file from the repository.",
            parameters: {
                type: "object",
                properties: { path: { type: "string" } },
                required: ["path"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "write_file",
            description: "Create or replace a UTF-8 text file in the repository.",
            parameters: {
                type: "object",
                properties: {
                    path: { type: "string" },
                    content: { type: "string" },
                },
                required: ["path", "content"],
                additionalProperties: false,
            },
        },
    },
];


async function startAgent(details: any) {
    try {

        const sandbox = await Sandbox.create({ apiKey: API_KEY });

        console.log("Sandbox created:", sandbox.sandboxId);

        // 1. Clone repository
        const clone = await sandbox.commands.run(
            `git clone ${details.repositoryUrl}`,
            { timeoutMs: 120_000 }
        );

        if (clone.exitCode !== 0) {
            throw new Error(`Clone failed: ${clone.stderr}`);
        }

        // 2. Configure Git
        await sandbox.commands.run(
            "git config user.name 'AI Issue Solver' && " +
            "git config user.email 'ai-issue-solver@users.noreply.github.com'",
            { cwd: REPO_DIR }
        );

        // 3. Create a dedicated branch
        await sandbox.commands.run(
            `git checkout -b ${details.branchName}`,
            { cwd: REPO_DIR }
        );

        const askpassPath = "/tmp/git-askpass.sh";

        await sandbox.files.write(
            askpassPath,
            [
                "#!/bin/sh",
                'case "$1" in',
                '  *Username*) echo "x-access-token" ;;',
                '  *) echo "$GITHUB_TOKEN" ;;',
                "esac",
                "",
            ].join("\n")
        );

        await sandbox.commands.run(
            `chmod 700 ${askpassPath}`,
            { cwd: REPO_DIR }
        );

        const instructions = `
You are an autonomous software engineering agent.

Your task is to solve the provided GitHub issue.

Repository: ${details.repositoryUrl}
Task: #${details.task.title}
Title: ${details.task.title}

Issue description:
${details.task.description}

Instructions:
1. Explore the repository before changing code.
2. Identify the root cause of the task.
3. Inspect all relevant files.
4. Modify as many files as necessary.
5. Add or update tests where appropriate.
6. Run relevant tests and build checks.
7. If tests fail, investigate and attempt to fix the problem.
8. Review your changes before finishing.
9. Do not commit or push. The backend handles Git operations.
10. Do not claim tests passed unless you actually ran them.
11. Do not read secrets, environment files, or Git credentials.
12. Do not perform unrelated changes.

Use the provided tools to inspect and modify the repository.
`;












    } catch (error) {


    } finally {
        // if (workspace) await rm(workspace, { recursive: true, force: true });
    }
}

async function processJob(jobId: string) {
    const job = await prisma.agentJob.findUnique({
        where: { id: jobId },
        include: { task: true, repository: true },
    });
    if (!job) return;
    console.log("job", job)

    let workspace: string | undefined;
    try {
        if (!/^[A-Za-z0-9_.-]+$/.test(job.repository.owner) || !/^[A-Za-z0-9_.-]+$/.test(job.repository.name)) {
            throw new Error("Repository owner or name is invalid");
        }

        workspace = await mkdtemp(join(tmpdir(), "trello-agent-"));
        const repositoryUrl = `https://github.com/${job.repository.owner}/${job.repository.name}.git`;
        const branchName = `agent/${job.id}`;

        await prisma.agentJob.update({
            where: { id: job.id },
            data: { branchName },
        });

        const details = {
            jobId: job.id,
            repositoryUrl: repositoryUrl,
            branchName: branchName,
            task: {
                title: job.task.title,
                description: job.task.description
            }
        }

        // const { summary, activity } = await askAgent(workspace, job.task.title, job.task.description);
        const summary = await startAgent(details);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Agent job failed";
        await prisma.agentJob.update({
            where: { id: job.id },
            data: { status: "FAILED", logs: message.slice(0, 50_000) },
        });
        console.error(`Agent job ${job.id} failed:`, message);
    } finally {
        if (workspace) await rm(workspace, { recursive: true, force: true });
    }
}

async function claimJob() {
    const queued = await prisma.agentJob.findFirst({
        where: { status: "QUEUED" },
        orderBy: { createdAt: "asc" },
        select: { id: true },
    });
    console.log("queued", queued);
    if (!queued) return false;

    const claim = await prisma.agentJob.updateMany({
        where: { id: queued.id, status: "QUEUED" },
        data: { status: "RUNNING", logs: "Cloning repository and starting agent" },
    });
    if (claim.count !== 1) return false;

    await processJob(queued.id);
    return true;
}

console.log("Agent worker started; polling for queued jobs");
// while (true) {
//     try {
//         // const claimed = await claimJob();
//         // if (!claimed) await new Promise(resolveDelay => setTimeout(resolveDelay, pollingIntervalMs));
//     } catch (error) {
//         console.error("Agent worker poll failed:", error);
//         await new Promise(resolveDelay => setTimeout(resolveDelay, pollingIntervalMs));
//     }
// }

