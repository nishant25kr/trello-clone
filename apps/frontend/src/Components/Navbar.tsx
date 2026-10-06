import { Link, useNavigate } from "react-router-dom";

export const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth/login");
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/overview" className="text-lg font-semibold text-slate-900">
            Trello Clone
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-slate-600 md:flex">
            <Link to="/dashboard/overview">Dashboard</Link>
            <Link to="/boards">Boards</Link>
            <Link to="/issues">Issues</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-2 text-sm font-medium"
          >
            Search
          </button>
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-2 text-sm font-medium"
          >
            Invite
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};
