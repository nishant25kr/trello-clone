import { useNavigate } from "react-router-dom";
import { Logo } from "./Logo";

export const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex flex-col">
            {/* Header / Navbar */}
            <header className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <Logo />
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/auth/login")}
                        className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors px-4 py-2"
                    >
                        Log in
                    </button>
                    <button
                        onClick={() => navigate("/auth/signup")}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
                    >
                        Get Started
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex items-center justify-center max-w-7xl mx-auto px-6 py-12 text-center">
                <div className="max-w-3xl space-y-8">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold tracking-wide uppercase shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                        Next-Gen Project Management
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tight leading-tight">
                        Manage projects effortlessly with <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">Trellix</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto font-normal leading-relaxed">
                        Collaborate, manage boards, track issues, and empower your workflow with AI agent support—all in one place.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <button
                            onClick={() => navigate("/auth/signup")}
                            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base px-8 py-3.5 rounded-xl shadow-xl shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5"
                        >
                            Start for Free
                        </button>
                        <button
                            onClick={() => navigate("/auth/login")}
                            className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 font-semibold text-base px-8 py-3.5 rounded-xl border border-gray-200 shadow-sm transition-all"
                        >
                            Explore Demo
                        </button>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-3">
                    <Logo className="scale-75 origin-left" />
                    <span>© {new Date().getFullYear()} Trellix. All rights reserved.</span>
                </div>
                <div className="flex gap-6 mt-4 sm:mt-0">
                    <span className="hover:text-gray-800 cursor-pointer transition-colors">Privacy</span>
                    <span className="hover:text-gray-800 cursor-pointer transition-colors">Terms</span>
                    <span className="hover:text-gray-800 cursor-pointer transition-colors">Support</span>
                </div>
            </footer>
        </div>
    );
};
