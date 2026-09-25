import axios from "axios";
import { useEffect, useState } from "react";

type AgentJob = {
    id: string;
    taskId: string;
    status: string;
    branchName: string | null;
    logs: string | null;
    resultDiff: string | null;
};

type AgentRunButtonProps = {
    issueId: string;
};

const apiBase = "http://localhost:3000/api/v1";

export const AgentRunButton = ({ issueId }: AgentRunButtonProps) => {
    const [job, setJob] = useState<AgentJob>();
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!job || !["QUEUED", "RUNNING"].includes(job.status)) return;

        const interval = window.setInterval(async () => {
            try {
                const response = await axios.get(`${apiBase}/agent-jobs/${job.id}`);
                setJob(response.data.job);
            } catch {
                setError("Unable to refresh agent status");
            }
        }, 2_000);

        return () => window.clearInterval(interval);
    }, [job?.id, job?.status]);

    async function startAgent() {
        setStarting(true);
        setError("");
        try {
            const response = await axios.post(`${apiBase}/issue/${issueId}/agent-jobs`);
            setJob(response.data.job);
        } catch (requestError) {
            setError(axios.isAxiosError(requestError)
                ? requestError.response?.data?.message ?? "Unable to start agent"
                : "Unable to start agent");
        } finally {
            setStarting(false);
        }
    }

    const active = job && ["QUEUED", "RUNNING"].includes(job.status);

    return (
        <div className="mt-2">
            <button
                type="button"
                className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                onClick={startAgent}
                disabled={starting || Boolean(active)}
            >
                {starting ? "Starting..." : active ? `Agent ${job.status.toLowerCase()}` : "Start Agent"}
            </button>

            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

            {job && !active && (
                <details className="mt-2 text-sm">
                    <summary>Agent {job.status.toLowerCase()} output</summary>
                    {job.branchName && <p>Local branch: {job.branchName}</p>}
                    {job.logs && <pre className="max-h-48 overflow-auto whitespace-pre-wrap">{job.logs}</pre>}
                    {job.resultDiff && (
                        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded border bg-white p-2">
                            {job.resultDiff}
                        </pre>
                    )}
                </details>
            )}
        </div>
    );
};
