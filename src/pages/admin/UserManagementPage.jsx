import { useState, useEffect } from "react";
import {
  Users, RefreshCw, Loader2, AlertCircle, CheckCircle2, Shield,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { adminService } from "../../services/admin";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/layout/AdminLayout";

const ROLES = ["Admin", "HorseOwner", "Jockey", "Referee", "Spectator"];

const ROLE_STYLE = {
  Admin:      "bg-red-900/30 text-red-300 border-red-800/50",
  HorseOwner: "bg-blue-900/30 text-blue-300 border-blue-800/50",
  Jockey:     "bg-purple-900/30 text-purple-300 border-purple-800/50",
  Referee:    "bg-yellow-900/30 text-yellow-300 border-yellow-800/50",
  Spectator:  "bg-gray-800/60 text-gray-300 border-gray-700/50",
};

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingRole, setPendingRole] = useState({}); // { userId: roleName }
  const [actionLoading, setActionLoading] = useState(null);
  const [successId, setSuccessId] = useState(null); // userId vừa đổi role thành công

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const result = await adminService.getAllUsers();
      setUsers(result.data || []);
    } catch (err) {
      setErrorMsg(err.message || "Không thể tải danh sách người dùng.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = (userId, newRole) => {
    setPendingRole((prev) => ({ ...prev, [userId]: newRole }));
  };

  const handleSaveRole = async (user) => {
    const newRole = pendingRole[user.userId];
    if (!newRole || newRole === user.roleName) return;

    setActionLoading(user.userId);
    setErrorMsg("");
    try {
      await adminService.changeUserRole(user.userId, newRole, currentUser.userId);
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === user.userId ? { ...u, roleName: newRole } : u
        )
      );
      setPendingRole((prev) => { const next = { ...prev }; delete next[user.userId]; return next; });
      setSuccessId(user.userId);
      setTimeout(() => setSuccessId(null), 2000);
    } catch (err) {
      setErrorMsg(`Đổi role thất bại: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const isDirty = (user) =>
    pendingRole[user.userId] && pendingRole[user.userId] !== user.roleName;

  return (
    <AdminLayout title="Quản lý người dùng">
      <div className="p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
              <Shield size={20} className="text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Quản lý người dùng</h1>
              <p className="text-gray-400 text-sm">Xem và phân quyền tài khoản trong hệ thống</p>
            </div>
          </div>
          <button
            onClick={fetchUsers}
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
            <Users size={48} className="mb-4" />
            <p className="text-lg font-medium">Chưa có người dùng nào</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-400">
              Tổng cộng <span className="text-[#D4AF37] font-semibold">{users.length}</span> tài khoản
            </div>

            <div className="rounded-xl border border-gray-800/60 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#111827] border-b border-gray-800/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Tài khoản</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Họ tên</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Trạng thái</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Role hiện tại</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Đổi Role</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Lưu</th>
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
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${user.isApproved ? "bg-green-900/30 text-green-300 border-green-800/50" : "bg-yellow-900/30 text-yellow-300 border-yellow-800/50"}`}>
                          {user.isApproved ? "Đã duyệt" : "Chờ duyệt"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${ROLE_STYLE[user.roleName] || ROLE_STYLE.Spectator}`}>
                          {user.roleName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={pendingRole[user.userId] ?? user.roleName}
                          onChange={(e) => handleRoleChange(user.userId, e.target.value)}
                          className="bg-[#0A0E1A] border border-gray-700 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#D4AF37] transition-colors"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {successId === user.userId ? (
                          <CheckCircle2 size={20} className="text-green-400 mx-auto" />
                        ) : (
                          <Button
                            size="sm"
                            disabled={!isDirty(user) || actionLoading === user.userId}
                            onClick={() => handleSaveRole(user)}
                            className={`h-8 px-3 text-xs font-semibold border-0 transition-all ${isDirty(user) ? "bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A]" : "bg-gray-800 text-gray-600 cursor-not-allowed"}`}
                          >
                            {actionLoading === user.userId ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : "Lưu"}
                          </Button>
                        )}
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
