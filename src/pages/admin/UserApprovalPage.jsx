import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw, Users } from "lucide-react";
import { Button } from "../../components/ui/button";
import { adminService } from "../../services/admin";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/layout/AdminLayout";

const ROLE_BADGE = {
  HorseOwner: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  Jockey:     "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Referee:    "bg-sb-info/10 text-sb-info border-sb-info/30",
  Organizer:  "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd",
};

export default function UserApprovalPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

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

  useEffect(() => { fetchPendingUsers(); }, []);

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
      <div className="p-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sb-gold-soft border border-sb-gold-bd flex items-center justify-center">
              <Users size={20} className="text-sb-gold-2" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-sb-tx">Duyệt tài khoản</h1>
              <p className="text-sb-tx-3 text-sm">
                {users.length > 0
                  ? <span className="text-sb-gold-2 font-semibold">{users.length} tài khoản</span>
                  : <span className="text-sb-emerald-ink font-semibold">Đã xử lý hết</span>
                } chờ phê duyệt
              </p>
            </div>
          </div>
          <button
            onClick={fetchPendingUsers}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-sb-border text-sb-tx-3 hover:text-sb-info hover:border-blue-300 hover:bg-sb-info/10 transition-all text-sm"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        {errorMsg && (
          <div className="mb-5 flex items-center gap-3 p-4 rounded-xl bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm">
            <AlertCircle size={15} className="text-sb-lose shrink-0" /> {errorMsg}
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
            <div className="w-20 h-20 rounded-2xl bg-sb-emerald-soft border border-sb-emerald-bd flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <p className="text-sb-tx font-semibold mb-1">Không có tài khoản chờ duyệt</p>
            <p className="text-sb-tx-3 text-sm">Tất cả tài khoản đã được xử lý</p>
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
                  className="group bg-sb-s1 border border-sb-border hover:border-sb-info/30 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all animate-fade-in-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="h-0.5 w-full bg-gradient-to-r from-amber-400 via-amber-300 to-transparent" />
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-sb-gold-soft border border-sb-gold-bd flex items-center justify-center shrink-0">
                      <span className="text-sb-gold-2 font-black text-lg">{initials}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                        <p className="text-sb-tx font-bold">{user.fullName || user.username}</p>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold ${ROLE_BADGE[user.roleName] || "bg-sb-s2 text-sb-tx-2 border-sb-border"}`}>
                          {user.roleName}
                        </span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sb-gold-soft text-sb-gold-2 border border-sb-gold-bd font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 live-dot" /> Chờ duyệt
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-sb-tx-3">
                        <span className="flex items-center gap-1">👤 {user.username}</span>
                        {user.email && <span className="flex items-center gap-1">✉️ {user.email}</span>}
                        {user.phone && <span className="flex items-center gap-1">📞 {user.phone}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => handleApprove(user.userId)}
                        className="flex items-center gap-1.5 h-9 px-4 bg-sb-emerald-soft hover:bg-sb-emerald-soft text-sb-emerald-ink border border-green-300 hover:border-green-400 rounded-xl text-xs font-bold transition-all"
                      >
                        {approveLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        Duyệt
                      </Button>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => handleReject(user.userId)}
                        className="flex items-center gap-1.5 h-9 px-4 bg-sb-lose/10 hover:bg-sb-lose/20 text-sb-lose border border-sb-lose/30 hover:border-red-300 rounded-xl text-xs font-medium transition-all"
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
