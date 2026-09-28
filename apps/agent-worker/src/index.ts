import { prisma } from "@repo/db";
import { GoogleGenAI, Type, type Content, type Part, type Tool } from "@google/genai";
import { Sandbox, CommandExitError } from "e2b";
import { posix } from "node:path";

// ---------- config ----------
interface AgentDetails {
    jobId: string;
    repositoryUrl: string;
    branchName: string;
    task: { title: string; description: string };
}

const E2B_API_KEY = process.env.E2B_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GIT_TOKEN = process.env.GIT_TOKEN;
if (!E2B_API_KEY) throw new Error("E2B_API_KEY is not set");
if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
if (!GIT_TOKEN) throw new Error("GIT_TOKEN is not set");

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const REPO_DIR = "/home/user/repo";
const ASKPASS_PATH = "/tmp/git-askpass.sh";
const SANDBOX_TIMEOUT_MS = 30 * 60_000;
const POLLING_INTERVAL_MS = 2_000;
const MAX_ITERATIONS = 30;
const MAX_FILE_BYTES = 100_000;
const MAX_OUTPUT_CHARS = 20_000;
const COMMAND_TIMEOUT_MS = 120_000;

// Adjust to match your Prisma enum for AgentJob.status
const STATUS_SUCCESS = "SUCCEEDED";

// ---------- helpers ----------
const shq = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

type Result = { stdout: string; stderr: string; exitCode: number };

/** Runs a command in the sandbox and never throws on non-zero exit. */
async function run(
    sandbox: Sandbox,
    cmd: string,
    opts: { cwd?: string; timeoutMs?: number; envs?: Record<string, string> } = {}
): Promise<Result> {
    try {
        const r = await sandbox.commands.run(cmd, {
            cwd: opts.cwd ?? REPO_DIR,
            timeoutMs: opts.timeoutMs ?? COMMAND_TIMEOUT_MS,
            envs: opts.envs,
        });
        return { stdout: r.stdout, stderr: r.stderr, exitCode: r.exitCode };
    } catch (e) {
        if (e instanceof CommandExitError) {
            return { stdout: e.stdout, stderr: e.stderr, exitCode: e.exitCode };
        }
        throw e;
    }
}

function safePath(input: unknown): string {
    if (typeof input !== "string" || !input || input.includes("\0")) {
        throw new Error("Invalid path");
    }
    const abs = posix.resolve(REPO_DIR, input);
    const rel = posix.relative(REPO_DIR, abs);
    if (!rel || rel.startsWith("..") || posix.isAbsolute(rel)) {
        throw new Error("Path must be inside the repository");
    }
    const segments = rel.split("/");
    const base = segments[segments.length - 1]!;
    if (segments.includes(".git")) throw new Error("Access to .git is not allowed");
    if (base.startsWith(".env") || /\.(pem|key)$/i.test(base)) {
        throw new Error("Access to secret files is not allowed");
    }
    return abs;
}

const truncate = (s: string) =>
    s.length > MAX_OUTPUT_CHARS ? s.slice(0, MAX_OUTPUT_CHARS) + "\n...[truncated]" : s;

// ---------- tools (all run INSIDE the sandbox) ----------
async function executeTool(
    sandbox: Sandbox,
    name: string,
    args: Record<string, unknown>
): Promise<string> {
    switch (name) {
        case "list_files": {
            const r = await run(sandbox, "git ls-files --cached --others --exclude-standard");
            const files = r.stdout
                .split("\n")
                .filter((f) => f && !/(^|\/)\.env/.test(f));
            return files.join("\n") || "(no files)";
        }

        case "read_file": {
            const path = safePath(args.path);
            const content = await sandbox.files.read(path);
            if (Buffer.byteLength(content) > MAX_FILE_BYTES) {
                throw new Error("File is too large to read");
            }
            return content;
        }

        case "write_file": {
            const path = safePath(args.path);
            if (typeof args.content !== "string") throw new Error("Content must be text");
            if (Buffer.byteLength(args.content) > MAX_FILE_BYTES) {
                throw new Error("File is too large to write");
            }
            await sandbox.files.write(path, args.content); // creates parent dirs
            return `Wrote ${posix.relative(REPO_DIR, path)}`;
        }

        case "run_command": {
            if (typeof args.command !== "string" || !args.command.trim()) {
                throw new Error("command must be a non-empty string");
            }
            const r = await run(sandbox, args.command);
            return truncate(`exit code: ${r.exitCode}\n--- stdout ---\n${r.stdout}\n--- stderr ---\n${r.stderr}`);
        }

        default:
            throw new Error(`Unsupported tool: ${name}`);
    }
}

const tools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: "list_files",
                description: "List files in the repository (tracked and untracked, excluding ignored).",
                parameters: { type: Type.OBJECT, properties: {} },
            },
            {
                name: "read_file",
                description: "Read a UTF-8 text file from the repository. Path is relative to the repo root.",
                parameters: {
                    type: Type.OBJECT,
                    properties: { path: { type: Type.STRING } },
                    required: ["path"],
                },
            },
            {
                name: "write_file",
                description: "Create or overwrite a UTF-8 text file. Path is relative to the repo root.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        path: { type: Type.STRING },
                        content: { type: Type.STRING },
                    },
                    required: ["path", "content"],
                },
            },
            {
                name: "run_command",
                description:
                    "Run a shell command in the repository root (e.g. install deps, run tests, build). 2 minute timeout.",
                parameters: {
                    type: Type.OBJECT,
                    properties: { command: { type: Type.STRING } },
                    required: ["command"],
                },
            },
        ],
    },
];

// ---------- agent ----------
function buildInstructions(d: AgentDetails) {
    return `
You are an autonomous software engineering agent.
Your task is to solve the provided issue.

Repository: ${d.repositoryUrl}
Job: ${d.jobId}
Title: ${d.task.title}

Issue description:
${d.task.description}

Instructions:
1. Explore the repository before changing code.
2. Identify the root cause.
3. Inspect all relevant files.
4. Modify only the files necessary.
5. Add or update tests where appropriate.
6. Run relevant tests and build checks with run_command.
7. If tests fail, investigate and fix.
8. Review your changes before finishing.
9. Do not commit or push. The backend handles Git operations.
10. Do not claim tests passed unless you actually ran them.
11. Do not read secrets, environment files, or Git credentials.
12. Do not perform unrelated changes.

When finished, reply with a short plain-text summary and make no further tool calls.
`;
}

async function runAgentLoop(sandbox: Sandbox, details: AgentDetails): Promise<string> {
    const contents: Content[] = [
        { role: "user", parts: [{ text: "Start investigating and solving the issue." }] },
    ];
    const systemInstruction = buildInstructions(details);

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents,
            config: { systemInstruction, tools },
        });

        const modelContent = response.candidates?.[0]?.content;
        if (modelContent) contents.push(modelContent);

        const calls = response.functionCalls ?? [];
        if (calls.length === 0) return response.text ?? "(no summary)";

        const parts: Part[] = [];
        for (const call of calls) {
            console.log(`[${details.jobId}] tool: ${call.name}`);
            let output: string;
            try {
                output = await executeTool(sandbox, call.name!, (call.args ?? {}) as Record<string, unknown>);
            } catch (e) {
                output = `Error: ${e instanceof Error ? e.message : String(e)}`; // let the model recover
            }
            parts.push({
                functionResponse: { name: call.name, response: { output: truncate(output) } },
            });
        }
        contents.push({ role: "user", parts });
    }

    return "Stopped: reached max iterations.";
}

interface AgentResult {
    changed: boolean;
    summary: string;
    compareUrl?: string;
}

async function startAgent(details: AgentDetails): Promise<AgentResult> {
    const sandbox = await Sandbox.create({
        apiKey: E2B_API_KEY,
        timeoutMs: SANDBOX_TIMEOUT_MS,
    });
    console.log(`[${details.jobId}] sandbox ${sandbox.sandboxId}`);

    const gitEnv = {
        GITHUB_TOKEN: GIT_TOKEN!,
        GIT_ASKPASS: ASKPASS_PATH,
        GIT_TERMINAL_PROMPT: "0",
    };

    try {
        // askpass helper (token is only passed via env on clone/push, never written to disk)
        await sandbox.files.write(
            ASKPASS_PATH,
            [
                "#!/bin/sh",
                'case "$1" in',
                '  *Username*) echo "x-access-token" ;;',
                '  *) echo "$GITHUB_TOKEN" ;;',
                "esac",
                "",
            ].join("\n")
        );
        await run(sandbox, `chmod 700 ${ASKPASS_PATH}`, { cwd: "/home/user" });

        // 1. Clone into REPO_DIR
        const clone = await run(
            sandbox,
            `git clone ${shq(details.repositoryUrl)} ${REPO_DIR}`,
            { cwd: "/home/user", envs: gitEnv }
        );
        if (clone.exitCode !== 0) throw new Error(`Clone failed: ${clone.stderr}`);

        // 2. Git identity + branch
        await run(
            sandbox,
            "git config user.name 'AI Issue Solver' && git config user.email 'ai-issue-solver@users.noreply.github.com'"
        );
        const checkout = await run(sandbox, `git checkout -b ${shq(details.branchName)}`);
        if (checkout.exitCode !== 0) throw new Error(`Checkout failed: ${checkout.stderr}`);

        // 3. Agent
        const summary = await runAgentLoop(sandbox, details);
        console.log(`[${details.jobId}] agent summary:\n${summary}`);

        // 4. Anything changed?
        const status = await run(sandbox, "git status --short");
        if (!status.stdout.trim()) {
            return { changed: false, summary: `No changes were made.\n\n${summary}` };
        }
        console.log(`[${details.jobId}] changed files:\n${status.stdout}`);

        // 5. Commit
        const add = await run(sandbox, "git add -A");
        if (add.exitCode !== 0) throw new Error(`git add failed: ${add.stderr}`);

        const title = details.task.title.replace(/[\r\n]+/g, " ").slice(0, 72);
        const commit = await run(sandbox, `git commit -m ${shq(`Fix: ${title}`)}`);
        if (commit.exitCode !== 0) throw new Error(`Commit failed: ${commit.stderr || commit.stdout}`);

        // 6. Push
        const push = await run(
            sandbox,
            `git push -u origin ${shq(details.branchName)}`,
            { envs: gitEnv }
        );
        if (push.exitCode !== 0) throw new Error(`Push failed: ${push.stderr}`);

        const base = details.repositoryUrl.replace(/\.git$/, "");
        return {
            changed: true,
            summary,
            compareUrl: `${base}/compare/${details.branchName}`,
        };
    } finally {
        await sandbox.kill().catch((e) => console.error("Failed to kill sandbox:", e));
    }
}

// ---------- job processing ----------
async function processJob(jobId: string) {
    const job = await prisma.agentJob.findUnique({
        where: { id: jobId },
        include: { task: true, repository: true },
    });
    if (!job) return;

    try {
        const nameOk = /^[A-Za-z0-9_.-]+$/;
        if (!nameOk.test(job.repository.owner) || !nameOk.test(job.repository.name)) {
            throw new Error("Repository owner or name is invalid");
        }

        const repositoryUrl = `https://github.com/${job.repository.owner}/${job.repository.name}.git`;
        const branchName = `agent/${job.id}`;

        await prisma.agentJob.update({ where: { id: job.id }, data: { branchName } });

        const result = await startAgent({
            jobId: job.id,
            repositoryUrl,
            branchName,
            task: { title: job.task.title, description: job.task.description },
        });

        const logs = result.compareUrl
            ? `${result.summary}\n\nCompare: ${result.compareUrl}`
            : result.summary;

        await prisma.agentJob.update({
            where: { id: job.id },
            data: { status: STATUS_SUCCESS, logs: logs.slice(0, 50_000) },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Agent job failed";
        await prisma.agentJob.update({
            where: { id: job.id },
            data: { status: "FAILED", logs: message.slice(0, 50_000) },
        });
        console.error(`Agent job ${job.id} failed:`, message);
    }
}

async function claimJob() {
    const queued = await prisma.agentJob.findFirst({
        where: { status: "QUEUED" },
        orderBy: { createdAt: "asc" },
        select: { id: true },
    });
    if (!queued) return false;

    const claim = await prisma.agentJob.updateMany({
        where: { id: queued.id, status: "QUEUED" },
        data: { status: "RUNNING", logs: "Cloning repository and starting agent" },
    });
    if (claim.count !== 1) return false;

    await processJob(queued.id);
    return true;
}

// ---------- main loop ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

console.log("Agent worker started; polling for queued jobs");
while (true) {
    try {
        const claimed = await claimJob();
        if (!claimed) await sleep(POLLING_INTERVAL_MS);
    } catch (error) {
        console.error("Agent worker poll failed:", error);
        await sleep(POLLING_INTERVAL_MS);
    }
}