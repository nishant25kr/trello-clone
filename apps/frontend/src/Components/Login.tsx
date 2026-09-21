import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Login = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState<string>('')
    const [username, setUsername] = useState<string>('')

    async function handleSubmit(){
        try {
            console.log(username,"---",password)
            if(!password.trim() || !username.trim()){
                alert("error")
                return;
            }
            const response = await axios.post("http://localhost:3000/api/v1/signin",{
                    username: username,
                    password: password
            })
            console.log(response.data.user)
            if(response.status === 200){
                localStorage.setItem("token",response.data.token)
                localStorage.setItem("user",JSON.stringify(response.data.user))
                navigate(`/dashboard/${response.data.user.username}`)
                
            }

        } catch (error: any) {
            console.error("error",error.message)
        }
    }
    return (
        <div>
            <h1>Login</h1>
            <input type="text" className="border" onChange={(e)=> setUsername(e.target.value)}  />username
            <input type="text" className="border" onChange={(e)=> setPassword(e.target.value)} />password <br />
            <button onClick={()=> handleSubmit()}>Login</button> <br />
            <button onClick={() => navigate("/auth/register")}>Create Account</button>
        </div>
    )
}