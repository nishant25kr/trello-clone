import { prisma } from "@repo/db";
import { lstat, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { Sandbox } from 'e2b'


const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const pollingIntervalMs = 2_000;
const maxIterations = 12;
const maxFileBytes = 100_000;

async function runCommand(command: string, args: string[], cwd?: string) {
    const child = Bun.spawn([command, ...args], {
        cwd,
        stdout: "pipe",
        stderr: "pipe",
        timeout: 120_000,
    });
    const [stdout, stderr] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
    ]);
    const exitCode = await child.exited;
    if (exitCode !== 0) {
        throw new Error(`${command} failed (${exitCode}): ${stderr.slice(0, 2_000)}`);
    }
    return stdout;
}

async function safePath(root: string, filePath: string) {
    if (!filePath || isAbsolute(filePath)) throw new Error("Use a relative file path");

    const target = resolve(root, filePath);
    const relativePath = relative(root, target);
    if (!relativePath || relativePath.startsWith(`..${sep}`) || relativePath === "..") {
        throw new Error("Path must stay inside the repository");
    }

    const segments = relativePath.split(sep);
    if (segments.some(segment => segment === ".git" || segment === "node_modules")) {
        throw new Error("That path is not available to the agent");
    }

    let current = root;
    for (const segment of segments) {
        current = join(current, segment);
        try {
            if ((await lstat(current)).isSymbolicLink()) {
                throw new Error("Symbolic links are not available to the agent");
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes("Symbolic links")) throw error;
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
            break;
        }
    }

    return target;
}

async function listFiles(root: string) {
    const output = await runCommand("git", ["-C", root, "ls-files", "-z"]);
    return output.split("\0").filter(Boolean).slice(0, 300);
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

async function askAgent(root: string, taskTitle: string, taskDescription: string) {
    
}

async function startAgent(taskTitle: string, taskDescription: string) {
    try{
        console.log(taskTitle);
        console.log(taskDescription);
        const sandbox = await Sandbox.create({timeoutMs:60_000})
        const info = await sandbox.getInfo()
        console.log("info of sanbox",info);
    }catch(error){

    }
}

async function processJob(jobId: string) {
    const job = await prisma.agentJob.findUnique({
        where: { id: jobId },
        include: { task: true, repository: true },
    });
    if (!job) return;
    console.log("job",job)

    let workspace: string | undefined;
    try {
        if (!/^[A-Za-z0-9_.-]+$/.test(job.repository.owner) || !/^[A-Za-z0-9_.-]+$/.test(job.repository.name)) {
            throw new Error("Repository owner or name is invalid");
        }

        workspace = await mkdtemp(join(tmpdir(), "trello-agent-"));
        const repositoryUrl = `https://github.com/${job.repository.owner}/${job.repository.name}.git`;
        await runCommand("git", ["clone", "--depth", "1", "--branch", job.repository.defaultBranch, repositoryUrl, workspace]);
        const branchName = `agent/${job.id}`;
        await runCommand("git", ["-C", workspace, "switch", "-c", branchName]);

        await prisma.agentJob.update({
            where: { id: job.id },
            data: { branchName },
        });

        // const { summary, activity } = await askAgent(workspace, job.task.title, job.task.description);
        const summary = await startAgent(job.task.title, job.task.description);
        // await runCommand("git", ["-C", workspace, "add", "--intent-to-add", "--", "."]);
        // const diff = await runCommand("git", ["-C", workspace, "diff", "--no-ext-diff", "--", "."]);
        // // const logs = [summary, ...activity].join("\n").slice(0, 50_000);

        // await prisma.agentJob.update({
        //     where: { id: job.id },
        //     data: { status: "SUCCEEDED", logs, resultDiff: diff.slice(0, 500_000) },
        // });
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
    console.log("queued",queued);
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
while (true) {
    try {
        const claimed = await claimJob();
        if (!claimed) await new Promise(resolveDelay => setTimeout(resolveDelay, pollingIntervalMs));
    } catch (error) {
        console.error("Agent worker poll failed:", error);
        await new Promise(resolveDelay => setTimeout(resolveDelay, pollingIntervalMs));
    }
}