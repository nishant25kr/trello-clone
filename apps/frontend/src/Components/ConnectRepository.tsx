import axios from "axios";
import { useState } from "react";
import { API_BASE_URL } from "../config";

type RepositoryDetails = {
    githubId: string;
    owner: string;
    name: string;
    defaultBranch: string;
    branches: string[];
};

type ConnectRepositoryProps = {
    boardId: string;
    repo?: {
        id: string;
        githubId: string;
        owner: string;
        name: string;
        defaultBranch: string;
    };
};

const GithubIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
);

const BranchIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <circle cx="6" cy="5" r="2" />
        <circle cx="6" cy="19" r="2" />
        <circle cx="18" cy="8" r="2" />
        <path d="M6 7v10M18 10c0 4-6 3-12 7" />
    </svg>
);

const Spinner = () => (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
        <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-90" />
    </svg>
);

export const ConnectRepository = ({ boardId, repo }: ConnectRepositoryProps) => {
    const [url, setUrl] = useState("");
    const [repository, setRepository] = useState<RepositoryDetails>();
    const [branch, setBranch] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);

    async function findRepository() {
        setLoading(true);
        setMessage("");
        setSuccess(false);

        try {
            const response = await axios.get(`${API_BASE_URL}/github/repository`, {
                params: { url },
            });
            setRepository(response.data);
            setBranch(response.data.defaultBranch);
        } catch (error) {
            setRepository(undefined);
            setMessage(
                axios.isAxiosError(error)
                    ? error.response?.data?.message ?? "Unable to find repository"
                    : "Unable to find repository"
            );
        } finally {
            setLoading(false);
        }
    }

    async function connectRepository() {
        if (!repository) return;

        setLoading(true);
        setMessage("");
        setSuccess(false);

        try {
            await axios.post(`${API_BASE_URL}/board/${boardId}/repository`, {
                ...repository,
                defaultBranch: branch,
            });
            setSuccess(true);
            setMessage("Repository connected");
        } catch (error) {
            setMessage(
                axios.isAxiosError(error)
                    ? error.response?.data?.message ?? "Unable to connect repository"
                    : "Unable to connect repository"
            );
        } finally {
            setLoading(false);
        }
    }

    const primaryButton =
        "inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    if (repo) {
        return (
            <section className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                        <GithubIcon className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Repository</p>
                        <h3 className="text-base font-semibold text-slate-900">Connected</h3>
                    </div>
                </div>

                <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                        <dt className="text-slate-500">Default branch</dt>
                        <dd className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 font-mono text-xs text-slate-800 ring-1 ring-slate-200">
                            <BranchIcon className="h-3.5 w-3.5" />
                            {repo.defaultBranch}
                        </dd>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                        <dt className="text-slate-500">Repository</dt>
                        <dd className="text-right">
                            <a
                                href={`https://github.com/${repo.owner}/${repo.name}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900"
                            >
                                {repo.owner}/{repo.name}
                            </a>
                        </dd>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                        <dt className="text-slate-500">GitHub ID</dt>
                        <dd className="font-mono text-[11px] text-slate-700">{repo.githubId}</dd>
                    </div>
                </dl>
            </section>
        );
    }

    /* ---------- Connect form ---------- */
    return (
        <section className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                    <GithubIcon className="h-4 w-4" />
                </span>
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Integration</p>
                    <h2 className="text-base font-semibold leading-tight text-slate-900">Connect a GitHub repository</h2>
                </div>
            </div>

            <p className="mt-3 text-sm text-slate-500">Paste a repository link to link it to this board.</p>

            <form
                className="mt-4 flex flex-col gap-2 sm:flex-row"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (!loading && url.trim()) findRepository();
                }}
            >
                <label htmlFor="repo-url" className="sr-only">Repository URL</label>
                <input
                    id="repo-url"
                    className="w-full flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://github.com/owner/repository"
                />
                <button className={primaryButton} type="submit" disabled={loading || !url.trim()}>
                    {loading && !repository ? (
                        <>
                            <Spinner /> Finding…
                        </>
                    ) : (
                        "Find repository"
                    )}
                </button>
            </form>

            {repository && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Repository found</p>
                            <p className="truncate font-semibold text-slate-900">
                                {repository.owner}
                                <span className="mx-0.5 text-slate-400">/</span>
                                {repository.name}
                            </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
                            {repository.branches.length} {repository.branches.length === 1 ? "branch" : "branches"}
                        </span>
                    </div>

                    <div className="mt-3">
                        <label htmlFor="repo-branch" className="mb-1.5 block text-sm font-medium text-slate-700">
                            Default branch
                        </label>
                        <div className="relative">
                            <BranchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                                id="repo-branch"
                                className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-9 font-mono text-sm text-slate-900 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                value={branch}
                                onChange={(event) => setBranch(event.target.value)}
                            >
                                {repository.branches.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                            <svg
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                aria-hidden="true"
                            >
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>

                    <button
                        className={`${primaryButton} mt-4 w-full`}
                        type="button"
                        onClick={connectRepository}
                        disabled={loading || !branch}
                    >
                        {loading ? (
                            <>
                                <Spinner /> Connecting…
                            </>
                        ) : (
                            "Connect repository"
                        )}
                    </button>
                </div>
            )}

            {message && (
                <p
                    role={success ? "status" : "alert"}
                    className={`mt-4 rounded-lg px-3 py-2 text-sm ring-1 ${
                        success
                            ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20"
                            : "bg-red-50 text-red-800 ring-red-600/20"
                    }`}
                >
                    {message}
                </p>
            )}
        </section>
    );
};