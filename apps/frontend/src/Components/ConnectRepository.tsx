import axios from "axios";
import { useState } from "react";

type RepositoryDetails = {
    githubId: string;
    owner: string;
    name: string;
    defaultBranch: string;
    branches: string[];
};

type ConnectRepositoryProps = {
    boardId: string;
};

export const ConnectRepository = ({ boardId }: ConnectRepositoryProps) => {
    const [url, setUrl] = useState("");
    const [repository, setRepository] = useState<RepositoryDetails>();
    const [branch, setBranch] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function findRepository() {
        setLoading(true);
        setMessage("");

        try {
            const response = await axios.get("http://localhost:3000/api/v1/github/repository", {
                params: { url },
            });
            setRepository(response.data);
            setBranch(response.data.defaultBranch);
        } catch (error) {
            setRepository(undefined);
            setMessage(axios.isAxiosError(error)
                ? error.response?.data?.message ?? "Unable to find repository"
                : "Unable to find repository");
        } finally {
            setLoading(false);
        }
    }

    async function connectRepository() {
        if (!repository) return;

        setLoading(true);
        setMessage("");

        try {
            await axios.post(`http://localhost:3000/api/v1/board/${boardId}/repository`, {
                ...repository,
                defaultBranch: branch,
            });
            setMessage("Repository connected");
        } catch (error) {
            setMessage(axios.isAxiosError(error)
                ? error.response?.data?.message ?? "Unable to connect repository"
                : "Unable to connect repository");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="border p-4 m-4">
            <h2>Connect GitHub repository</h2>
            <input
                className="border"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://github.com/owner/repository"
            />
            <button
                className="border m-2 p-2"
                type="button"
                onClick={findRepository}
                disabled={loading || !url.trim()}
            >
                {loading ? "Loading..." : "Find repository"}
            </button>

            {repository && (
                <div>
                    <p>{repository.owner}/{repository.name}</p>
                    <select value={branch} onChange={(event) => setBranch(event.target.value)}>
                        {repository.branches.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                    <button
                        className="border m-2 p-2"
                        type="button"
                        onClick={connectRepository}
                        disabled={loading || !branch}
                    >
                        Connect repository
                    </button>
                </div>
            )}

            {message && <p>{message}</p>}
        </section>
    );
};
