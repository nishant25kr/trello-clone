import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { type User, type Organization } from "@/types";
import { Logo } from "../Components/Logo";

export const Dashboard = () => {
    const navigate = useNavigate();
    const [organizations, setOrganizations] = useState<Organization[] | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [orgName, setOrgName] = useState("");
    const [orgDesc, setOrgDesc] = useState("");

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
                    const userId = user.id;
                    const response = await axios.get(`http://localhost:3000/api/v1/organization/${userId}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
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
    }, [navigate])

    const createOrganization = () => {
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
            axios.post(`http://localhost:3000/api/v1/organization`, { userId, name: orgName, description: orgDesc }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }).then(response => {
                if (response.status !== 201) {
                    console.log("Error creating organization");
                    return;
                }
                const data = response.data;
                console.log(data);
                setOrganizations(prev => prev ? [...prev, data.organization || data] : [data.organization || data]);
                setOrgName("");
                setOrgDesc("");
            }).catch(error => {
                console.log(error);
            })
        } catch (error) {
            console.log(error);
        }
    }

    function handleJoin(id: string){
        if(!id) return;
        navigate(`/boards/${id}`)
    }

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth/login");
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navbar */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <Logo />
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">
                        Hello, <span className="font-bold text-indigo-600">{user?.username || "User"}</span>
                    </span>
                    <button
                        onClick={handleLogout}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main content */}
            <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User profile sidebar */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 h-fit">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-700 font-bold rounded-xl flex items-center justify-center text-xl">
                            {user?.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">{user?.username}</h2>
                            <p className="text-xs text-gray-500">ID: {user?.id}</p>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p className="flex justify-between">
                            <span className="font-medium">Status:</span>
                            <span className="text-emerald-600 font-semibold">Active</span>
                        </p>
                    </div>
                </div>

                {/* Organizations / Boards section */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <h2 className="text-lg font-bold text-gray-900">Create New Organization</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Title</label>
                                <input
                                    type="text"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    placeholder="Organization title"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Description</label>
                                <input
                                    type="text"
                                    value={orgDesc}
                                    onChange={(e) => setOrgDesc(e.target.value)}
                                    placeholder="Description"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                            </div>
                        </div>
                        <button
                            onClick={createOrganization}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition-all"
                        >
                            Create Organization
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <h2 className="text-lg font-bold text-gray-900">Your Organizations & Boards</h2>
                        {organizations && organizations.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {organizations.map(org => (
                                    <div key={org.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-base">{org.name}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{org.description || "No description"}</p>
                                        </div>
                                        <button
                                            onClick={() => handleJoin(org.id)}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors shadow-sm"
                                        >
                                            Open Board
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm italic">No organizations found. Create one above to get started!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
