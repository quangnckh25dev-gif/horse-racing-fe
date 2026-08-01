import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw, Users, Search } from "lucide-react";
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

// Spectator auto-approved -> khong bao gio nam trong danh sach cho duyet
const ROLE_FILTERS = ["All", "HorseOwner", "Jockey", "Referee", "Organizer"];

export default function UserApprovalPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const [roleFilter, setRoleFilter] = useState("All");
  const [keyword, setKeyword] = useState("");

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchPendingUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const result = await adminService.getPendingUsers(roleFilter, keyword.trim());
      setUsers(result.data || []);
    } catch (err) {
      setErrorMsg(err.message || "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, keyword]);

  // Filter role doi -> goi lai ngay; keyword thi debounce 400ms
  useEffect(() => {
    const t = setTimeout(fetchPendingUsers, 400);
    return () => clearTimeout(t);
  }, [fetchPendingUsers]);

  const handleApprove = async (userId) => {
    setActionLoading(userId + "_approve");
    try {
      await adminService.approveUser(userId, currentUser.userId);
      setUsers((prev) => prev.filter((u) => u.userId !== userId));
    } catch (err) {
      setErrorMsg(err.message || "Failed to approve account.");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    const userId = rejectTarget.userId;
    setActionLoading(userId + "_reject");
    try {
      await adminService.rejectUser(userId, currentUser.userId, rejectReason.trim());
      setUsers((prev) => prev.filter((u) => u.userId !== userId));
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      setErrorMsg(err.message || "Failed to reject account.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout title="Approve Accounts">
      <div className="p-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sb-gold-soft border border-sb-gold-bd flex items-center justify-center">
              <Users size={20} className="text-sb-gold-2" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-sb-tx">Approve Accounts</h1>
              <p className="text-sb-tx-3 text-sm">
                {users.length > 0
                  ? <span className="text-sb-gold-2 font-semibold">{users.length} accounts</span>
                  : <span className="text-sb-emerald-ink font-semibold">All handled</span>
                } pending approval
              </p>
            </div>
          </div>
          <button
            onClick={fetchPendingUsers}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-sb-border text-sb-tx-3 hover:text-sb-info hover:border-blue-300 hover:bg-sb-info/10 transition-all text-sm"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Filter + search bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sb-tx-3" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by name, username, email..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-sb-s1 border border-sb-border text-sb-tx text-sm placeholder:text-sb-tx-3 outline-none focus:border-sb-emerald focus:ring-1 focus:ring-sb-emerald/40 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ROLE_FILTERS.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 h-10 rounded-lg text-xs font-semibold border transition-all ${
                  roleFilter === r
                    ? "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd"
                    : "bg-sb-s1 text-sb-tx-3 border-sb-border hover:text-sb-tx hover:border-sb-tx-3"
                }`}
              >
                {r === "HorseOwner" ? "Owner" : r}
              </button>
            ))}
          </div>
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
            <p className="text-sb-tx font-semibold mb-1">
              {keyword || roleFilter !== "All" ? "No matching accounts" : "No accounts pending approval"}
            </p>
            <p className="text-sb-tx-3 text-sm">
              {keyword || roleFilter !== "All" ? "Try changing the filter or search" : "All accounts have been handled"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user, idx) => {
              const initials = (user.fullName || user.username || "?")[0].toUpperCase();
              const approveLoading = actionLoading === user.userId + "_approve";
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
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 live-dot" /> Pending
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
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => { setRejectTarget(user); setRejectReason(""); }}
                        className="flex items-center gap-1.5 h-9 px-4 bg-sb-lose/10 hover:bg-sb-lose/20 text-sb-lose border border-sb-lose/30 hover:border-red-300 rounded-xl text-xs font-medium transition-all"
                      >
                        <XCircle size={13} />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject reason modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setRejectTarget(null)}>
          <div className="w-full max-w-md bg-sb-s1 border border-sb-border rounded-2xl shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-lg bg-sb-lose/10 border border-sb-lose/30 flex items-center justify-center">
                <XCircle size={18} className="text-sb-lose" />
              </div>
              <h3 className="text-lg font-bold text-sb-tx">Reject account</h3>
            </div>
            <p className="text-sm text-sb-tx-3 mb-4">
              Reject <span className="font-semibold text-sb-tx">{rejectTarget.fullName || rejectTarget.username}</span>?
              You can add a reason (optional).
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejection (optional)..."
              className="w-full rounded-lg bg-sb-s2 border border-sb-border text-sb-tx text-sm p-3 placeholder:text-sb-tx-3 outline-none focus:border-sb-lose focus:ring-1 focus:ring-sb-lose/40 transition-all resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                size="sm"
                onClick={() => setRejectTarget(null)}
                className="h-9 px-4 bg-sb-s2 hover:bg-sb-s2 text-sb-tx-2 border border-sb-border rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={actionLoading !== null}
                onClick={confirmReject}
                className="h-9 px-4 bg-sb-lose/10 hover:bg-sb-lose/20 text-sb-lose border border-sb-lose/30 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                {actionLoading === rejectTarget.userId + "_reject"
                  ? <Loader2 size={13} className="animate-spin" />
                  : <XCircle size={13} />}
                Confirm reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
