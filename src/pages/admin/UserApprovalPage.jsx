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
      <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
              <Users size={20} className="text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Duyệt tài khoản</h1>
              <p className="text-gray-400 text-sm">Danh sách tài khoản chờ phê duyệt</p>
            </div>
          </div>
          <button
            onClick={fetchPendingUsers}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all text-sm"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 p-3 rounded-lg bg-red-950/50 border border-red-900 text-red-200 text-sm">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <CheckCircle2 size={48} className="text-green-600 mb-4" />
            <p className="text-lg font-medium">Không có tài khoản nào chờ duyệt</p>
            <p className="text-sm mt-1">Tất cả đã được xử lý</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-400">
              Có <span className="text-[#D4AF37] font-semibold">{users.length}</span> tài khoản đang chờ phê duyệt
            </div>

            {/* Table */}
            <div className="rounded-xl border border-gray-800/60 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#111827] border-b border-gray-800/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Tài khoản</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Họ tên</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">SĐT</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Role</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr
                      key={user.userId}
                      className={`border-b border-gray-800/40 transition-colors hover:bg-[#111827]/60 ${idx % 2 === 0 ? "bg-[#0A0E1A]/60" : "bg-[#0d1220]/60"}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-white">{user.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{user.fullName}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{user.phone || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                          {user.roleName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            disabled={actionLoading !== null}
                            onClick={() => handleApprove(user.userId)}
                            className="h-8 px-3 bg-green-700/80 hover:bg-green-600 text-white text-xs font-semibold border-0"
                          >
                            {actionLoading === user.userId + "_approve" ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <><CheckCircle2 size={13} className="mr-1" /> Duyệt</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            disabled={actionLoading !== null}
                            onClick={() => handleReject(user.userId)}
                            className="h-8 px-3 bg-red-800/80 hover:bg-red-700 text-white text-xs font-semibold border-0"
                          >
                            {actionLoading === user.userId + "_reject" ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <><XCircle size={13} className="mr-1" /> Từ chối</>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      </div>
    </AdminLayout>
  );
}
