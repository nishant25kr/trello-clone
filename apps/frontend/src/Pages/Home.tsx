import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const Home = () => {
    const navigate = useNavigate();
    useEffect(() => {
        (
            async () => {
                const token = localStorage.getItem("token");
                if(!token) {
                    console.log("No token found");
                    navigate("/login");
                    return;
                }
                const userData = localStorage.getItem("user");
                if(!userData) {
                    console.log("No user data found");
                    navigate("/login");
                    return;
                }
                const user = JSON.parse(userData);
                const userId = user.id;
                const response = await axios.get(`http://localhost:3000/api/v1/organization/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if(response.status !== 200) {
                    console.log("Error fetching organization data");
                    navigate("/login");
                    return;
                }
                const data = await response.data;
                console.log(data)
            }
        )()
    }, [])

    const createOrganization = () => {
        try {
            const token = localStorage.getItem("token");
            if(!token) {
                console.log("No token found");
                navigate("/login");
                return;
            }
            const userData = localStorage.getItem("user");
            if(!userData) {
                console.log("No user data found");
                navigate("/login");
                return;
            }
            const user = JSON.parse(userData);
            const userId = user.id;
            axios.post(`http://localhost:3000/api/v1/organization`, { userId }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }).then(response => {
                if(response.status !== 201) {
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


    return (
        <div>
            <h1>Home</h1>
            <p>Welcome to the Home page!</p>
            <button onClick={createOrganization}>Create Organization</button>
        </div>
    )
}