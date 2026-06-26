import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw, Users } from "lucide-react";
import { Button } from "../../components/ui/button";
import { adminService } from "../../services/admin";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/layout/AdminLayout";

const ROLE_BADGE = {
  HorseOwner:      "bg-orange-50 text-orange-700 border-orange-200",
  Jockey:          "bg-purple-50 text-purple-700 border-purple-200",
  Referee:         "bg-yellow-50 text-yellow-700 border-yellow-200",
  OrganizerHead:   "bg-amber-50 text-amber-700 border-amber-200",
  OrganizerMember: "bg-blue-50 text-blue-700 border-blue-200",
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
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Users size={20} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Duyệt tài khoản</h1>
              <p className="text-gray-500 text-sm">
                {users.length > 0
                  ? <span className="text-amber-600 font-semibold">{users.length} tài khoản</span>
                  : <span className="text-green-600 font-semibold">Đã xử lý hết</span>
                } chờ phê duyệt
              </p>
            </div>
          </div>
          <button
            onClick={fetchPendingUsers}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        {errorMsg && (
          <div className="mb-5 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            <AlertCircle size={15} className="text-red-500 shrink-0" /> {errorMsg}
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
            <div className="w-20 h-20 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <p className="text-gray-800 font-semibold mb-1">Không có tài khoản chờ duyệt</p>
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
                  className="group bg-white border border-gray-200 hover:border-blue-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all animate-fade-in-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="h-0.5 w-full bg-gradient-to-r from-amber-400 via-amber-300 to-transparent" />
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                      <span className="text-amber-700 font-black text-lg">{initials}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                        <p className="text-gray-900 font-bold">{user.fullName || user.username}</p>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold ${ROLE_BADGE[user.roleName] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                          {user.roleName}
                        </span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 live-dot" /> Chờ duyệt
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
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
                        className="flex items-center gap-1.5 h-9 px-4 bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 hover:border-green-400 rounded-xl text-xs font-bold transition-all"
                      >
                        {approveLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        Duyệt
                      </Button>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => handleReject(user.userId)}
                        className="flex items-center gap-1.5 h-9 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 rounded-xl text-xs font-medium transition-all"
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
