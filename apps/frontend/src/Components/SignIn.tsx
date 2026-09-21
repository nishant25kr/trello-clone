import { useNavigate } from "react-router-dom"

export const SignIn = () =>{ 
    const navigate = useNavigate()
    return (
        <div>
            <h1>Sign In</h1>
            <p>Sign In Page</p>
            <button onClick={() => navigate("/auth/login")}>Already have account</button>
        </div>
    )
}