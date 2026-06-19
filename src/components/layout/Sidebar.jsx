import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home, Users, UserCheck, Trophy, LogOut,
  ChevronLeft, ChevronRight,
  Flag, ClipboardList, Mail, Star, Calendar,
  Award, PawPrint, Zap, User, BarChart2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const MENU_BY_ROLE = {
  Admin: [
    { label: "Dashboard",           icon: Home,          path: "/dashboard" },
    { label: "Duyệt tài khoản",     icon: UserCheck,     path: "/admin/users/pending" },
    { label: "Quản lý người dùng",  icon: Users,         path: "/admin/users" },
    { label: "Quản lý giải đấu",    icon: Trophy,        path: "/admin/tournaments" },
  ],
  OrganizerHead: [
    { label: "Dashboard",           icon: Home,          path: "/dashboard" },
    { label: "Quản lý vòng đua",    icon: Flag,          path: "/organizer/races" },
    { label: "Duyệt kết quả",       icon: Award,         path: "/organizer/results" },
  ],
  OrganizerMember: [
    { label: "Dashboard",           icon: Home,          path: "/dashboard" },
    { label: "Quản lý vòng đua",    icon: Flag,          path: "/organizer/races" },
    { label: "Phân công trọng tài", icon: ClipboardList, path: "/organizer/referees" },
  ],
  HorseOwner: [
    { label: "Dashboard",           icon: Home,          path: "/dashboard" },
    { label: "Ngựa của tôi",        icon: PawPrint,      path: "/owner/horses" },
    { label: "Đăng ký thi đấu",     icon: Trophy,        path: "/owner/race-registration" },
    { label: "Lời mời Jockey",      icon: Mail,          path: "/owner/invitations" },
    { label: "Hồ sơ cá nhân",       icon: User,          path: "/profile" },
  ],
  Jockey: [
    { label: "Dashboard",           icon: Home,          path: "/dashboard" },
    { label: "Lời mời thi đấu",     icon: Mail,          path: "/jockey/invitations" },
    { label: "Hồ sơ cá nhân",       icon: User,          path: "/profile" },
  ],
  Referee: [
    { label: "Dashboard",           icon: Home,          path: "/dashboard" },
    { label: "Vòng đua của tôi",    icon: Flag,          path: "/referee/races" },
    { label: "Hồ sơ cá nhân",       icon: User,          path: "/profile" },
  ],
  Spectator: [
    { label: "Dashboard",           icon: Home,          path: "/dashboard" },
    { label: "Lịch thi đấu",        icon: Calendar,      path: "/spectator/schedule" },
    { label: "Dự đoán của tôi",     icon: Star,          path: "/spectator/predictions" },
    { label: "Bảng xếp hạng",       icon: BarChart2,     path: "/leaderboard" },
  ],
};

const ROLE_BADGE = {
  Admin:           { label: "Admin",          cls: "bg-red-500/15 text-red-300 border-red-500/30" },
  OrganizerHead:   { label: "Trưởng BTC",     cls: "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30" },
  OrganizerMember: { label: "Thành viên BTC", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  HorseOwner:      { label: "Chủ ngựa",       cls: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  Jockey:          { label: "Nài ngựa",       cls: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
  Referee:         { label: "Trọng tài",      cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
  Spectator:       { label: "Khán giả",       cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
};

export default function Sidebar() {
  const { logout, role } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const menu = MENU_BY_ROLE[role] || [];
  const badge = ROLE_BADGE[role];

  return (
    <aside
      className={`relative flex flex-col h-screen border-r border-white/[0.06] transition-all duration-300 ease-in-out shrink-0 ${
        collapsed ? "w-[60px]" : "w-60"
      }`}
      style={{
        background: "linear-gradient(180deg, #080c17 0%, #070B14 40%, #060910 100%)",
      }}
    >
      {/* Ambient glow top-right */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/[0.06] shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Animated logo mark */}
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 gold-glow-ring">
                <Zap size={14} className="text-[#D4AF37]" />
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-shimmer font-bold text-xs tracking-widest uppercase leading-none">
                HorseRacing
              </p>
              <p className="text-gray-600 text-[9px] tracking-widest uppercase mt-0.5">
                Management
              </p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="mx-auto w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30">
            <Zap size={14} className="text-[#D4AF37]" />
          </div>
        )}

        {/* Collapse toggle - shown only when not collapsed */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="ml-2 p-1.5 rounded-lg text-gray-600 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all duration-200 shrink-0"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="absolute -right-3 top-[72px] z-10 w-6 h-6 rounded-full bg-[#0A0E1A] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all shadow-lg"
        >
          <ChevronRight size={11} />
        </button>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden px-2">
        {!collapsed && (
          <p className="px-2 mb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
            Menu
          </p>
        )}

        {menu.map((item, i) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={{ animationDelay: `${i * 40}ms` }}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl text-sm transition-all duration-200 animate-fade-in-up ${
                collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"
              } ${
                isActive
                  ? "text-[#D4AF37] bg-gradient-to-r from-[#D4AF37]/12 via-[#D4AF37]/6 to-transparent border border-[#D4AF37]/20 shadow-[inset_0_1px_0_rgba(212,175,55,0.1)]"
                  : "text-gray-500 hover:text-gray-100 hover:bg-white/[0.04] border border-transparent"
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                {/* Active left bar */}
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-[#D4AF37] to-[#D4AF37]/40 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                )}

                {/* Icon */}
                <span className={`shrink-0 transition-all duration-200 ${
                  isActive
                    ? "text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.5)]"
                    : "text-gray-500 group-hover:text-gray-300"
                }`}>
                  <item.icon size={16} />
                </span>

                {/* Label */}
                {!collapsed && (
                  <span className="truncate font-medium">{item.label}</span>
                )}

                {/* Active dot when collapsed */}
                {isActive && collapsed && (
                  <span className="absolute right-0.5 top-1.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Role badge + Logout ── */}
      <div className="border-t border-white/[0.06] p-3 space-y-2 shrink-0">
        {/* Role badge */}
        {badge && !collapsed && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${badge.cls}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            <span className="truncate">{badge.label}</span>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className={`group flex items-center gap-3 w-full rounded-xl text-sm text-gray-600 hover:text-red-400 hover:bg-red-500/[0.07] border border-transparent hover:border-red-500/20 transition-all duration-200 ${
            collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
          }`}
          title={collapsed ? "Đăng xuất" : undefined}
        >
          <LogOut size={15} className="shrink-0 group-hover:rotate-12 transition-transform duration-300" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
