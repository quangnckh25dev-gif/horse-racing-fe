import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw, Users } from "lucide-react";
import { Button } from "../../components/ui/button";
import { adminService } from "../../services/admin";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/layout/AdminLayout";

export default function UserApprovalPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // userId đang xử lý

  const fetchPendingUsers = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const result = await adminService.getPendingUsers();
      setUsers(result.data || []);
    } catch (err) {
      setErrorMsg(err.message || "Không thể tải danh sách người dùng.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (userId) => {
    setActionLoading(userId + "_approve");
    try {
      await adminService.approveUser(userId, currentUser.userId);
      setUsers((prev) => prev.filter((u) => u.userId !== userId));
    } catch (err) {
      setErrorMsg(err.message || "Duyệt tài khoản thất bại.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    setActionLoading(userId + "_reject");
    try {
      await adminService.rejectUser(userId, currentUser.userId);
      setUsers((prev) => prev.filter((u) => u.userId !== userId));
    } catch (err) {
      setErrorMsg(err.message || "Từ chối tài khoản thất bại.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout title="Duyệt tài khoản">

      {/* ── Page Header Banner ── */}
      <div className="page-header">
        <div className="absolute right-0 top-0 w-72 h-full bg-gradient-to-l from-yellow-500/[0.04] to-transparent pointer-events-none" />
        {users.length > 0 && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-6xl opacity-[0.1] select-none pointer-events-none animate-float">⏳</div>
        )}

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <Users size={14} className="text-yellow-400" />
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Admin</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Duyệt tài khoản</h1>
            <div className="flex items-center gap-3 mt-2">
              {users.length > 0
                ? <span className="stat-pill text-yellow-400"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot inline-block" /> {users.length} chờ phê duyệt</span>
                : <span className="stat-pill text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Tất cả đã xử lý</span>
              }
            </div>
          </div>
          <button onClick={fetchPendingUsers} disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-gray-700/60 rounded-xl text-gray-400 hover:text-white text-sm transition-all shrink-0">
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {errorMsg && (
          <div className="mb-5 flex items-center gap-3 p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-300 text-sm">
            <AlertCircle size={15} className="text-red-400 shrink-0" /> {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 shimmer rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-green-500/5 border border-green-500/10 flex items-center justify-center mb-4 animate-float">
              <CheckCircle2 size={32} className="text-green-500/40" />
            </div>
            <p className="text-white font-semibold mb-1">Không có tài khoản chờ duyệt</p>
            <p className="text-gray-500 text-sm">Tất cả tài khoản đã được xử lý</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user, idx) => {
              const initials = (user.fullName || user.username || "?")[0].toUpperCase();
              const approveLoading = actionLoading === user.userId + "_approve";
              const rejectLoading  = actionLoading === user.userId + "_reject";
              const busy = actionLoading !== null;

              return (
                <div
                  key={user.userId}
                  className="group bg-[#0d1117] border border-yellow-500/15 rounded-xl overflow-hidden card-hover border-l-gold-glow animate-fade-in-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/25 flex items-center justify-center shrink-0">
                      <span className="text-[#D4AF37] font-black text-lg">{initials}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1">
                        <p className="text-white font-bold">{user.fullName || user.username}</p>
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/25 font-bold">
                          {user.roleName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/25 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot" /> Chờ duyệt
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <span className="stat-pill">👤 {user.username}</span>
                        {user.email && <span className="stat-pill">✉️ {user.email}</span>}
                        {user.phone && <span className="stat-pill">📞 {user.phone}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => handleApprove(user.userId)}
                        className="flex items-center gap-1.5 h-9 px-4 bg-green-600/20 hover:bg-green-600/35 text-green-300 border border-green-600/30 hover:border-green-600/50 rounded-xl text-xs font-bold transition-all"
                      >
                        {approveLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        Duyệt
                      </Button>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => handleReject(user.userId)}
                        className="flex items-center gap-1.5 h-9 px-4 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/20 hover:border-red-600/40 rounded-xl text-xs font-medium transition-all"
                      >
                        {rejectLoading ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                        Từ chối
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
