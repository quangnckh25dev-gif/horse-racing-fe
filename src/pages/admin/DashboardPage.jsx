import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, UserCheck, Trophy, Calendar, CheckCircle2,
  HardHat, Loader2, AlertCircle, RefreshCw, TrendingUp,
  Clock, Target,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { adminService } from "../../services/admin";
import { useAuth } from "../../context/AuthContext";

// ── Stat card component ───────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color, onClick, loading }) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#111827]/80 border border-gray-800/60 rounded-xl p-5 flex items-start gap-4 transition-all ${
        onClick ? "cursor-pointer hover:border-[#D4AF37]/40 hover:bg-[#111827]" : ""
      }`}
    >
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-400 text-xs font-medium uppercase tracking-widest truncate">{label}</p>
        {loading ? (
          <div className="h-7 w-16 bg-gray-800 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-white mt-0.5">{value ?? "—"}</p>
        )}
        {sub && !loading && (
          <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

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

  useEffect(() => { fetchStats(); }, []);

  const predAccuracy = stats?.totalPredictions > 0
    ? Math.round((stats.correctPredictions / stats.totalPredictions) * 100)
    : null;

  return (
    <AdminLayout title="Dashboard">
      <div className="p-6 max-w-6xl mx-auto">

        {/* Greeting */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">
            Xin chào, <span className="text-[#D4AF37]">{user?.fullName || user?.username}</span> 👋
          </h2>
          <p className="text-gray-400 text-sm mt-1">Đây là tổng quan hệ thống hôm nay.</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-3 rounded-lg bg-red-950/50 border border-red-900 text-red-200 text-sm">
            <AlertCircle size={15} className="shrink-0 text-red-400" />
            {error}
            <button onClick={fetchStats} className="ml-auto flex items-center gap-1 text-xs hover:text-white transition-colors">
              <RefreshCw size={13} /> Thử lại
            </button>
          </div>
        )}

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label="Tổng người dùng"
            value={stats?.totalActiveUsers}
            color="bg-blue-900/30 text-blue-300"
            loading={loading}
            onClick={() => navigate("/admin/users")}
          />
          <StatCard
            icon={UserCheck}
            label="Chờ phê duyệt"
            value={stats?.pendingApprovals}
            sub={stats?.pendingApprovals > 0 ? "Cần xử lý" : "Đã xử lý hết"}
            color={stats?.pendingApprovals > 0
              ? "bg-yellow-900/30 text-yellow-300"
              : "bg-green-900/30 text-green-300"}
            loading={loading}
            onClick={() => navigate("/admin/users/pending")}
          />
          <StatCard
            icon={Trophy}
            label="Giải đang diễn ra"
            value={stats?.ongoingTournaments}
            color="bg-[#D4AF37]/10 text-[#D4AF37]"
            loading={loading}
            onClick={() => navigate("/admin/tournaments")}
          />
          <StatCard
            icon={Clock}
            label="Cuộc đua sắp tới"
            value={stats?.upcomingRaces}
            color="bg-purple-900/30 text-purple-300"
            loading={loading}
          />
          <StatCard
            icon={CheckCircle2}
            label="Cuộc đua đã kết thúc"
            value={stats?.finishedRaces}
            color="bg-green-900/30 text-green-300"
            loading={loading}
          />
          <StatCard
            icon={HardHat}
            label="Tổng số ngựa"
            value={stats?.totalHorses}
            color="bg-orange-900/30 text-orange-300"
            loading={loading}
          />
          <StatCard
            icon={Calendar}
            label="Tổng số jockey"
            value={stats?.totalJockeys}
            color="bg-pink-900/30 text-pink-300"
            loading={loading}
          />
          <StatCard
            icon={Target}
            label="Dự đoán kết quả"
            value={stats?.totalPredictions}
            sub={predAccuracy !== null ? `${predAccuracy}% chính xác` : undefined}
            color="bg-cyan-900/30 text-cyan-300"
            loading={loading}
          />
        </div>

        {/* ── Quick actions ── */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Truy cập nhanh</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Duyệt tài khoản", icon: UserCheck, path: "/admin/users/pending", cls: "border-yellow-800/50 hover:border-yellow-600/60 text-yellow-300" },
              { label: "Quản lý người dùng", icon: Users, path: "/admin/users", cls: "border-blue-800/50 hover:border-blue-600/60 text-blue-300" },
              { label: "Tạo giải đấu", icon: Trophy, path: "/admin/tournaments", cls: "border-[#D4AF37]/30 hover:border-[#D4AF37]/60 text-[#D4AF37]" },
              { label: "Xem lịch đua", icon: Calendar, path: "/admin/tournaments", cls: "border-purple-800/50 hover:border-purple-600/60 text-purple-300" },
            ].map((item) => (
              <button
                key={item.path + item.label}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 p-4 rounded-xl border bg-[#111827]/60 transition-all text-left ${item.cls}`}
              >
                <item.icon size={18} className="shrink-0" />
                <span className="text-sm font-medium text-white">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Refresh */}
        <div className="flex justify-end mt-6">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#D4AF37] transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Cập nhật dữ liệu
          </button>
        </div>

      </div>
    </AdminLayout>
  );
}
