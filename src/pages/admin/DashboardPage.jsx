import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, UserCheck, Trophy, Calendar, CheckCircle2,
  HardHat, Loader2, AlertCircle, RefreshCw, TrendingUp,
  Clock, Target, Flag, Star, Mail, PawPrint, Award,
  ChevronRight, Zap, BarChart2,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { adminService } from "../../services/admin";
import { useAuth } from "../../context/AuthContext";

const ROLE_LINKS = {
  OrganizerHead: [
    { label: "Quản lý vòng đua",    icon: Flag,  path: "/organizer/races",   color: "text-blue-400",   bg: "bg-blue-500/10",  border: "border-blue-800/50 hover:border-blue-500/50" },
    { label: "Duyệt kết quả",       icon: Award, path: "/organizer/results",  color: "text-[#D4AF37]",  bg: "bg-[#D4AF37]/10", border: "border-[#D4AF37]/30 hover:border-[#D4AF37]/60" },
    { label: "Đổi mật khẩu",        icon: Target, path: "/change-password",  color: "text-gray-400",   bg: "bg-white/5",      border: "border-gray-700 hover:border-gray-500" },
  ],
  OrganizerMember: [
    { label: "Quản lý vòng đua",    icon: Flag,   path: "/organizer/races",     color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-800/50 hover:border-blue-500/50" },
    { label: "Phân công trọng tài", icon: Users,  path: "/organizer/referees",  color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-800/50 hover:border-purple-500/50" },
    { label: "Đổi mật khẩu",        icon: Target, path: "/change-password",     color: "text-gray-400",   bg: "bg-white/5",       border: "border-gray-700 hover:border-gray-500" },
  ],
  HorseOwner: [
    { label: "Ngựa của tôi",        icon: PawPrint, path: "/owner/horses",            color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-800/50 hover:border-orange-500/50" },
    { label: "Đăng ký thi đấu",     icon: Trophy,   path: "/owner/race-registration", color: "text-[#D4AF37]",  bg: "bg-[#D4AF37]/10",  border: "border-[#D4AF37]/30 hover:border-[#D4AF37]/60" },
    { label: "Lời mời Jockey",      icon: Mail,     path: "/owner/invitations",       color: "text-pink-400",   bg: "bg-pink-500/10",   border: "border-pink-800/50 hover:border-pink-500/50" },
    { label: "Đổi mật khẩu",        icon: Target,   path: "/change-password",         color: "text-gray-400",   bg: "bg-white/5",       border: "border-gray-700 hover:border-gray-500" },
  ],
  Jockey: [
    { label: "Lời mời thi đấu",     icon: Mail,   path: "/jockey/invitations", color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10", border: "border-[#D4AF37]/30 hover:border-[#D4AF37]/60" },
    { label: "Đổi mật khẩu",        icon: Target, path: "/change-password",    color: "text-gray-400",  bg: "bg-white/5",      border: "border-gray-700 hover:border-gray-500" },
  ],
  Referee: [
    { label: "Vòng đua của tôi",    icon: Flag,   path: "/referee/races",   color: "text-blue-400",  bg: "bg-blue-500/10", border: "border-blue-800/50 hover:border-blue-500/50" },
    { label: "Đổi mật khẩu",        icon: Target, path: "/change-password", color: "text-gray-400",  bg: "bg-white/5",     border: "border-gray-700 hover:border-gray-500" },
  ],
  Spectator: [
    { label: "Lịch thi đấu",        icon: Calendar, path: "/spectator/schedule",    color: "text-blue-400",  bg: "bg-blue-500/10",  border: "border-blue-800/50 hover:border-blue-500/50" },
    { label: "Dự đoán kết quả",     icon: Star,     path: "/spectator/predictions", color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10", border: "border-[#D4AF37]/30 hover:border-[#D4AF37]/60" },
    { label: "Bảng xếp hạng",       icon: BarChart2,path: "/leaderboard",           color: "text-purple-400",bg: "bg-purple-500/10",border: "border-purple-800/50 hover:border-purple-500/50" },
    { label: "Đổi mật khẩu",        icon: Target,   path: "/change-password",       color: "text-gray-400",  bg: "bg-white/5",      border: "border-gray-700 hover:border-gray-500" },
  ],
};

const ROLE_LABELS = {
  Admin: "Quản trị viên",
  OrganizerHead: "Trưởng ban tổ chức",
  OrganizerMember: "Thành viên ban tổ chức",
  HorseOwner: "Chủ ngựa",
  Jockey: "Nài ngựa",
  Referee: "Trọng tài",
  Spectator: "Khán giả",
};

const ROLE_TAGLINE = {
  OrganizerHead: "Quản lý toàn bộ vòng đua và phê duyệt kết quả thi đấu.",
  OrganizerMember: "Hỗ trợ tổ chức và phân công trọng tài cho các vòng đua.",
  HorseOwner: "Quản lý ngựa, đăng ký thi đấu và xem các lời mời Jockey.",
  Jockey: "Xem và phản hồi các lời mời thi đấu từ chủ ngựa.",
  Referee: "Xem lịch trọng tài và quản lý kết quả các vòng đua.",
  Spectator: "Theo dõi lịch thi đấu, dự đoán kết quả và xem bảng xếp hạng.",
};

function RoleDashboard({ user, role, navigate }) {
  const links = ROLE_LINKS[role] || [];

  return (
    <AdminLayout title="Dashboard">
      <div className="p-6 max-w-5xl mx-auto">

        {/* ── Hero card ── */}
        <div className="relative mb-6 rounded-2xl overflow-hidden min-h-[180px] flex flex-col justify-end"
          style={{ backgroundImage: "linear-gradient(to bottom, rgba(10,14,26,0.25), rgba(10,14,26,0.92)), url('/bg-horse.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent pointer-events-none" />
          <div className="relative p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] live-dot" />
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest font-data">
                {ROLE_LABELS[role] || role}
              </span>
            </div>
            <h2 className="font-display text-2xl font-black text-white leading-tight">
              Xin chào, <span className="text-gold-gradient">{user?.fullName || user?.username}</span>
            </h2>
            <p className="text-gray-400 text-sm mt-1">{ROLE_TAGLINE[role] || "Chào mừng trở lại hệ thống."}</p>
          </div>
        </div>

        {/* ── Quick links grid ── */}
        <div className="mb-2">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-4 font-data">Truy cập nhanh</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {links.map((item) => (
            <button
              key={item.path + item.label}
              onClick={() => navigate(item.path)}
              className={`glass-card group flex items-center gap-4 p-5 rounded-2xl border ${item.border} text-left transition-all duration-200`}
            >
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0 ${item.color}`}>
                <item.icon size={18} />
              </div>
              <span className="font-medium text-white text-sm flex-1">{item.label}</span>
              <ChevronRight size={14} className="text-gray-600 group-hover:text-[#D4AF37] transition-colors" />
            </button>
          ))}
        </div>

      </div>
    </AdminLayout>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color, bg, onClick, loading, accent }) {
  return (
    <div
      onClick={onClick}
      className={`glass-card group relative rounded-2xl p-5 flex items-center gap-4 overflow-hidden ${onClick ? "cursor-pointer" : ""} ${accent ? "border-l-4 border-l-[#D4AF37]/60" : ""}`}
    >
      {accent && <div className="absolute inset-0 bg-[#D4AF37]/[0.03] pointer-events-none" />}
      <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        <Icon size={20} className={color} />
      </div>
      <div className="flex-1 min-w-0 relative">
        <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest truncate font-data">{label}</p>
        {loading ? (
          <div className="h-8 w-16 shimmer rounded-lg mt-1.5" />
        ) : (
          <p className={`text-3xl font-black mt-0.5 tabular-nums font-display ${accent ? "text-gold-gradient" : "text-white"}`}>{value ?? "—"}</p>
        )}
        {sub && !loading && <p className="text-gray-500 text-xs mt-0.5 truncate">{sub}</p>}
      </div>
      {onClick && !loading && (
        <TrendingUp size={14} className="text-gray-700 group-hover:text-[#D4AF37]/50 transition-colors shrink-0" />
      )}
    </div>
  );
}

// ── Main Admin Dashboard ───────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  if (role && role !== "Admin") {
    return <RoleDashboard user={user} role={role} navigate={navigate} />;
  }

  const fetchStats = async () => {
    setLoading(true); setError("");
    try {
      const res = await adminService.getDashboardStats();
      setStats(res.data);
    } catch (err) {
      setError(err.message || "Không thể tải thống kê.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []); // eslint-disable-line

  const predAccuracy = stats?.totalPredictions > 0
    ? Math.round((stats.correctPredictions / stats.totalPredictions) * 100)
    : null;

  const QUICK_ACTIONS = [
    { label: "Duyệt tài khoản",    icon: UserCheck,   path: "/admin/users/pending", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-white/5 hover:border-yellow-500/30" },
    { label: "Quản lý người dùng", icon: Users,       path: "/admin/users",          color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-white/5 hover:border-blue-500/30" },
    { label: "Quản lý giải đấu",   icon: Trophy,      path: "/admin/tournaments",    color: "text-[#D4AF37]",  bg: "bg-[#D4AF37]/10",  border: "border-white/5 hover:border-[#D4AF37]/30" },
  ];

  const STAT_CARDS = [
    { icon: Users,        label: "Người dùng",     value: stats?.totalActiveUsers,    color: "text-blue-400",   bg: "bg-blue-500/10",   sub: undefined, onClick: () => navigate("/admin/users") },
    { icon: UserCheck,    label: "Chờ duyệt",      value: stats?.pendingApprovals,    color: stats?.pendingApprovals > 0 ? "text-yellow-400" : "text-green-400", bg: stats?.pendingApprovals > 0 ? "bg-yellow-500/10" : "bg-green-500/10", sub: stats?.pendingApprovals > 0 ? "⚠ Cần xử lý" : "✓ Đã xử lý hết", onClick: () => navigate("/admin/users/pending") },
    { icon: Trophy,       label: "Giải đang diễn", value: stats?.ongoingTournaments,  color: "text-[#D4AF37]",  bg: "bg-[#D4AF37]/10",  sub: undefined, onClick: () => navigate("/admin/tournaments"), accent: true },
  ];

  const DETAIL_STATS = [
    { icon: Clock,        label: "Đua sắp tới",   value: stats?.upcomingRaces,    color: "text-purple-400",  bg: "bg-purple-500/10" },
    { icon: CheckCircle2, label: "Đua đã kết thúc",value: stats?.finishedRaces,   color: "text-green-400",   bg: "bg-green-500/10" },
    { icon: HardHat,      label: "Tổng ngựa",     value: stats?.totalHorses,      color: "text-orange-400",  bg: "bg-orange-500/10" },
    { icon: Calendar,     label: "Tổng jockey",   value: stats?.totalJockeys,     color: "text-pink-400",    bg: "bg-pink-500/10" },
    { icon: Target,       label: "Dự đoán",       value: stats?.totalPredictions, color: "text-cyan-400",    bg: "bg-cyan-500/10",  sub: predAccuracy !== null ? `${predAccuracy}% chính xác` : undefined },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="p-6 max-w-6xl mx-auto space-y-5">

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-950/40 border border-red-900/60 text-red-200 text-sm">
            <AlertCircle size={15} className="shrink-0 text-red-400" />
            {error}
            <button onClick={fetchStats} className="ml-auto flex items-center gap-1.5 text-xs text-red-400 hover:text-red-200 transition-colors">
              <RefreshCw size={12} /> Thử lại
            </button>
          </div>
        )}

        {/* ── Top stats row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STAT_CARDS.map((card, i) => (
            <div key={i} style={{ animationDelay: `${i * 60}ms` }} className="animate-fade-in-up">
              <StatCard {...card} loading={loading} />
            </div>
          ))}
        </div>

        {/* ── Main 2/3 + 1/3 grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left 2/3 */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Featured hero card */}
            <div className="relative rounded-2xl overflow-hidden min-h-[220px] flex flex-col justify-end group border border-white/[0.06]">
              <div className="absolute inset-0">
                <div className="absolute inset-0 w-full h-full bg-cover bg-center opacity-35 mix-blend-luminosity group-hover:opacity-50 transition-opacity duration-500"
                  style={{ backgroundImage: "url('/bg-horse.png')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-[#0A0E1A]/75 to-transparent" />
              </div>
              <div className="relative z-10 p-6 flex flex-col md:flex-row items-end justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] live-dot" />
                    <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest font-data">Hệ thống đang hoạt động</span>
                  </div>
                  <h2 className="font-display text-2xl font-black text-white leading-tight mb-1">
                    Xin chào, <span className="text-gold-gradient">{user?.fullName || user?.username}</span>
                  </h2>
                  <p className="text-gray-400 text-sm">Tổng quan hệ thống quản lý giải đua ngựa.</p>
                </div>
                <button
                  onClick={() => navigate("/admin/tournaments")}
                  className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shrink-0"
                >
                  Quản lý giải đấu <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Detail stats grid */}
            <div>
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3 font-data">Thống kê chi tiết</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {DETAIL_STATS.map((card, i) => (
                  <div key={i} style={{ animationDelay: `${i * 40}ms` }} className="animate-fade-in-up">
                    <StatCard {...card} loading={loading} />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right 1/3 */}
          <div className="flex flex-col gap-5">

            {/* Quick Actions */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/[0.06]">
                <div className="w-6 h-6 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                  <Zap size={12} className="text-[#D4AF37]" />
                </div>
                <h3 className="font-display font-bold text-sm text-white">Truy cập nhanh</h3>
              </div>
              <div className="space-y-2">
                {QUICK_ACTIONS.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`group w-full flex items-center gap-3 p-3.5 rounded-xl bg-[#0d1220]/60 border ${item.border} transition-all duration-200 text-left`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0 ${item.color}`}>
                      <item.icon size={15} />
                    </div>
                    <span className="text-white text-sm font-medium flex-1">{item.label}</span>
                    <ChevronRight size={13} className="text-gray-700 group-hover:text-[#D4AF37] transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* System status card */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                <h3 className="font-display font-bold text-sm text-white">Trạng thái hệ thống</h3>
                <button
                  onClick={fetchStats}
                  disabled={loading}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all"
                  title="Làm mới"
                >
                  <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { label: "API Backend",    status: "online", dot: "bg-green-400" },
                  { label: "Database",       status: "online", dot: "bg-green-400" },
                  { label: "Auth Service",   status: "online", dot: "bg-green-400" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">{s.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shadow-[0_0_6px_rgba(34,197,94,0.6)]`} />
                      <span className="text-green-400 text-[10px] font-semibold font-data uppercase">{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
