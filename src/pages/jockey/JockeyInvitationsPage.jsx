import { useState, useEffect, useCallback } from "react";
import {
  Mail, AlertCircle, Loader2, RefreshCw,
  Clock, CheckCircle2, XCircle, Flag,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { invitationService } from "../../services/invitation";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "Pending", label: "Pending" },
  { key: "Accepted", label: "Accepted" },
  { key: "Declined", label: "Declined" },
];

const STATUS_STYLE = {
  Pending: "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd",
  Accepted: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd",
  Declined: "bg-sb-lose/10 text-sb-lose border-sb-lose/30",
};

const normalizeStatus = (value) => value || "Pending";
const moneyFmt = (value) => Number(value || 0).toLocaleString("vi-VN");

export default function JockeyInvitationsPage() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Pending");
  const [actionLoading, setActionLoading] = useState("");
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    setError("");
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

  const counts = {
    all: invitations.length,
    Pending: invitations.filter((i) => normalizeStatus(i.status) === "Pending").length,
    Accepted: invitations.filter((i) => i.status === "Accepted").length,
    Declined: invitations.filter((i) => i.status === "Declined").length,
  };

  const filteredInvitations = invitations.filter((inv) =>
    filter === "all" || normalizeStatus(inv.status) === filter
  );

  const handleAccept = async (invId) => {
    setActionLoading(`${invId}_Accepted`);
    try {
      await invitationService.respondToInvitation(invId, { status: "Accepted" });
      fetchInvitations();
    } catch (err) {
      alert(err.message || "Failed to accept invitation");
    } finally {
      setActionLoading("");
    }
  };

  const openReject = (inv) => {
    setRejecting(inv);
    setRejectReason("");
    setRejectError("");
  };

  const handleReject = async (e) => {
    e.preventDefault();
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError("Reject reason is required.");
      return;
    }
    const invId = rejecting.invitationId || rejecting.id;
    setActionLoading(`${invId}_Declined`);
    setRejectError("");
    try {
      await invitationService.respondToInvitation(invId, { status: "Declined", reason });
      setRejecting(null);
      fetchInvitations();
    } catch (err) {
      setRejectError(err.message || "Failed to reject invitation");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <AdminLayout title="Race Invitations">
      <div className="relative p-6 pb-5 border-b border-sb-border bg-sb-s1 overflow-hidden">
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
              <span className="stat-pill">{counts.Pending} pending</span>
              <span className="stat-pill text-green-400">{counts.Accepted} accepted</span>
              <span className="stat-pill text-red-300">{counts.Declined} declined</span>
            </div>
          </div>
          <button onClick={fetchInvitations}
            className="flex items-center gap-2 px-3 py-2 bg-sb-s1 border border-sb-border rounded-xl text-sb-tx-3 hover:text-sb-info hover:border-blue-300 hover:bg-sb-info/10 text-sm transition-all shrink-0">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((item) => (
            <button key={item.key} onClick={() => setFilter(item.key)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                filter === item.key
                  ? "bg-[#D4AF37] text-[#0A0E1A] border-[#D4AF37]"
                  : "bg-sb-s2 text-sb-tx-3 border-sb-border hover:text-sb-tx"
              }`}>
              {item.label} <span className="opacity-70">({counts[item.key] || 0})</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-sb-lose/10 border border-sb-lose/30 rounded-xl text-sb-lose text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-sb-s2 animate-pulse rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
              <Mail size={32} className="text-purple-300" />
            </div>
            <p className="text-sb-tx-2 font-semibold mb-1">No {FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} invitations</p>
            <p className="text-sb-tx-3 text-sm">Invitations matching this filter will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInvitations.map((inv, idx) => {
              const invId = inv.invitationId || inv.id;
              const status = normalizeStatus(inv.status);
              const pending = status === "Pending";
              const busy = actionLoading.startsWith(String(invId));

              return (
                <div key={invId}
                  className={`relative bg-sb-s1 border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow animate-fade-in-up ${
                    pending ? "border-sb-gold-bd border-l-4 border-l-yellow-400" : "border-sb-border"
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sb-tx font-bold text-base">{inv.raceName || `Race #${inv.raceId}`}</p>
                        <p className="text-sb-tx-3 text-xs mt-1">Owner: {inv.ownerName || inv.ownerId || "Unknown owner"}</p>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${STATUS_STYLE[status] || STATUS_STYLE.Pending}`}>
                        {status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="rounded-xl bg-sb-s2 border border-sb-border p-3">
                        <p className="text-sb-tx-3 text-[10px] uppercase font-bold">Horse</p>
                        <p className="text-sb-tx text-sm font-semibold">{inv.horseName || `Horse #${inv.horseId || "-"}`}</p>
                      </div>
                      <div className="rounded-xl bg-sb-s2 border border-sb-border p-3">
                        <p className="text-sb-tx-3 text-[10px] uppercase font-bold">Race</p>
                        <p className="text-sb-tx text-sm font-semibold">{inv.raceName || `Race #${inv.raceId || "-"}`}</p>
                      </div>
                      <div className="rounded-xl bg-sb-gold-soft border border-sb-gold-bd p-3">
                        <p className="text-sb-tx-3 text-[10px] uppercase font-bold">Deal</p>
                        <p className="text-sb-gold-2 text-sm font-black tabular-nums">{moneyFmt(inv.dealAmount)} VND</p>
                      </div>
                    </div>

                    {(inv.message || inv.note) && (
                      <p className="text-sb-tx-3 text-xs italic px-3 py-2 bg-sb-s2 rounded-lg border border-sb-border">
                        "{inv.message || inv.note}"
                      </p>
                    )}
                    {inv.responseReason && (
                      <p className="text-red-300 text-xs">Reason: {inv.responseReason}</p>
                    )}

                    {pending ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleAccept(invId)} disabled={busy}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sb-emerald-soft border border-green-300 text-sb-emerald-ink hover:border-green-400 rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                          {actionLoading === `${invId}_Accepted` ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                          Accept Deal
                        </button>
                        <button onClick={() => openReject(inv)} disabled={busy}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sb-lose/10 border border-sb-lose/30 text-sb-lose hover:bg-sb-lose/20 rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                          <XCircle size={15} /> Reject
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sb-tx-3 text-xs">
                        {status === "Accepted" ? <CheckCircle2 size={14} className="text-sb-emerald-ink" /> : <XCircle size={14} className="text-sb-lose" />}
                        Responded
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleReject} className="bg-sb-s1 border border-sb-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-sb-border">
              <h3 className="text-sb-tx font-bold">Reject Deal</h3>
              <button type="button" onClick={() => setRejecting(null)} className="text-sb-tx-3 hover:text-sb-tx">
                <XCircle size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {rejectError && (
                <div className="flex items-center gap-2 p-3 bg-sb-lose/10 border border-sb-lose/30 rounded-xl text-sb-lose text-sm">
                  <AlertCircle size={13} /> {rejectError}
                </div>
              )}
              <div>
                <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-widest mb-2">
                  Reason
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Tell the owner why you declined this deal..."
                  className="w-full rounded-xl bg-sb-s1 border border-sb-border text-sb-tx text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-sb-emerald placeholder:text-sb-tx-3 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setRejecting(null)}
                  className="flex-1 h-10 rounded-xl bg-sb-s1 border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={Boolean(actionLoading)}
                  className="flex-1 h-10 rounded-xl bg-sb-lose/10 border border-sb-lose/30 text-sb-lose hover:bg-sb-lose/20 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Reject
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
