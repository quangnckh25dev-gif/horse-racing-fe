import { useState, useEffect, useCallback } from "react";
import {
  Mail, AlertCircle, Loader2, RefreshCw,
  Clock, CheckCircle2, XCircle, Flag, User,
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

      {/* ── Page Header Banner ── */}
      <div className="page-header">
        <div className="absolute right-0 top-0 w-72 h-full bg-gradient-to-l from-purple-500/[0.05] to-transparent pointer-events-none" />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-6xl opacity-[0.08] select-none pointer-events-none animate-float">🏇</div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Mail size={14} className="text-purple-400" />
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nài ngựa</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Lời mời thi đấu</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {pending.length > 0 && (
                <span className="stat-pill text-yellow-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot inline-block" /> {pending.length} chờ phản hồi
                </span>
              )}
              {accepted.length > 0 && <span className="stat-pill text-green-400">{accepted.length} đã chấp nhận</span>}
              {declined.length > 0 && <span className="stat-pill text-red-400">{declined.length} đã từ chối</span>}
            </div>
          </div>
          <button onClick={fetchInvitations}
            className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-gray-700/60 rounded-xl text-gray-400 hover:text-white text-sm transition-all shrink-0">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ── Mini stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Chờ phản hồi", count: pending.length,  icon: Clock,        bg: "bg-yellow-500/10", border: "border-yellow-500/20", cls: "text-yellow-400 neon-gold" },
            { label: "Đã chấp nhận", count: accepted.length, icon: CheckCircle2, bg: "bg-green-500/10",  border: "border-green-500/20",  cls: "text-green-400 neon-green" },
            { label: "Đã từ chối",   count: declined.length, icon: XCircle,      bg: "bg-red-500/10",   border: "border-red-500/20",    cls: "text-red-400" },
          ].map(({ label, count, icon: Icon, bg, border, cls }) => (
            <div key={label} className={`flex items-center gap-3 p-4 rounded-xl border card-hover ${bg} ${border}`}>
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
          <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-300 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 shimmer rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
        ) : (
          <>
            {/* ── Pending invitations ── */}
            {pending.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-yellow-400" />
                  <h2 className="text-white font-bold text-sm uppercase tracking-wider">Chờ phản hồi</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-bold">{pending.length}</span>
                </div>

                {pending.map((inv, idx) => {
                  const invId = inv.invitationId || inv.id;
                  const busy = actionLoading.startsWith(invId);
                  const initials = (inv.ownerName || inv.ownerId || "?")[0].toUpperCase();

                  return (
                    <div
                      key={invId}
                      className="relative bg-[#0d1117] border border-yellow-500/20 rounded-xl overflow-hidden invitation-pending card-hover animate-fade-in-up border-l-gold-glow"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      <div className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          {/* Owner avatar */}
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/25 flex items-center justify-center shrink-0">
                            <span className="text-[#D4AF37] font-black text-lg">{initials}</span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="text-white font-bold">
                                  <span className="text-[#D4AF37]">{inv.raceName || `Vòng đua #${inv.raceId}`}</span>
                                </p>
                                <p className="text-gray-500 text-xs mt-0.5">Chủ ngựa: {inv.ownerName || inv.ownerId}</p>
                              </div>
                              <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/25 font-bold shrink-0">
                                Chờ phản hồi
                              </span>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap mb-4">
                              {inv.horseName && (
                                <span className="stat-pill">🐴 {inv.horseName}</span>
                              )}
                              {inv.raceDate && (
                                <span className="stat-pill">
                                  <Flag size={9} /> {new Date(inv.raceDate).toLocaleDateString("vi-VN")}
                                </span>
                              )}
                            </div>

                            {inv.note && (
                              <p className="text-gray-400 text-xs italic mb-4 px-3 py-2 bg-white/[0.02] rounded-lg border border-gray-800/40">
                                "{inv.note}"
                              </p>
                            )}

                            {/* Action buttons - full width */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRespond(invId, "Accepted")}
                                disabled={busy}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600/15 border border-green-600/30 text-green-300 hover:bg-green-600/25 hover:border-green-600/50 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                              >
                                {actionLoading === invId + "_ACCEPTED"
                                  ? <Loader2 size={15} className="animate-spin" />
                                  : <CheckCircle2 size={15} />
                                }
                                Chấp nhận thi đấu
                              </button>
                              <button
                                onClick={() => handleRespond(invId, "Declined")}
                                disabled={busy}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600/10 border border-red-600/20 text-red-400 hover:bg-red-600/20 hover:border-red-600/40 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                              >
                                {actionLoading === invId + "_DECLINED"
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
                  <CheckCircle2 size={14} className="text-gray-500" />
                  <h2 className="text-gray-500 font-bold text-sm uppercase tracking-wider">Đã phản hồi</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500 font-bold">{responded.length}</span>
                </div>

                {responded.map((inv, idx) => {
                  const invId = inv.invitationId || inv.id;
                  const isAccepted = inv.status === "Accepted";

                  return (
                    <div
                      key={invId}
                      className={`flex items-center gap-4 p-4 rounded-xl border bg-[#0d1117]/60 animate-fade-in-up ${
                        isAccepted ? "border-green-900/30" : "border-gray-800/40"
                      }`}
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isAccepted
                          ? "bg-green-500/10 border-green-500/20 text-green-400"
                          : "bg-red-500/10 border-red-500/20 text-red-400"
                      }`}>
                        {isAccepted ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-300 text-sm font-semibold truncate">{inv.raceName || `Vòng đua #${inv.raceId}`}</p>
                        <p className="text-gray-600 text-xs">
                          {inv.horseName && `🐴 ${inv.horseName}`}
                          {inv.ownerName && ` • ${inv.ownerName}`}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold shrink-0 ${
                        isAccepted
                          ? "bg-green-500/15 text-green-300 border-green-500/30"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
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
                <div className="w-20 h-20 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex items-center justify-center mb-4 animate-float">
                  <Mail size={32} className="text-purple-500/30" />
                </div>
                <p className="text-white font-semibold mb-1">Chưa có lời mời nào</p>
                <p className="text-gray-500 text-sm">Các chủ ngựa sẽ gửi lời mời thi đấu cho bạn tại đây</p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
