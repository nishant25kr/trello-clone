import { Login } from "@/Components/Login";
import { SignIn } from "@/Components/SignIn";
import {useParams }from "react-router-dom";

export const Auth = ()=> {
    const { auth } = useParams();
    
    return(
        <div>
            <h1>Auth</h1>
            {auth === "login" ? (
                <Login />
            ) : auth === "register" ? (
                <SignIn />
            ) : (
                <p>Invalid Auth Route</p>
            )}
        </div>
    )
}