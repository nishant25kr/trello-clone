import { useEffect } from "react";

export const Home = () => {
    const token = localStorage.getItem("token");
    useEffect(() => {
        (
            async () => {
                const response = await fetch("http://localhost:3000/api/verify", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ token })
                })
                const data = await response.json();
                console.log(data)
            }
        )()
    }, [token])
    return (
        <div>
            <>Home</ h1>
            <p>Welcome to the Home page!</p>

        </div>
    )
}