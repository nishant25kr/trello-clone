import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

export const SignUp = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if (!username.trim() || !password.trim()) {
            setError("Choose a username and password.");
            return;
        }

        setLoading(true);

        try {
            await axios.post(`${API_BASE_URL}/users`, {
                username,
                password,
            });
            navigate("/auth/login");
        } catch (requestError) {
            setError(
                axios.isAxiosError(requestError)
                    ? requestError.response?.data?.message ?? "Unable to create your account."
                    : "Unable to create your account."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <aside className="hidden w-1/2 flex-col justify-between bg-slate-900 p-10 text-white md:flex">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-900">T</span>
                            <span className="text-lg font-semibold">Trello Clone</span>
                        </div>
                        <h1 className="mt-16 text-3xl font-semibold leading-tight">Start organizing your work.</h1>
                        <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">Create your workspace, connect your repositories, and bring every project into one clear board.</p>
                    </div>
                    <p className="text-xs text-slate-500">Build momentum, one task at a time.</p>
                </aside>

                <section className="flex w-full items-center justify-center p-6 sm:p-10">
                    <div className="w-full max-w-sm">
                        <div className="md:hidden">
                            <div className="mb-8 flex items-center gap-2">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">T</span>
                                <span className="text-lg font-semibold">Trello Clone</span>
                            </div>
                        </div>

                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Join the workspace</p>
                        <h2 className="mt-2 text-2xl font-semibold">Create an account</h2>
                        <p className="mt-2 text-sm text-slate-500">Choose a username and password to get started.</p>

                        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="signup-username" className="mb-1.5 block text-sm font-medium text-slate-700">Username</label>
                                <input
                                    id="signup-username"
                                    type="text"
                                    autoComplete="username"
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                                    placeholder="Choose a username"
                                />
                            </div>

                            <div>
                                <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                                <input
                                    id="signup-password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                                    placeholder="Create a password"
                                />
                            </div>

                            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? "Creating account…" : "Create account"}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-slate-500">
                            Already have an account?{" "}
                            <button type="button" onClick={() => navigate("/auth/login")} className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900">
                                Log in
                            </button>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
};