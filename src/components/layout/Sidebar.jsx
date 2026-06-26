import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home, Users, UserCheck, Trophy, LogOut,
  ChevronLeft, ChevronRight,
  Flag, ClipboardList, Mail, Star, Calendar,
  Award, PawPrint, Zap, User, BarChart2, Wallet, DollarSign,
  FileText, Settings,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const MENU_BY_ROLE = {
  Admin: [
    { label: "Dashboard",           icon: Home,          path: "/dashboard" },
    { label: "Duyệt tài khoản",     icon: UserCheck,     path: "/admin/users/pending" },
    { label: "Quản lý người dùng",  icon: Users,         path: "/admin/users" },
    { label: "Quản lý giải đấu",    icon: Trophy,        path: "/admin/tournaments" },
    { label: "Audit Logs",          icon: FileText,      path: "/admin/audit-logs" },
    { label: "Cấu hình hệ thống",   icon: Settings,      path: "/admin/configs" },
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
    { label: "Đặt cược",            icon: DollarSign,    path: "/spectator/betting" },
    { label: "Ví của tôi",          icon: Wallet,        path: "/spectator/wallet" },
    { label: "Bảng xếp hạng",       icon: BarChart2,     path: "/leaderboard" },
  ],
};

const ROLE_BADGE = {
  Admin:           { label: "Admin",          cls: "bg-white/[0.12] text-white border-white/[0.18]" },
  OrganizerHead:   { label: "Trưởng BTC",     cls: "bg-white/[0.12] text-white border-white/[0.18]" },
  OrganizerMember: { label: "Thành viên BTC", cls: "bg-white/[0.12] text-white border-white/[0.18]" },
  HorseOwner:      { label: "Chủ ngựa",       cls: "bg-white/[0.12] text-white border-white/[0.18]" },
  Jockey:          { label: "Nài ngựa",       cls: "bg-white/[0.12] text-white border-white/[0.18]" },
  Referee:         { label: "Trọng tài",      cls: "bg-white/[0.12] text-white border-white/[0.18]" },
  Spectator:       { label: "Khán giả",       cls: "bg-white/[0.12] text-white border-white/[0.18]" },
};

export default function Sidebar() {
  const { logout, role } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const menu = MENU_BY_ROLE[role] || [];
  const badge = ROLE_BADGE[role];

  return (
    <aside
      className={`relative flex flex-col h-screen transition-all duration-300 ease-in-out shrink-0 ${
        collapsed ? "w-[60px]" : "w-60"
      }`}
      style={{
        background: "linear-gradient(180deg, #2563EB 0%, #3B82F6 50%, #2563EB 100%)",
        boxShadow: "4px 0 20px rgba(59,130,246,0.20)",
      }}
    >
      {/* Subtle shimmer at top */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/[0.04] rounded-full blur-3xl pointer-events-none" />

      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/[0.12] shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.15] border border-white/[0.2]">
                <Zap size={14} className="text-amber-300" />
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-white font-bold text-xs tracking-widest uppercase leading-none">
                HorseRacing
              </p>
              <p className="text-blue-200 text-[9px] tracking-widest uppercase mt-0.5 opacity-80">
                Management
              </p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="mx-auto w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.15] border border-white/[0.2]">
            <Zap size={14} className="text-amber-300" />
          </div>
        )}

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="ml-2 p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/[0.1] transition-all duration-200 shrink-0"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="absolute -right-3 top-[72px] z-10 w-6 h-6 rounded-full bg-blue-700 border border-blue-500/40 flex items-center justify-center text-white hover:bg-blue-600 transition-all shadow-md shadow-blue-900/40"
        >
          <ChevronRight size={11} />
        </button>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden px-2">
        {!collapsed && (
          <p className="px-2 mb-2 text-[10px] font-semibold text-blue-300 uppercase tracking-widest opacity-70">
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
                  ? "text-white bg-white/[0.12] border border-white/[0.10]"
                  : "text-blue-100 hover:text-white hover:bg-white/[0.07] border border-transparent hover:border-white/[0.06]"
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                {/* Active left bar */}
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                )}

                {/* Icon */}
                <span className={`shrink-0 transition-all duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-blue-300 group-hover:text-white"
                }`}>
                  <item.icon size={16} />
                </span>

                {/* Label */}
                {!collapsed && (
                  <span className="truncate font-medium">{item.label}</span>
                )}

                {/* Active dot when collapsed */}
                {isActive && collapsed && (
                  <span className="absolute right-0.5 top-1.5 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Role badge + Logout ── */}
      <div className="border-t border-white/[0.12] p-3 space-y-2 shrink-0">
        {badge && !collapsed && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${badge.cls}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            <span className="truncate">{badge.label}</span>
          </div>
        )}

        <button
          onClick={() => { logout(); navigate("/login"); }}
          className={`group flex items-center gap-3 w-full rounded-xl text-sm text-blue-200 hover:text-red-300 hover:bg-red-400/[0.12] border border-transparent hover:border-red-400/[0.2] transition-all duration-200 ${
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
