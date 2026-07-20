import { Link } from "react-router-dom";
import { Calendar, BarChart2, LogIn, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Shell công khai — sportsbook dark, đồng bộ với Landing
export default function PublicLayout({ children }) {
  const { isAuthenticated } = useAuth();
  return (
    <div className="dark min-h-screen bg-sb-bg text-sb-tx font-sans">
      {/* ── Nav ── */}
      <header className="fixed top-0 inset-x-0 z-50 h-16 flex items-center justify-between px-6 bg-sb-s1/85 backdrop-blur border-b border-sb-border">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sb-emerald to-[#0B7A5A] flex items-center justify-center text-base shadow-[0_6px_20px_rgba(16,185,129,.35)]">🏇</div>
          <div>
            <p className="font-extrabold text-xs tracking-widest uppercase leading-none">HorseRacing VN</p>
            <p className="text-sb-tx-3 text-[9px] tracking-[.22em] uppercase mt-0.5">Season 2026</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link to="/" className="text-sm font-bold text-sb-tx-2 hover:text-sb-emerald px-3 py-2 rounded-lg hover:bg-white/5 transition flex items-center gap-1.5">
            <Calendar size={14} /> Race Calendar
          </Link>
          <Link to="/leaderboard" className="text-sm font-bold text-sb-tx-2 hover:text-sb-emerald px-3 py-2 rounded-lg hover:bg-white/5 transition flex items-center gap-1.5">
            <BarChart2 size={14} /> Leaderboard
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-extrabold bg-sb-emerald text-[#04241B] shadow-[0_6px_20px_rgba(16,185,129,.35)] hover:brightness-110 transition">
              <LayoutDashboard size={13} /> Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-bold text-sb-tx-2 hover:text-sb-tx hidden sm:block transition">
                Login
              </Link>
              <Link to="/register" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-extrabold bg-sb-emerald text-[#04241B] shadow-[0_6px_20px_rgba(16,185,129,.35)] hover:brightness-110 transition">
                <LogIn size={13} /> Tham gia
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="pt-16">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-sb-border py-10 px-6 mt-16 bg-sb-s1">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sb-emerald to-[#0B7A5A] flex items-center justify-center text-xs">🏇</div>
            <span className="font-extrabold text-xs tracking-widest uppercase">HorseRacing Vietnam</span>
          </div>
          <p className="text-sb-tx-3 text-xs">Professional horse racing management platform in Vietnam</p>
        </div>
      </footer>
    </div>
  );
}
