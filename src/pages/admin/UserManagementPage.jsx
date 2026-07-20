import { useState, useEffect } from "react";
import {
  Users, RefreshCw, Loader2, AlertCircle, CheckCircle2, Shield,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { adminService } from "../../services/admin";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/layout/AdminLayout";

// 1 role Organizer duy nhất (đã bỏ OrganizerHead/OrganizerMember)
const ROLES = ["Organizer", "HorseOwner", "Jockey", "Referee", "Spectator"];

const ROLE_STYLE = {
  Admin:      "bg-sb-lose/10 text-sb-lose border-sb-lose/30",
  Organizer:  "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd",
  HorseOwner: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  Jockey:     "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Referee:    "bg-sb-info/10 text-sb-info border-sb-info/30",
  Spectator:  "bg-sb-s2 text-sb-tx-2 border-sb-border",
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
      setErrorMsg(err.message || "Unable to load users.");
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
      setErrorMsg(`Failed to change role: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const isDirty = (user) =>
    pendingRole[user.userId] && pendingRole[user.userId] !== user.roleName;

  return (
    <AdminLayout title="User Management">
      <div className="p-6">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sb-info/10 border border-sb-info/30 flex items-center justify-center">
                <Shield size={20} className="text-sb-info" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-sb-tx">User Management</h1>
                <p className="text-sb-tx-3 text-sm">View and assign account roles in the system</p>
              </div>
            </div>
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-sb-border text-sb-tx-3 hover:text-sb-info hover:border-blue-300 hover:bg-sb-info/10 transition-all text-sm"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 flex items-center gap-3 p-3 rounded-lg bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm">
              <AlertCircle size={18} className="text-sb-lose shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={32} className="animate-spin text-sb-info" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-sb-tx-3">
              <Users size={48} className="mb-4" />
              <p className="text-lg font-medium">No users yet</p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-sb-tx-3">
                Total <span className="text-sb-info font-semibold">{users.length}</span> accounts
              </div>

              <div className="rounded-xl border border-sb-border overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="bg-sb-s2 border-b border-sb-border">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-sb-tx-3 uppercase tracking-widest">Username</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-sb-tx-3 uppercase tracking-widest">Full Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-sb-tx-3 uppercase tracking-widest">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-sb-tx-3 uppercase tracking-widest">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-sb-tx-3 uppercase tracking-widest">Current Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-sb-tx-3 uppercase tracking-widest">Change Role</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-sb-tx-3 uppercase tracking-widest">Lưu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, idx) => {
                      const isAdmin = user.roleName === "Admin";
                      return (
                      <tr
                        key={user.userId}
                        className={`border-b border-sb-border transition-colors ${isAdmin ? "bg-sb-lose/10/30" : `hover:bg-sb-info/10/40 ${idx % 2 === 0 ? "bg-sb-s1" : "bg-sb-s2/50"}`}`}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-sb-tx">{user.username}</td>
                        <td className="px-4 py-3 text-sm text-sb-tx-2">{user.fullName}</td>
                        <td className="px-4 py-3 text-sm text-sb-tx-3">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            user.isApproved
                              ? "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd"
                              : "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd"
                          }`}>
                            {user.isApproved ? "Approved" : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ROLE_STYLE[user.roleName] || ROLE_STYLE.Spectator}`}>
                            {user.roleName}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isAdmin ? (
                            <span className="text-xs text-red-400 italic font-medium">Fixed username</span>
                          ) : (
                            <select
                              value={pendingRole[user.userId] ?? user.roleName}
                              onChange={(e) => handleRoleChange(user.userId, e.target.value)}
                              className="bg-sb-s1 border border-sb-border text-sb-tx text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:border-sb-emerald focus:ring-1 focus:ring-sb-emerald/40 transition-colors"
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isAdmin ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sb-lose/10 text-sb-lose border border-sb-lose/30">Admin</span>
                          ) : successId === user.userId ? (
                            <CheckCircle2 size={20} className="text-green-500 mx-auto" />
                          ) : (
                            <Button
                              size="sm"
                              disabled={!isDirty(user) || actionLoading === user.userId}
                              onClick={() => handleSaveRole(user)}
                              className={`h-8 px-3 text-xs font-semibold border-0 transition-all ${
                                isDirty(user)
                                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                  : "bg-sb-s2 text-sb-tx-3 cursor-not-allowed"
                              }`}
                            >
                              {actionLoading === user.userId ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : "Lưu"}
                            </Button>
                          )}
                        </td>
                      </tr>
                      );
                    })}
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
