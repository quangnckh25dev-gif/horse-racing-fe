import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home, Users, UserCheck, Trophy, LogOut,
  ChevronLeft, ChevronRight,
  Flag, ClipboardList, Mail, Calendar,
  Award, PawPrint, User, BarChart2, Wallet, DollarSign,
  FileText, Settings,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const MENU_BY_ROLE = {
  Admin: [
    { label: "Dashboard",           icon: Home,          path: "/dashboard" },
    { label: "Duyệt tài khoản",     icon: UserCheck,     path: "/admin/users/pending" },
    { label: "Quản lý người dùng",  icon: Users,         path: "/admin/users" },
    { label: "Duyệt giải đấu",      icon: Trophy,        path: "/admin/tournaments" },
    { label: "Duyệt nạp tiền",      icon: Wallet,        path: "/admin/deposit-requests" },
    { label: "Nhật ký hệ thống",    icon: FileText,      path: "/admin/audit-logs" },
    { label: "Cấu hình hệ thống",   icon: Settings,      path: "/admin/configs" },
  ],
  // 1 role Organizer duy nhất (đã bỏ OrganizerHead/OrganizerMember)
  Organizer: [
    { label: "Dashboard",           icon: Home,          path: "/dashboard" },
    { label: "Quản lý vòng đua",    icon: Flag,          path: "/organizer/races" },
    { label: "Phân công trọng tài", icon: ClipboardList, path: "/organizer/referees" },
    { label: "Duyệt kết quả",       icon: Award,         path: "/organizer/results" },
    { label: "Hồ sơ cá nhân",       icon: User,          path: "/profile" },
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

const ROLE_LABEL = {
  Admin:      "Admin",
  Organizer:  "Ban tổ chức",
  HorseOwner: "Chủ ngựa",
  Jockey:     "Nài ngựa",
  Referee:    "Trọng tài",
  Spectator:  "Khán giả",
};

export default function Sidebar() {
  const { logout, role } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const menu = MENU_BY_ROLE[role] || [];
  const roleLabel = ROLE_LABEL[role];

  return (
    <aside
      className={`relative flex flex-col h-screen shrink-0 bg-sb-s1 border-r border-sb-border transition-all duration-300 ${
        collapsed ? "w-[60px]" : "w-60"
      }`}
    >
      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-sb-border shrink-0">
        {collapsed ? (
          <div className="mx-auto w-8 h-8 rounded-lg flex items-center justify-center bg-sb-emerald-soft border border-sb-emerald-bd text-base">
            🏇
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sb-emerald-soft border border-sb-emerald-bd text-base shrink-0">
                🏇
              </div>
              <div className="overflow-hidden">
                <p className="text-sb-tx font-bold text-xs tracking-widest uppercase leading-none">
                  HorseRacing
                </p>
                <p className="text-sb-tx-3 text-[9px] tracking-widest uppercase mt-0.5">
                  Season 2026
                </p>
              </div>
            </div>
            <button onClick={() => setCollapsed(true)}
              className="ml-2 p-1.5 rounded-lg text-sb-tx-3 hover:text-sb-tx hover:bg-sb-s2 transition-colors shrink-0">
              <ChevronLeft size={14} />
            </button>
          </>
        )}
      </div>

      {collapsed && (
        <button onClick={() => setCollapsed(false)}
          className="absolute -right-3 top-[72px] z-10 w-6 h-6 rounded-full bg-sb-s2 border border-sb-border flex items-center justify-center text-sb-tx-2 hover:text-sb-tx transition-colors">
          <ChevronRight size={11} />
        </button>
      )}

      {/* ── Menu ── */}
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden px-2">
        {!collapsed && (
          <p className="px-2 mb-2 text-[10px] font-bold text-sb-tx-3 uppercase tracking-widest">
            Menu
          </p>
        )}

        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl text-sm transition-colors border ${
                collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"
              } ${
                isActive
                  ? "text-sb-tx bg-sb-emerald-soft border-sb-emerald-bd"
                  : "text-sb-tx-2 border-transparent hover:text-sb-tx hover:bg-sb-s2"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-sb-emerald" />
                )}
                <span className={`shrink-0 ${isActive ? "text-sb-emerald-ink" : "text-sb-tx-3 group-hover:text-sb-tx-2"}`}>
                  <item.icon size={16} />
                </span>
                {!collapsed && <span className="truncate font-medium">{item.label}</span>}
                {isActive && collapsed && (
                  <span className="absolute right-1 top-1.5 w-1.5 h-1.5 rounded-full bg-sb-emerald" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Vai trò + Đăng xuất ── */}
      <div className="border-t border-sb-border p-3 space-y-2 shrink-0">
        {roleLabel && !collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sb-s2 border border-sb-border text-xs font-semibold text-sb-tx-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sb-emerald" />
            <span className="truncate">{roleLabel}</span>
          </div>
        )}

        <button
          onClick={() => { logout(); navigate("/"); }}
          title={collapsed ? "Đăng xuất" : undefined}
          className={`flex items-center gap-3 w-full rounded-xl text-sm text-sb-tx-2 border border-transparent hover:text-sb-lose hover:bg-sb-lose/10 hover:border-sb-lose/25 transition-colors ${
            collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
          }`}
        >
          <LogOut size={15} className="shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
