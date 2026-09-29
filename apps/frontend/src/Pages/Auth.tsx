import { Login } from "@/Components/Login";
import { SignIn } from "@/Components/SignIn";
import { useParams, useNavigate } from "react-router-dom";
import { Logo } from "../Components/Logo";

export const Auth = () => {
    const { auth } = useParams();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex flex-col justify-between py-8 px-4">
            <div className="flex justify-center">
                <div className="cursor-pointer" onClick={() => navigate("/")}>
                    <Logo />
                </div>
            </div>

            <div className="max-w-md w-full mx-auto bg-white p-8 rounded-2xl border border-gray-200 shadow-xl shadow-indigo-500/5 my-auto">
                {auth === "login" ? (
                    <Login />
                ) : auth === "register" || auth === "signup" ? (
                    <SignIn />
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">Invalid Auth Route</p>
                        <button
                            onClick={() => navigate("/auth/login")}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                        >
                            Go to Login
                        </button>
                    </div>
                )}
            </div>

            <div className="text-center text-xs text-gray-500">
                © {new Date().getFullYear()} Trellix. All rights reserved.
            </div>
        </div>
    );
};
