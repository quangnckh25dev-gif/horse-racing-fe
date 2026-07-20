import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, UserCheck, Trophy, Calendar, CheckCircle2,
  HardHat, Loader2, AlertCircle, RefreshCw, TrendingUp,
  Clock, Target, Flag, Star, Mail, PawPrint, Award,
  ChevronRight, Zap, BarChart2, Wallet, DollarSign, Home,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { adminService } from "../../services/admin";
import { useAuth } from "../../context/AuthContext";

const ROLE_LINKS = {
  Organizer: [
    { label: "Quản lý vòng đua",    icon: Flag,   path: "/organizer/races",    color: "text-sb-info",    bg: "bg-sb-info/10",    border: "border-sb-info/30 hover:border-blue-400" },
    { label: "Phân công trọng tài", icon: Users,  path: "/organizer/referees", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30 hover:border-purple-400" },
    { label: "Duyệt kết quả",       icon: Award,  path: "/organizer/results",  color: "text-sb-gold-2",  bg: "bg-sb-gold-soft",  border: "border-sb-gold-bd hover:border-amber-400" },
    { label: "Đổi mật khẩu",        icon: Target, path: "/change-password",    color: "text-sb-tx-3",    bg: "bg-sb-s2",         border: "border-sb-border hover:border-sb-border-2" },
  ],
  HorseOwner: [
    { label: "Ngựa của tôi",        icon: PawPrint, path: "/owner/horses",            color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30 hover:border-orange-400" },
    { label: "Đăng ký thi đấu",     icon: Trophy,   path: "/owner/race-registration", color: "text-sb-gold-2",  bg: "bg-sb-gold-soft",  border: "border-sb-gold-bd hover:border-amber-400" },
    { label: "Lời mời Jockey",      icon: Mail,     path: "/owner/invitations",       color: "text-pink-400",   bg: "bg-pink-500/10",   border: "border-pink-500/30 hover:border-pink-400" },
    { label: "Đổi mật khẩu",        icon: Target,   path: "/change-password",         color: "text-sb-tx-3",   bg: "bg-sb-s2",   border: "border-sb-border hover:border-sb-border-2" },
  ],
  Jockey: [
    { label: "Lời mời thi đấu",     icon: Mail,   path: "/jockey/invitations", color: "text-sb-gold-2", bg: "bg-sb-gold-soft", border: "border-sb-gold-bd hover:border-amber-400" },
    { label: "Đổi mật khẩu",        icon: Target, path: "/change-password",    color: "text-sb-tx-3",  bg: "bg-sb-s2",  border: "border-sb-border hover:border-sb-border-2" },
  ],
  Referee: [
    { label: "Vòng đua của tôi",    icon: Flag,   path: "/referee/races",   color: "text-sb-info",  bg: "bg-sb-info/10", border: "border-sb-info/30 hover:border-blue-400" },
    { label: "Đổi mật khẩu",        icon: Target, path: "/change-password", color: "text-sb-tx-3",  bg: "bg-sb-s2", border: "border-sb-border hover:border-sb-border-2" },
  ],
  Spectator: [
    { label: "Lịch thi đấu",        icon: Calendar,  path: "/spectator/schedule",    color: "text-sb-info",   bg: "bg-sb-info/10",   border: "border-sb-info/30 hover:border-blue-400" },
    { label: "Đặt cược",            icon: DollarSign, path: "/spectator/betting",    color: "text-sb-gold-2",  bg: "bg-sb-gold-soft",  border: "border-sb-gold-bd hover:border-amber-400" },
    { label: "Bảng xếp hạng",       icon: BarChart2, path: "/leaderboard",           color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30 hover:border-purple-400" },
    { label: "Ví của tôi",          icon: Wallet,    path: "/spectator/wallet",      color: "text-sb-emerald-ink",  bg: "bg-sb-emerald-soft",  border: "border-sb-emerald-bd hover:border-green-400" },
    { label: "Đổi mật khẩu",        icon: Target,    path: "/change-password",       color: "text-sb-tx-3",   bg: "bg-sb-s2",   border: "border-sb-border hover:border-sb-border-2" },
  ],
};

const ROLE_LABELS = {
  Admin: "Quản trị viên",
  Organizer: "Ban tổ chức",
  HorseOwner: "Chủ ngựa",
  Jockey: "Nài ngựa",
  Referee: "Trọng tài",
  Spectator: "Khán giả",
};

const ROLE_TAGLINE = {
  Organizer: "Tạo giải, duyệt đăng ký, phân công trọng tài và công bố kết quả.",
  HorseOwner: "Quản lý ngựa, đăng ký thi đấu và xem các lời mời Jockey.",
  Jockey: "Xem và phản hồi các lời mời thi đấu từ chủ ngựa.",
  Referee: "Xem lịch trọng tài và quản lý kết quả các vòng đua.",
  Spectator: "Theo dõi lịch thi đấu, đặt cược và xem bảng xếp hạng.",
};

function RoleDashboard({ user, role, navigate }) {
  const links = ROLE_LINKS[role] || [];

  return (
    <AdminLayout title="Dashboard">
      <div className="p-6 max-w-5xl mx-auto">

        {/* ── Hero card (dark overlay on horse image — intentional) ── */}
        <div className="relative mb-6 rounded-2xl overflow-hidden min-h-[180px] flex flex-col justify-end"
          style={{ backgroundImage: "linear-gradient(to bottom, rgba(10,14,26,0.25), rgba(10,14,26,0.92)), url('/bg-horse.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-transparent pointer-events-none" />
          <div className="relative p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 live-dot" />
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest font-data">
                {ROLE_LABELS[role] || role}
              </span>
            </div>
            <h2 className="font-display text-2xl font-black text-white leading-tight">
              Xin chào, <span className="text-gold-gradient">{user?.fullName || user?.username}</span>
            </h2>
            <p className="text-sb-tx-3 text-sm mt-1">{ROLE_TAGLINE[role] || "Chào mừng trở lại hệ thống."}</p>
            <button
              onClick={() => navigate("/")}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sb-s1/10 hover:bg-sb-s1/20 border border-white/20 text-white/80 hover:text-sb-tx text-xs font-medium transition-all"
            >
              <Home size={12} /> Quay về trang chủ
            </button>
          </div>
        </div>

        {/* ── Quick links grid ── */}
        <div className="mb-2">
          <p className="text-[10px] font-semibold text-sb-tx-3 uppercase tracking-widest mb-4 font-data">Truy cập nhanh</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {links.map((item) => (
            <button
              key={item.path + item.label}
              onClick={() => navigate(item.path)}
              className={`group flex items-center gap-4 p-5 rounded-2xl border bg-sb-s1 hover:shadow-md ${item.border} text-left transition-all duration-200`}
            >
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0 ${item.color}`}>
                <item.icon size={18} />
              </div>
              <span className="font-medium text-sb-tx text-sm flex-1">{item.label}</span>
              <ChevronRight size={14} className="text-sb-tx-3 group-hover:text-blue-500 transition-colors" />
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
      className={`group relative bg-sb-s1 rounded-2xl p-5 flex items-center gap-4 overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200 h-full min-h-[112px] ${onClick ? "cursor-pointer" : ""} ${accent ? "border-l-4 border-l-amber-400" : "border-sb-border"}`}
    >
      {accent && <div className="absolute inset-0 bg-sb-gold-soft/30 pointer-events-none" />}
      <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        <Icon size={20} className={color} />
      </div>
      <div className="flex-1 min-w-0 relative">
        <p className="text-sb-tx-3 text-[10px] font-semibold uppercase tracking-widest truncate font-data">{label}</p>
        {loading ? (
          <div className="h-8 w-16 shimmer rounded-lg mt-1.5" />
        ) : (
          <p className={`text-3xl font-black mt-0.5 tabular-nums font-display ${accent ? "text-sb-gold-2" : "text-sb-tx"}`}>{value ?? "—"}</p>
        )}
        {sub && !loading && <p className="text-sb-tx-3 text-xs mt-0.5 truncate">{sub}</p>}
      </div>
      {onClick && !loading && (
        <TrendingUp size={14} className="text-sb-tx-3 group-hover:text-blue-500 transition-colors shrink-0" />
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

  const QUICK_ACTIONS = [
    { label: "Duyệt tài khoản",    icon: UserCheck,   path: "/admin/users/pending", color: "text-sb-gold-2", bg: "bg-sb-gold-soft",  border: "border-sb-gold-bd hover:border-amber-400" },
    { label: "Quản lý người dùng", icon: Users,       path: "/admin/users",          color: "text-sb-info",  bg: "bg-sb-info/10",   border: "border-sb-info/30 hover:border-blue-400" },
    { label: "Quản lý giải đấu",   icon: Trophy,      path: "/admin/tournaments",    color: "text-sb-gold-2", bg: "bg-sb-gold-soft",  border: "border-sb-gold-bd hover:border-amber-400" },
  ];

  const STAT_CARDS = [
    { icon: Users,     label: "Người dùng",     value: stats?.totalActiveUsers,   color: "text-sb-info",   bg: "bg-sb-info/10",   sub: undefined, onClick: () => navigate("/admin/users") },
    { icon: UserCheck, label: "Chờ duyệt",      value: stats?.pendingApprovals,   color: stats?.pendingApprovals > 0 ? "text-sb-gold-2" : "text-sb-emerald-ink", bg: stats?.pendingApprovals > 0 ? "bg-sb-gold-soft" : "bg-sb-emerald-soft", sub: stats?.pendingApprovals > 0 ? "⚠ Cần xử lý" : "✓ Đã xử lý hết", onClick: () => navigate("/admin/users/pending") },
    { icon: Trophy,    label: "Giải đang diễn", value: stats?.ongoingTournaments, color: "text-sb-gold-2",  bg: "bg-sb-gold-soft",  sub: undefined, onClick: () => navigate("/admin/tournaments"), accent: true },
  ];

  const DETAIL_STATS = [
    { icon: Clock,        label: "Đua sắp tới",    value: stats?.upcomingRaces,    color: "text-purple-400",  bg: "bg-purple-500/10" },
    { icon: CheckCircle2, label: "Đua đã kết thúc", value: stats?.finishedRaces,   color: "text-sb-emerald-ink",   bg: "bg-sb-emerald-soft" },
    { icon: HardHat,      label: "Tổng ngựa",       value: stats?.totalHorses,     color: "text-orange-400",  bg: "bg-orange-500/10" },
    { icon: Calendar,     label: "Tổng jockey",     value: stats?.totalJockeys,    color: "text-pink-400",    bg: "bg-pink-500/10" },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="p-6 max-w-6xl mx-auto space-y-5">

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm">
            <AlertCircle size={15} className="shrink-0 text-sb-lose" />
            {error}
            <button onClick={fetchStats} className="ml-auto flex items-center gap-1.5 text-xs text-red-400 hover:text-sb-lose transition-colors">
              <RefreshCw size={12} /> Thử lại
            </button>
          </div>
        )}

        {/* ── Top stats row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
          {STAT_CARDS.map((card, i) => (
            <div key={i} style={{ animationDelay: `${i * 60}ms` }} className="animate-fade-in-up h-full">
              <StatCard {...card} loading={loading} />
            </div>
          ))}
        </div>

        {/* ── Main 2/3 + 1/3 grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left 2/3 */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Featured hero card (dark overlay on horse image — intentional) */}
            <div className="relative rounded-2xl overflow-hidden min-h-[220px] flex flex-col justify-end group border border-sb-border shadow-sm">
              <div className="absolute inset-0">
                <div className="absolute inset-0 w-full h-full bg-cover bg-center opacity-35 mix-blend-luminosity group-hover:opacity-50 transition-opacity duration-500"
                  style={{ backgroundImage: "url('/bg-horse.png')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-[#0A0E1A]/75 to-transparent" />
              </div>

              <div className="relative z-10 p-6 flex flex-col md:flex-row items-end justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 live-dot" />
                    <span className="text-amber-300 text-[10px] font-bold uppercase tracking-widest font-data">Hệ thống đang hoạt động</span>
                  </div>
                  <h2 className="font-display text-2xl font-black text-white leading-tight mb-1">
                    Xin chào, <span className="text-gold-gradient">{user?.fullName || user?.username}</span>
                  </h2>
                  <p className="text-sb-tx-3 text-sm">Tổng quan hệ thống quản lý giải đua ngựa.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sb-s1/10 hover:bg-sb-s1/20 border border-white/20 text-white/80 hover:text-sb-tx text-sm font-medium transition-all"
                  >
                    <Home size={14} /> Trang chủ
                  </button>
                  <button
                    onClick={() => navigate("/admin/tournaments")}
                    className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                  >
                    Quản lý giải đấu <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Detail stats grid */}
            <div>
              <p className="text-[10px] font-semibold text-sb-tx-3 uppercase tracking-widest mb-3 font-data">Thống kê chi tiết</p>
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
            <div className="bg-sb-s1 rounded-2xl p-5 border border-sb-border shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-sb-border">
                <div className="w-6 h-6 rounded-lg bg-sb-info/10 border border-sb-info/30 flex items-center justify-center">
                  <Zap size={12} className="text-sb-info" />
                </div>
                <h3 className="font-display font-bold text-sm text-sb-tx">Truy cập nhanh</h3>
              </div>
              <div className="space-y-2">
                {QUICK_ACTIONS.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`group w-full flex items-center gap-3 p-3.5 rounded-xl bg-sb-s2/60 border ${item.border} transition-all duration-200 text-left hover:bg-sb-s1`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0 ${item.color}`}>
                      <item.icon size={15} />
                    </div>
                    <span className="text-sb-tx-2 text-sm font-medium flex-1">{item.label}</span>
                    <ChevronRight size={13} className="text-sb-tx-3 group-hover:text-blue-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* System status card */}
            <div className="bg-sb-s1 rounded-2xl p-5 border border-sb-border shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-sb-border">
                <h3 className="font-display font-bold text-sm text-sb-tx">Trạng thái hệ thống</h3>
                <button
                  onClick={fetchStats}
                  disabled={loading}
                  className="p-1.5 rounded-lg text-sb-tx-3 hover:text-sb-info hover:bg-sb-info/10 transition-all"
                  title="Làm mới"
                >
                  <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { label: "API Backend",    status: "online", dot: "bg-green-500" },
                  { label: "Database",       status: "online", dot: "bg-green-500" },
                  { label: "Auth Service",   status: "online", dot: "bg-green-500" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-sb-tx-3 text-xs">{s.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shadow-[0_0_6px_rgba(34,197,94,0.5)]`} />
                      <span className="text-sb-emerald-ink text-[10px] font-semibold font-data uppercase">{s.status}</span>
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
