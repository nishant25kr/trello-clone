import { useParams } from "react-router-dom"

export const Issue = () => {
    const params = useParams()
    console.log(params)

    return (
        <>
            <div>
                <h1>issues</h1>
                <h1>{params.token}</h1>
            </div>
        </>
    )
}