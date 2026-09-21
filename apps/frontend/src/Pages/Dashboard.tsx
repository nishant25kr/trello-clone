import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { type User, type Organization } from "@/types";

export const Dashboard = () => {
    const navigate = useNavigate();
    const [organizations, setOrganizations] = useState<Organization[] | null>(null);
    const [user, setUser] = useState<User | null>(null)

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
                    const response = await axios.get(`http://localhost:3000/api/v1/organization/${userId}`, {
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
            axios.post(`http://localhost:3000/api/v1/organization`, { userId }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }).then(response => {
                if (response.status !== 201) {
                    console.log("Error creating organization");
                    return;
                }
                const data = response.data;
                console.log(data)
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

    return (
        <div className="flex w-full h-screen">

            <div className="border w-1/3 m-2 p-2">
                userId:{user?.id} <br />
                username:{user?.username} <br />
            </div>

            <div className="border w-2/3  m-2 p-2 ">
                <div className="border flex">
                {organizations?.map(org => (
                    <div className="border m-2 p-2 bg-gray-200">
                        <p>{org.name}</p>
                        <p>{org.description}</p>
                        <button className="border" onClick={()=>handleJoin(org.id)}>join </button>
                    </div>
                ))}
                </div>
                <div>
                <input type="text" className="border" />Title
                <input type="text" className="border"/>Description
                <button onClick={createOrganization} className="border m-2 p-2">Create Organization</button>
                </div>
            </div>

        </div>
    )
}