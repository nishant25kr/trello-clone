import axios from "axios"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

export const SignUp = () =>{ 
    const navigate = useNavigate()
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string>('')

    const handleSubmit = async () => {
        try {
            if(!username.trim() || !password.trim()){
                alert("error")
                return;
            }
            const response = await axios.post("http://localhost:3000/api/v1/users",{
                username: username,
                password: password
            })
            console.log(response.data)
            if(response.status === 200){
                navigate("/auth/login");
            }
        } catch (error: any) {
            console.error("Error creating user:", error.message);
            alert("Error creating user: " + error.message);
        }
    }

    const handleLoginRedirect = () => {
        navigate("/auth/login");
    }
    
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1>Sign Up</h1>
            <input type="text" className="border" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} /> <br />
            <input type="text" className="border" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} /> <br />
            <button className="border-2 rounded px-4 py-2 bg-blue-500 text-white hover:bg-blue-600" onClick={handleSubmit}>
                Sign Up
            </button> <br />
            <button className="border-2 rounded px-4 py-2 bg-blue-500 text-white hover:bg-blue-600" onClick={handleLoginRedirect}>
                Already have account
            </button>
        </div>
    )
}