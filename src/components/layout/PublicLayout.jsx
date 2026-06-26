import { Link } from "react-router-dom";
import { Zap, LogIn, Calendar, BarChart2 } from "lucide-react";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen font-sans" style={{ background: "#FAFAF5" }}>
      {/* ── Fixed Nav ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6"
        style={{ background: "#FFFFFF", borderBottom: "1px solid #EAE5D8", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}
      >
        {/* Gold accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[1.5px]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.45), transparent)" }}
        />

        {/* Logo */}
        <Link to="/races" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/25 gold-glow-ring">
            <Zap size={14} className="text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-shimmer font-bold text-xs tracking-widest uppercase leading-none">HorseRacing</p>
            <p className="text-gray-400 text-[9px] tracking-widest uppercase mt-0.5">Vietnam</p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/races" className="text-sm font-medium text-gray-600 hover:text-[#D4AF37] transition-colors flex items-center gap-1.5">
            <Calendar size={14} /> Lịch đua
          </Link>
          <Link to="/leaderboard" className="text-sm font-medium text-gray-600 hover:text-[#D4AF37] transition-colors flex items-center gap-1.5">
            <BarChart2 size={14} /> Bảng xếp hạng
          </Link>
        </nav>

        {/* Auth actions */}
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold btn-gold"
          >
            <LogIn size={13} /> Tham gia
          </Link>
        </div>
      </header>

      {/* Content area */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 px-6 mt-16" style={{ background: "#FFFFFF" }}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/25">
              <Zap size={10} className="text-[#D4AF37]" />
            </div>
            <span className="text-shimmer font-bold text-xs tracking-widest uppercase">HorseRacing Vietnam</span>
          </div>
          <p className="text-gray-400 text-xs">Nền tảng quản lý đua ngựa chuyên nghiệp tại Việt Nam</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
            <Link to="/login" className="hover:text-[#D4AF37] transition-colors">Đăng nhập</Link>
            <span>·</span>
            <Link to="/register" className="hover:text-[#D4AF37] transition-colors">Đăng ký</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
