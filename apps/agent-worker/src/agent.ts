import "dotenv/config";
import OpenAI from "openai";
import { Sandbox } from "e2b";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});


const MODEL = process.env.OPENAI_MODEL ?? "gemini-2.5-flash";

// ------------------------------------------
// Configuration
// ------------------------------------------

const REPO_URL = "https://github.com/OWNER/REPO.git";

const ISSUE_NUMBER = 42;

const ISSUE_TITLE = "Fix missing email validation";

const ISSUE_DESCRIPTION = `
The login API crashes when the email field is missing.

Please investigate the code, fix the bug,
and add appropriate tests.
`;

const BRANCH_NAME = `fix/issue-${ISSUE_NUMBER}`;

const REPO_DIR = "/home/user/repo";

const MAX_TOOL_CALLS = 40;

// ------------------------------------------
// Helpers
// ------------------------------------------

function shellQuote(value: string): string {
    return "'" + value.replace(/'/g, "'\\''") + "'";
}

function validateRepoUrl(url: string): void {
    const parsed = new URL(url);

    if (
        parsed.protocol !== "https:" ||
        parsed.hostname !== "github.com" ||
        !/^\/[^/]+\/[^/]+(?:\.git)?$/.test(parsed.pathname)
    ) {
        throw new Error("Use a valid GitHub repository HTTPS URL.");
    }
}

function safeRepoPath(filePath: string): string {
    const normalized = filePath.replace(/\\/g, "/");

    if (
        normalized.startsWith("/") ||
        normalized.split("/").includes("..") ||
        normalized === ".git" ||
        normalized.startsWith(".git/")
    ) {
        throw new Error("Invalid repository path");
    }

    const resolved = path.posix.resolve(REPO_DIR, normalized);
    const relative = path.posix.relative(REPO_DIR, resolved);

    if (
        relative === ".." ||
        relative.startsWith("../") ||
        path.posix.isAbsolute(relative)
    ) {
        throw new Error("Path escapes repository");
    }

    return resolved;
}

async function runCommand(
    sandbox: Awaited<ReturnType<typeof Sandbox.create>>,
    command: string
): Promise<string> {
    const result = await sandbox.commands.run(command, {
        cwd: REPO_DIR,
        timeoutMs: 120_000,
    });

    const output = [
        result.stdout,
        result.stderr,
        `Exit code: ${result.exitCode}`,
    ].join("\n");

    if (result.exitCode !== 0) {
        return `COMMAND FAILED\n${output}`;
    }

    return output;
}

const tools = [
    {
        type: "function",
        name: "list_files",
        description:
            "List files in the repository. Use this to understand the project structure.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                directory: {
                    type: "string",
                    description: "Directory relative to the repository root.",
                },
            },
            required: ["directory"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "read_file",
        description: "Read a text file from the repository.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "File path relative to the repository root.",
                },
            },
            required: ["path"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "write_file",
        description:
            "Create or replace a file in the repository. Use this for code changes and tests.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "File path relative to the repository root.",
                },
                content: {
                    type: "string",
                    description: "Complete contents of the file.",
                },
            },
            required: ["path", "content"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "run_command",
        description:
            "Run a shell command inside the repository. Use it to inspect code, install dependencies, and run tests or builds. Do not commit or push.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                command: {
                    type: "string",
                    description: "Command to execute.",
                },
            },
            required: ["command"],
            additionalProperties: false,
        },
    },
] as const;

async function executeTool(
    sandbox: Awaited<ReturnType<typeof Sandbox.create>>,
    name: string,
    args: Record<string, string>
): Promise<string> {
    try {
        switch (name) {
            case "list_files": {
                const directory = safeRepoPath(args.directory || ".");

                return await runCommand(
                    sandbox,
                    `find ${shellQuote(directory)} -maxdepth 3 -type f ` +
                    `-not -path '*/.git/*' | head -200`
                );
            }

            case "read_file": {
                const filePath = safeRepoPath(args.path);
                return await sandbox.files.read(filePath);
            }

            case "write_file": {
                const filePath = safeRepoPath(args.path);

                await sandbox.files.write(filePath, args.content);

                return `Successfully wrote ${args.path}`;
            }

            case "run_command": {
                // Basic guardrails for this prototype.
                // These are NOT a complete shell security boundary.
                const command = args.command;

                if (
                    /\b(git\s+(push|commit|reset|clean)|sudo|shutdown|reboot)\b/i.test(
                        command
                    )
                ) {
                    return "Command blocked. Git commits and pushes are controlled by the backend.";
                }

                return await runCommand(sandbox, command);
            }

            default:
                return `Unknown tool: ${name}`;
        }
    } catch (error) {
        return `Tool error: ${error instanceof Error ? error.message : String(error)
            }`;
    }
}

async function solveIssue() {
    validateRepoUrl(REPO_URL);

    const token = process.env.GITHUB_TOKEN;

    if (!token) {
        throw new Error("Missing GITHUB_TOKEN");
    }

    const sandbox = await Sandbox.create();

    try {
        console.log("Sandbox created:", sandbox.sandboxId);

        // 1. Clone repository
        const clone = await sandbox.commands.run(
            `git clone ${shellQuote(REPO_URL)} ${shellQuote(REPO_DIR)}`,
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
            `git checkout -b ${shellQuote(BRANCH_NAME)}`,
            { cwd: REPO_DIR }
        );

        // 4. Create a temporary Git credential prompt helper.
        // The token is supplied only to the final push command.
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
            `chmod 700 ${shellQuote(askpassPath)}`,
            { cwd: REPO_DIR }
        );

        // 5. Start the AI agent
        const instructions = `
You are an autonomous software engineering agent.

Your task is to solve the provided GitHub issue.

Repository: ${REPO_URL}
Issue: #${ISSUE_NUMBER}
Title: ${ISSUE_TITLE}

Issue description:
${ISSUE_DESCRIPTION}

Instructions:
1. Explore the repository before changing code.
2. Identify the root cause of the issue.
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

        const response = await ai.models.generateContent({
            model: MODEL, // e.g. "gemini-2.5-flash"
            contents: "Start investigating and solving the issue.",
            config: {
                systemInstruction: instructions,
                tools: [...tools],
            },
        });

        let toolCallCount = 0;

        while (true) {
            const calls = response.output.filter(
                (item: any) => item.type === "function_call"
            );

            if (calls.length === 0) {
                break;
            }

            const outputs = [];

            for (const call of calls) {
                toolCallCount++;

                if (toolCallCount > MAX_TOOL_CALLS) {
                    throw new Error("Maximum agent tool-call limit reached");
                }

                console.log(`Tool: ${call.name}`);

                const args = JSON.parse(call.arguments) as Record<string, string>;

                const output = await executeTool(
                    sandbox,
                    call.name,
                    args
                );

                outputs.push({
                    type: "function_call_output" as const,
                    call_id: call.call_id,
                    output: output.slice(0, 20_000),
                });
            }

            response = await openai.responses.create({
                model: MODEL,
                previous_response_id: response.id,
                input: outputs,
                tools: [...tools],
            });
        }

        console.log("\nAgent response:");
        console.log(response.output_text);

        // 6. Check the final diff
        const diffCheck = await sandbox.commands.run(
            "git diff --check",
            { cwd: REPO_DIR }
        );

        if (diffCheck.exitCode !== 0) {
            throw new Error(`Diff check failed: ${diffCheck.stderr}`);
        }

        const status = await sandbox.commands.run(
            "git status --short",
            { cwd: REPO_DIR }
        );

        console.log("\nChanged files:");
        console.log(status.stdout);

        if (!status.stdout.trim()) {
            console.log("No changes were made. Nothing to push.");
            return;
        }

        const diff = await sandbox.commands.run(
            "git diff --stat && git diff --",
            { cwd: REPO_DIR }
        );

        console.log("\nFinal diff:");
        console.log(diff.stdout);

        // 7. Commit the changes
        await sandbox.commands.run("git add -A", {
            cwd: REPO_DIR,
        });

        const commit = await sandbox.commands.run(
            `git commit -m ${shellQuote(`Fix issue #${ISSUE_NUMBER}`)}`,
            { cwd: REPO_DIR }
        );

        if (commit.exitCode !== 0) {
            throw new Error(`Commit failed: ${commit.stderr}`);
        }

        const push = await sandbox.commands.run(
            `git push -u origin ${shellQuote(BRANCH_NAME)}`,
            {
                cwd: REPO_DIR,
                timeoutMs: 120_000,
                envs: {
                    GITHUB_TOKEN: token,
                    GIT_ASKPASS: askpassPath,
                    GIT_TERMINAL_PROMPT: "0",
                },
            }
        );

        if (push.exitCode !== 0) {
            throw new Error(`Push failed: ${push.stderr}`);
        }

        console.log("\nSuccessfully pushed!");
        console.log(`Branch: ${BRANCH_NAME}`);
        console.log(
            `Repository: ${REPO_URL.replace(/\.git$/, "")}`
        );
        console.log(
            `Compare: ${REPO_URL.replace(/\.git$/, "")}/compare/${BRANCH_NAME}`
        );
    } finally {
        await sandbox.kill();
    }
}

solveIssue().catch((error) => {
    console.error("Issue solver failed:", error);
    process.exitCode = 1;
});