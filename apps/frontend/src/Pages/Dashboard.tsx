import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { type User, type Organization } from "@/types";
import { API_BASE_URL } from "../config";
import { Navbar } from "../Components/Navbar";

export const Dashboard = () => {
    const navigate = useNavigate();
    const [organizations, setOrganizations] = useState<Organization[] | null>(null);
    const [user, setUser] = useState<User | null>(null)
    const [name, setName] = useState<string>("")
    const [description, setDescription] = useState<string>("")

    useEffect(() => {
        (
            async () => {
                try {
                    const token = localStorage.getItem("token");
                    if (!token) {
                        console.log("No token found");
                        navigate("/auth/login")
                        return;
                    }
                    const userData = localStorage.getItem("user");
                    if (!userData) {
                        console.log("No user data found");
                        navigate("/auth/login")
                        return;
                    }
                    const user = JSON.parse(userData)
                    setUser(user)
                    console.log(user)
                    const userId = user.id;
                    const response = await axios.get(`${API_BASE_URL}/organization/${userId}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                    console.log(response)
                    if (response.status !== 200) {
                        console.log("Error fetching organization data");
                        return;
                    }
                    setOrganizations(response.data)

                } catch (error: any) {
                    console.log("error", error.message)
                }
            }
        )()
    }, [])

    const createOrganization = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.log("No token found");
                navigate("/auth/login")
                return;
            }
            const userData = localStorage.getItem("user");
            if (!userData) {
                console.log("No user data found");
                navigate("/auth/login")
                return;
            }
            const user = JSON.parse(userData);
            const userId = user.id;
            const response = await axios.post(`${API_BASE_URL}/organization`, { 
                name: name,
                description: description
            },{
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.status !== 200) {
                console.log("Error creating organization");
                return;
            }
            const data = response.data;
            console.log(data)
            setOrganizations(prevOrgs => prevOrgs ? [...prevOrgs, data.data] : [data.data]);

        } catch (error) {
            console.log(error);
        }
    }

    function handleJoin(id: string) {
        if (!id) return;
        navigate(`/boards/${id}`)
    }

    return (
        <div className="min-h-screen bg-white text-slate-800">
            <Navbar />

            <main className="mx-auto grid max-w-6xl gap-6 px-6 py-6 md:grid-cols-[260px_1fr]">
                <aside className="rounded-xl border border-slate-200 p-4">
                    <h2 className="mb-4 text-lg font-semibold">Profile</h2>
                    <div className="space-y-2 text-sm text-slate-600">
                        <p>User ID: {user?.id}</p>
                        <p>Username: {user?.username}</p>
                    </div>

                    <div className="mt-6">
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Quick actions</h3>
                        <ul className="space-y-2 text-sm">
                            <li>Overview</li>
                            <li>Boards</li>
                            <li>Members</li>
                            <li>Settings</li>
                        </ul>
                    </div>
                </aside>

                <section className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-sm text-slate-500">Total boards</p>
                            <p className="mt-2 text-3xl font-semibold">{organizations?.length ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-sm text-slate-500">Active projects</p>
                            <p className="mt-2 text-3xl font-semibold">{organizations?.length ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-sm text-slate-500">Members</p>
                            <p className="mt-2 text-3xl font-semibold">1</p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-semibold">My organizations</h2>
                        </div>

                        {organizations && organizations.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {organizations.map(org => (
                                    <div key={org.id} className="rounded-lg border border-slate-200 p-4">
                                        <h3 className="text-lg font-medium">{org.name}</h3>
                                        <p className="mt-2 text-sm text-slate-600">{org.description}</p>
                                        <button
                                            onClick={() => handleJoin(org.id)}
                                            className="mt-4 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium"
                                        >
                                            Open board
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500">No organizations yet.</p>
                        )}
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                        <h2 className="mb-4 text-xl font-semibold">Create organization</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="text-sm font-medium text-slate-700">
                                Title
                                <input
                                    type="text"
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Title"
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none"
                                />
                            </label>

                            <label className="text-sm font-medium text-slate-700">
                                Description
                                <input
                                    type="text"
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Description"
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none"
                                />
                            </label>
                        </div>

                        <button
                            onClick={createOrganization}
                            className="mt-4 rounded-md border border-slate-300 px-4 py-2 font-medium"
                        >
                            Create Organization
                        </button>
                    </div>
                </section>
            </main>
        </div>
    )
}