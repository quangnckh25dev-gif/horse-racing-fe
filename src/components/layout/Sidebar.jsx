import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home, Users, UserCheck, Trophy, LogOut,
  Shield, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const MENU_BY_ROLE = {
  Admin: [
    { label: "Dashboard",           icon: Home,      path: "/dashboard" },
    { label: "Duyệt tài khoản",     icon: UserCheck, path: "/admin/users/pending" },
    { label: "Quản lý người dùng",  icon: Users,     path: "/admin/users" },
    { label: "Quản lý giải đấu",    icon: Trophy,    path: "/admin/tournaments" },
  ],
};

export default function Sidebar() {
  const { logout, role } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const menu = MENU_BY_ROLE[role] || [];

  return (
    <aside
      className={`flex flex-col h-screen bg-[#070B14] border-r border-gray-800/60 transition-all duration-300 shrink-0 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-800/60">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
              <Shield size={14} className="text-[#D4AF37]" />
            </div>
            <span className="text-[#D4AF37] font-bold text-xs tracking-widest uppercase whitespace-nowrap">
              HorseRacing
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`text-gray-600 hover:text-[#D4AF37] transition-colors ${collapsed ? "mx-auto" : ""}`}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                isActive
                  ? "text-[#D4AF37] bg-[#D4AF37]/10 border-r-2 border-[#D4AF37]"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
              } ${collapsed ? "justify-center" : ""}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={17} className="shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-800/60 p-3">
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className={`flex items-center gap-3 w-full px-1 py-2 text-sm text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-950/20 ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Đăng xuất" : undefined}
        >
          <LogOut size={17} className="shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
