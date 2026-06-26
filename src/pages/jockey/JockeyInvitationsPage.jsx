import { useState, useEffect, useCallback } from "react";
import {
  Mail, AlertCircle, Loader2, RefreshCw,
  Clock, CheckCircle2, XCircle, Flag,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { invitationService } from "../../services/invitation";

export default function JockeyInvitationsPage() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const fetchInvitations = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await invitationService.getReceivedInvitations();
      setInvitations(res.data || []);
    } catch (e) {
      setError(e.message || "Không thể tải lời mời");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvitations(); }, [fetchInvitations]);

  const handleRespond = async (invId, response) => {
    setActionLoading(invId + "_" + response);
    try {
      await invitationService.respondToInvitation(invId, response);
      fetchInvitations();
    } catch (err) {
      alert(err.message || "Phản hồi thất bại");
    } finally {
      setActionLoading("");
    }
  };

  const pending   = invitations.filter((i) => i.status === "Pending" || !i.status);
  const accepted  = invitations.filter((i) => i.status === "Accepted");
  const declined  = invitations.filter((i) => i.status === "Declined");
  const responded = invitations.filter((i) => i.status && i.status !== "Pending");

  return (
    <AdminLayout title="Lời mời thi đấu">

      {/* ── Page Header ── */}
      <div className="relative p-6 pb-5 border-b border-gray-100 bg-white overflow-hidden">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-6xl opacity-[0.05] select-none pointer-events-none">🏇</div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center">
                <Mail size={14} className="text-purple-600" />
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nài ngựa</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">Lời mời thi đấu</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {pending.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse inline-block" /> {pending.length} chờ phản hồi
                </span>
              )}
              {accepted.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                  {accepted.length} đã chấp nhận
                </span>
              )}
              {declined.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                  {declined.length} đã từ chối
                </span>
              )}
            </div>
          </div>
          <button onClick={fetchInvitations}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 text-sm transition-all shrink-0">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ── Mini stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Chờ phản hồi", count: pending.length,  icon: Clock,        bg: "bg-yellow-50", border: "border-yellow-200", cls: "text-yellow-600" },
            { label: "Đã chấp nhận", count: accepted.length, icon: CheckCircle2, bg: "bg-green-50",  border: "border-green-200",  cls: "text-green-600" },
            { label: "Đã từ chối",   count: declined.length, icon: XCircle,      bg: "bg-red-50",    border: "border-red-200",    cls: "text-red-600"   },
          ].map(({ label, count, icon: Icon, bg, border, cls }) => (
            <div key={label} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg} border ${border}`}>
                <Icon size={16} className={cls} />
              </div>
              <div>
                <p className={`text-2xl font-black leading-none ${cls}`}>{count}</p>
                <p className="text-gray-500 text-xs mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
        ) : (
          <>
            {/* ── Pending invitations ── */}
            {pending.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-yellow-500" />
                  <h2 className="text-gray-700 font-bold text-sm uppercase tracking-wider">Chờ phản hồi</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 font-bold">{pending.length}</span>
                </div>

                {pending.map((inv, idx) => {
                  const invId = inv.invitationId || inv.id;
                  const busy = actionLoading.startsWith(String(invId));
                  const initials = (inv.ownerName || inv.ownerId || "?")[0].toUpperCase();

                  return (
                    <div
                      key={invId}
                      className="relative bg-white border border-yellow-200 border-l-4 border-l-yellow-400 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow animate-fade-in-up"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      <div className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          {/* Owner avatar */}
                          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                            <span className="text-amber-600 font-black text-lg">{initials}</span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="text-gray-900 font-bold">
                                  <span className="text-amber-600">{inv.raceName || `Vòng đua #${inv.raceId}`}</span>
                                </p>
                                <p className="text-gray-500 text-xs mt-0.5">Chủ ngựa: {inv.ownerName || inv.ownerId}</p>
                              </div>
                              <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 font-bold shrink-0">
                                Chờ phản hồi
                              </span>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap mb-4">
                              {inv.horseName && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium">🐴 {inv.horseName}</span>
                              )}
                              {inv.raceDate && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium">
                                  <Flag size={9} /> {new Date(inv.raceDate).toLocaleDateString("vi-VN")}
                                </span>
                              )}
                            </div>

                            {inv.note && (
                              <p className="text-gray-500 text-xs italic mb-4 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                                "{inv.note}"
                              </p>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRespond(invId, "Accepted")}
                                disabled={busy}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 border border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                              >
                                {actionLoading === invId + "_Accepted"
                                  ? <Loader2 size={15} className="animate-spin" />
                                  : <CheckCircle2 size={15} />
                                }
                                Chấp nhận thi đấu
                              </button>
                              <button
                                onClick={() => handleRespond(invId, "Declined")}
                                disabled={busy}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                              >
                                {actionLoading === invId + "_Declined"
                                  ? <Loader2 size={15} className="animate-spin" />
                                  : <XCircle size={15} />
                                }
                                Từ chối
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Responded invitations ── */}
            {responded.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-gray-400" />
                  <h2 className="text-gray-500 font-bold text-sm uppercase tracking-wider">Đã phản hồi</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-500 font-bold">{responded.length}</span>
                </div>

                {responded.map((inv, idx) => {
                  const invId = inv.invitationId || inv.id;
                  const isAccepted = inv.status === "Accepted";

                  return (
                    <div
                      key={invId}
                      className={`flex items-center gap-4 p-4 rounded-xl border bg-white shadow-sm animate-fade-in-up ${
                        isAccepted ? "border-green-100" : "border-gray-100"
                      }`}
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isAccepted
                          ? "bg-green-50 border-green-200 text-green-600"
                          : "bg-red-50 border-red-200 text-red-600"
                      }`}>
                        {isAccepted ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 text-sm font-semibold truncate">{inv.raceName || `Vòng đua #${inv.raceId}`}</p>
                        <p className="text-gray-500 text-xs">
                          {inv.horseName && `🐴 ${inv.horseName}`}
                          {inv.ownerName && ` • ${inv.ownerName}`}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold shrink-0 ${
                        isAccepted
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-600 border-red-200"
                      }`}>
                        {isAccepted ? "Đã chấp nhận" : "Đã từ chối"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Empty state ── */}
            {invitations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-4">
                  <Mail size={32} className="text-purple-300" />
                </div>
                <p className="text-gray-700 font-semibold mb-1">Chưa có lời mời nào</p>
                <p className="text-gray-500 text-sm">Các chủ ngựa sẽ gửi lời mời thi đấu cho bạn tại đây</p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
