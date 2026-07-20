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
      setError(e.message || "Unable to load invitations");
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
      alert(err.message || "Failed to respond");
    } finally {
      setActionLoading("");
    }
  };

  const pending   = invitations.filter((i) => i.status === "Pending" || !i.status);
  const accepted  = invitations.filter((i) => i.status === "Accepted");
  const declined  = invitations.filter((i) => i.status === "Declined");
  const responded = invitations.filter((i) => i.status && i.status !== "Pending");

  return (
    <AdminLayout title="Race Invitations">

      {/* ── Page Header ── */}
      <div className="relative p-6 pb-5 border-b border-sb-border bg-sb-s1 overflow-hidden">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-6xl opacity-[0.05] select-none pointer-events-none">🏇</div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <Mail size={14} className="text-purple-400" />
              </div>
              <span className="text-[10px] font-bold text-sb-tx-3 uppercase tracking-widest">Jockey</span>
            </div>
            <h1 className="text-2xl font-black text-sb-tx leading-tight">Race Invitations</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {pending.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sb-gold-soft border border-sb-gold-bd text-sb-gold-2 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse inline-block" /> {pending.length} pending responses
                </span>
              )}
              {accepted.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-sb-emerald-soft border border-sb-emerald-bd text-sb-emerald-ink text-xs font-semibold">
                  {accepted.length} accepted
                </span>
              )}
              {declined.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-xs font-semibold">
                  {declined.length} declined
                </span>
              )}
            </div>
          </div>
          <button onClick={fetchInvitations}
            className="flex items-center gap-2 px-3 py-2 bg-sb-s1 border border-sb-border rounded-xl text-sb-tx-3 hover:text-sb-info hover:border-blue-300 hover:bg-sb-info/10 text-sm transition-all shrink-0">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ── Mini stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Pending Response", count: pending.length,  icon: Clock,        bg: "bg-sb-gold-soft", border: "border-sb-gold-bd", cls: "text-sb-gold-2" },
            { label: "Accepted", count: accepted.length, icon: CheckCircle2, bg: "bg-sb-emerald-soft",  border: "border-sb-emerald-bd",  cls: "text-sb-emerald-ink" },
            { label: "Declined",   count: declined.length, icon: XCircle,      bg: "bg-sb-lose/10",    border: "border-sb-lose/30",    cls: "text-sb-lose"   },
          ].map(({ label, count, icon: Icon, bg, border, cls }) => (
            <div key={label} className="flex items-center gap-3 p-4 rounded-xl border border-sb-border bg-sb-s1 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg} border ${border}`}>
                <Icon size={16} className={cls} />
              </div>
              <div>
                <p className={`text-2xl font-black leading-none ${cls}`}>{count}</p>
                <p className="text-sb-tx-3 text-xs mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-sb-lose/10 border border-sb-lose/30 rounded-xl text-sb-lose text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-sb-s2 animate-pulse rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
        ) : (
          <>
            {/* ── Pending invitations ── */}
            {pending.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-yellow-500" />
                  <h2 className="text-sb-tx-2 font-bold text-sm uppercase tracking-wider">Pending Response</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sb-gold-soft text-sb-gold-2 border border-sb-gold-bd font-bold">{pending.length}</span>
                </div>

                {pending.map((inv, idx) => {
                  const invId = inv.invitationId || inv.id;
                  const busy = actionLoading.startsWith(String(invId));
                  const initials = (inv.ownerName || inv.ownerId || "?")[0].toUpperCase();

                  return (
                    <div
                      key={invId}
                      className="relative bg-sb-s1 border border-sb-gold-bd border-l-4 border-l-yellow-400 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow animate-fade-in-up"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      <div className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          {/* Owner avatar */}
                          <div className="w-12 h-12 rounded-xl bg-sb-gold-soft border border-sb-gold-bd flex items-center justify-center shrink-0">
                            <span className="text-sb-gold-2 font-black text-lg">{initials}</span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="text-sb-tx font-bold">
                                  <span className="text-sb-gold-2">{inv.raceName || `Races #${inv.raceId}`}</span>
                                </p>
                                <p className="text-sb-tx-3 text-xs mt-0.5">Horse Owner: {inv.ownerName || inv.ownerId}</p>
                              </div>
                              <span className="text-[10px] px-2 py-1 rounded-full bg-sb-gold-soft text-sb-gold-2 border border-sb-gold-bd font-bold shrink-0">
                                Pending Response
                              </span>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap mb-4">
                              {inv.horseName && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-sb-s2 border border-sb-border text-sb-tx-2 text-xs font-medium">🐴 {inv.horseName}</span>
                              )}
                              {inv.raceDate && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sb-s2 border border-sb-border text-sb-tx-2 text-xs font-medium">
                                  <Flag size={9} /> {new Date(inv.raceDate).toLocaleDateString("vi-VN")}
                                </span>
                              )}
                            </div>

                            {inv.note && (
                              <p className="text-sb-tx-3 text-xs italic mb-4 px-3 py-2 bg-sb-s2 rounded-lg border border-sb-border">
                                "{inv.note}"
                              </p>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRespond(invId, "Accepted")}
                                disabled={busy}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sb-emerald-soft border border-green-300 text-sb-emerald-ink hover:bg-sb-emerald-soft hover:border-green-400 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                              >
                                {actionLoading === invId + "_Accepted"
                                  ? <Loader2 size={15} className="animate-spin" />
                                  : <CheckCircle2 size={15} />
                                }
                                Accept Race
                              </button>
                              <button
                                onClick={() => handleRespond(invId, "Declined")}
                                disabled={busy}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sb-lose/10 border border-sb-lose/30 text-sb-lose hover:bg-sb-lose/20 hover:border-red-300 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                              >
                                {actionLoading === invId + "_Declined"
                                  ? <Loader2 size={15} className="animate-spin" />
                                  : <XCircle size={15} />
                                }
                                Rejected
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
                  <CheckCircle2 size={14} className="text-sb-tx-3" />
                  <h2 className="text-sb-tx-3 font-bold text-sm uppercase tracking-wider">Responded</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sb-s2 border border-sb-border text-sb-tx-3 font-bold">{responded.length}</span>
                </div>

                {responded.map((inv, idx) => {
                  const invId = inv.invitationId || inv.id;
                  const isAccepted = inv.status === "Accepted";

                  return (
                    <div
                      key={invId}
                      className={`flex items-center gap-4 p-4 rounded-xl border bg-sb-s1 shadow-sm animate-fade-in-up ${
                        isAccepted ? "border-green-100" : "border-sb-border"
                      }`}
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isAccepted
                          ? "bg-sb-emerald-soft border-sb-emerald-bd text-sb-emerald-ink"
                          : "bg-sb-lose/10 border-sb-lose/30 text-sb-lose"
                      }`}>
                        {isAccepted ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sb-tx text-sm font-semibold truncate">{inv.raceName || `Races #${inv.raceId}`}</p>
                        <p className="text-sb-tx-3 text-xs">
                          {inv.horseName && `🐴 ${inv.horseName}`}
                          {inv.ownerName && ` • ${inv.ownerName}`}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold shrink-0 ${
                        isAccepted
                          ? "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd"
                          : "bg-sb-lose/10 text-sb-lose border-sb-lose/30"
                      }`}>
                        {isAccepted ? "Accepted" : "Declined"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Empty state ── */}
            {invitations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-100 flex items-center justify-center mb-4">
                  <Mail size={32} className="text-purple-300" />
                </div>
                <p className="text-sb-tx-2 font-semibold mb-1">No invitations yet</p>
                <p className="text-sb-tx-3 text-sm">Horse owners will send race invitations to you here</p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
