import { useState, useEffect } from "react";
import {
  Users, RefreshCw, Loader2, AlertCircle, CheckCircle2, Shield,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { adminService } from "../../services/admin";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/layout/AdminLayout";

const ROLES = ["Admin", "OrganizerHead", "OrganizerMember", "HorseOwner", "Jockey", "Referee", "Spectator"];

const ROLE_STYLE = {
  Admin:           "bg-red-50 text-red-600 border-red-200",
  OrganizerHead:   "bg-amber-50 text-amber-700 border-amber-200",
  OrganizerMember: "bg-blue-50 text-blue-600 border-blue-200",
  HorseOwner:      "bg-orange-50 text-orange-600 border-orange-200",
  Jockey:          "bg-purple-50 text-purple-600 border-purple-200",
  Referee:         "bg-yellow-50 text-yellow-700 border-yellow-200",
  Spectator:       "bg-gray-50 text-gray-600 border-gray-200",
};

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingRole, setPendingRole] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [successId, setSuccessId] = useState(null);

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
        prev.map((u) => u.userId === user.userId ? { ...u, roleName: newRole } : u)
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
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                <Shield size={20} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
                <p className="text-gray-500 text-sm">Xem và phân quyền tài khoản trong hệ thống</p>
              </div>
            </div>
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
              Làm mới
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Users size={48} className="mb-4" />
              <p className="text-lg font-medium">Chưa có người dùng nào</p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-500">
                Tổng cộng <span className="text-blue-600 font-semibold">{users.length}</span> tài khoản
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Tài khoản</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Họ tên</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Trạng thái</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Role hiện tại</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Đổi Role</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Lưu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, idx) => (
                      <tr
                        key={user.userId}
                        className={`border-b border-gray-100 transition-colors hover:bg-blue-50/40 ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{user.username}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.fullName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            user.isApproved
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200"
                          }`}>
                            {user.isApproved ? "Đã duyệt" : "Chờ duyệt"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ROLE_STYLE[user.roleName] || ROLE_STYLE.Spectator}`}>
                            {user.roleName}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={pendingRole[user.userId] ?? user.roleName}
                            onChange={(e) => handleRoleChange(user.userId, e.target.value)}
                            className="bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {successId === user.userId ? (
                            <CheckCircle2 size={20} className="text-green-500 mx-auto" />
                          ) : (
                            <Button
                              size="sm"
                              disabled={!isDirty(user) || actionLoading === user.userId}
                              onClick={() => handleSaveRole(user)}
                              className={`h-8 px-3 text-xs font-semibold border-0 transition-all ${
                                isDirty(user)
                                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
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
