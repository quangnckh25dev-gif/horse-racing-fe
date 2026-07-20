import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award, AlertCircle, Loader2, CheckCircle2, XCircle,
  Globe, Eye, RefreshCw, X, Trophy, Clock, Flag,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { confirmBox } from "../../lib/toast";
import { organizerService } from "../../services/organizer";
import { raceResultService } from "../../services/raceResult";

// Status duyệt của cả race suy từ approvalStatus các kết quả (Published > Rejected > Approved > Pending)
function deriveResultStatus(results) {
  if (!results || results.length === 0) return "NoResults";
  const st = results.map((r) => r.approvalStatus || "Pending");
  if (st.some((s) => s === "Published")) return "Published";
  if (st.some((s) => s === "Rejected")) return "Rejected";
  if (st.every((s) => s === "Approved")) return "Approved";
  return "Pending";
}

const RESULT_STATUS_CONFIG = {
  Pending:   {
    label: "Pending",  color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 badge-glow-yellow",
    borderCls: "border-l-gold-glow",  icon: Clock,        iconCls: "text-yellow-400 bg-yellow-500/10",
  },
  Approved:  {
    label: "Approved",   color: "bg-blue-500/20 text-blue-300 border-blue-500/40 badge-glow-blue",
    borderCls: "border-l-blue-glow",  icon: CheckCircle2, iconCls: "text-blue-400 bg-blue-500/10",
  },
  Rejected:  {
    label: "Rejected",    color: "bg-red-500/20 text-red-300 border-red-500/40",
    borderCls: "border-l-red-glow",   icon: XCircle,      iconCls: "text-red-400 bg-red-500/10",
  },
  Published: {
    label: "Published", color: "bg-green-500/20 text-green-300 border-green-500/40 badge-glow-green",
    borderCls: "border-l-green-glow", icon: Globe,        iconCls: "text-green-400 bg-green-500/10",
  },
  NoResults: {
    label: "Awaiting Results", color: "bg-sb-s2 text-sb-tx-3 border-sb-border",
    borderCls: "", icon: Clock, iconCls: "text-sb-tx-3 bg-sb-s2",
  },
};

const inputCls = "w-full bg-[#070B14] border border-sb-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.08)] transition-all resize-none";

function Modal({ title, accentColor = "#D4AF37", onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
      <div className="bg-[#0d1117] border border-sb-border rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
        <div className="h-0.5 w-full rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
        <div className="flex items-center justify-between px-6 py-4 border-b border-sb-border">
          <h3 className="text-white font-bold">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-sb-tx-3 hover:text-sb-tx hover:bg-sb-s1/5 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function OrganizerResultsPage() {
  const navigate = useNavigate();
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [showReject, setShowReject] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchRaces = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await organizerService.getRaces();
      const finished = (res.data || []).filter((r) => r.status === "Finished");
      // /races không trả trạng thái duyệt → lấy kết quả từng race để biết approved/công bố chưa
      const withStatus = await Promise.all(finished.map(async (r) => {
        try {
          const rr = await raceResultService.getResults(r.raceId);
          const results = rr.data || [];
          return { ...r, resultStatus: deriveResultStatus(results), hasResults: results.length > 0 };
        } catch {
          return { ...r, resultStatus: "NoResults", hasResults: false };
        }
      }));
      setRaces(withStatus);
    } catch (e) {
      setError(e.message || "Unable to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRaces(); }, [fetchRaces]);

  const handleApprove = async (raceId) => {
    setActionLoading(raceId + "_approve");
    try {
      await organizerService.approveResults(raceId);
      fetchRaces();
    } catch (err) {
      alert(err.message || "Approval failed");
    } finally {
      setActionLoading("");
    }
  };

  const handleReject = async () => {
    if (!showReject) return;
    setActionLoading(showReject.raceId + "_reject");
    try {
      await organizerService.rejectResults(showReject.raceId, rejectReason);
      setShowReject(null);
      setRejectReason("");
      fetchRaces();
    } catch (err) {
      alert(err.message || "Rejection failed");
    } finally {
      setActionLoading("");
    }
  };

  const handlePublish = async (raceId) => {
    if (!(await confirmBox("Confirm publishing this race result publicly?", { okText: "Publish" }))) return;
    setActionLoading(raceId + "_publish");
    try {
      await organizerService.publishResults(raceId);
      fetchRaces();
    } catch (err) {
      alert(err.message || "Publish failed");
    } finally {
      setActionLoading("");
    }
  };

  const pendingCount   = races.filter((r) => (r.resultStatus || "Pending") === "Pending").length;
  const approvedCount  = races.filter((r) => r.resultStatus === "Approved").length;
  const publishedCount = races.filter((r) => r.resultStatus === "Published").length;

  return (
    <AdminLayout title="Approve Results">

      {/* ── Page Header Banner ── */}
      <div className="page-header">
        <div className="absolute right-0 top-0 w-72 h-full bg-gradient-to-l from-[#D4AF37]/[0.05] to-transparent pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                <Award size={14} className="text-[#D4AF37]" />
              </div>
              <span className="text-[10px] font-bold text-sb-tx-3 uppercase tracking-widest">Organizer Lead</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Approve Race Results</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="stat-pill"><span className="text-white font-bold">{races.length}</span> finished races</span>
              {pendingCount > 0 && (
                <span className="stat-pill text-yellow-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot inline-block" /> {pendingCount} pending approval
                </span>
              )}
              {approvedCount > 0 && <span className="stat-pill text-blue-400">{approvedCount} approved</span>}
              {publishedCount > 0 && <span className="stat-pill text-green-400">{publishedCount} published</span>}
            </div>
          </div>
          <button onClick={fetchRaces}
            className="flex items-center gap-2 px-3 py-2 bg-sb-s2 border border-sb-border rounded-xl text-sb-tx-3 hover:text-sb-tx text-sm transition-all shrink-0">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* ── Mini stat strip ── */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Pending",  count: pendingCount,   icon: Clock,        cls: "text-yellow-400 neon-gold", bg: "bg-yellow-500/5", border: "border-yellow-500/15" },
              { label: "Approved",   count: approvedCount,  icon: CheckCircle2, cls: "text-blue-400 neon-blue",   bg: "bg-blue-500/5",   border: "border-blue-500/15" },
              { label: "Published", count: publishedCount, icon: Globe,        cls: "text-green-400 neon-green", bg: "bg-green-500/5",  border: "border-green-500/15" },
              { label: "Rejected",    count: races.filter(r => r.resultStatus === "Rejected").length, icon: XCircle, cls: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/15" },
            ].map(({ label, count, icon: Icon, cls, bg, border }) => (
              <div key={label} className={`flex items-center gap-3 p-3.5 rounded-xl border ${bg} ${border} card-hover`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg} border ${border}`}>
                  <Icon size={14} className={cls} />
                </div>
                <div>
                  <p className={`text-2xl font-black leading-none ${cls}`}>{count}</p>
                  <p className="text-sb-tx-2 text-[10px] mt-0.5 uppercase tracking-wider">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-300 text-sm">
            <AlertCircle size={15} className="shrink-0" /> {error}
          </div>
        )}

        {/* ── Race result list ── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 shimmer rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
        ) : races.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/10 flex items-center justify-center mb-4 animate-float">
              <Trophy size={24} className="text-[#D4AF37]/30" />
            </div>
            <p className="text-white font-semibold mb-1">No races need result approval</p>
            <p className="text-sb-tx-3 text-sm">Finished races will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {races.map((race, idx) => {
              const resultStatus = race.resultStatus || "Pending";
              const cfg = RESULT_STATUS_CONFIG[resultStatus] || RESULT_STATUS_CONFIG.Pending;
              const StatusIcon = cfg.icon;
              const busy = actionLoading.startsWith(race.raceId);
              const isPending  = resultStatus === "Pending" && race.hasResults;
              const isApproved = resultStatus === "Approved";

              return (
                <div
                  key={race.raceId}
                  className={`group relative bg-[#0d1117] border border-sb-border rounded-xl overflow-hidden card-hover ${cfg.borderCls} animate-fade-in-up`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Status icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.06] ${cfg.iconCls}`}>
                      <StatusIcon size={17} />
                    </div>

                    {/* Race info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                        <h3 className="text-white font-bold text-base leading-tight">{race.raceName}</h3>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {race.startTime && (
                          <span className="flex items-center gap-1 text-sb-tx-3 text-xs">
                            <Flag size={10} /> {new Date(race.startTime).toLocaleDateString("vi-VN")}
                          </span>
                        )}
                        {race.distance && <span className="stat-pill">📏 {race.distance}m</span>}
                        {race.prizePool && (
                          <span className="text-xs font-bold text-[#D4AF37] neon-gold">
                            💰 {Number(race.prizePool).toLocaleString("vi-VN")} VND
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button onClick={() => navigate(`/organizer/races/${race.raceId}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-sb-s1/[0.03] border border-sb-border text-sb-tx-3 hover:text-sb-tx hover:border-gray-600 rounded-xl text-xs transition-all">
                        <Eye size={12} /> Details
                      </button>

                      {isPending && (
                        <>
                          <button onClick={() => handleApprove(race.raceId)} disabled={busy}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-600/15 border border-green-600/30 text-green-300 hover:bg-green-600/25 rounded-xl text-xs font-bold transition-all disabled:opacity-50">
                            {actionLoading === race.raceId + "_approve" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            Approve Results
                          </button>
                          <button onClick={() => { setShowReject(race); setRejectReason(""); }} disabled={busy}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-600/10 border border-red-600/20 text-red-400 hover:bg-red-600/20 rounded-xl text-xs font-medium transition-all disabled:opacity-50">
                            <XCircle size={12} /> Rejected
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <button onClick={() => handlePublish(race.raceId)} disabled={busy}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] rounded-xl text-xs font-bold transition-all disabled:opacity-50 btn-gold-glow">
                          {actionLoading === race.raceId + "_publish" ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
                          Publish Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Reject Modal ── */}
      {showReject && (
        <Modal title={`Reject Result: ${showReject.raceName}`} accentColor="rgb(239,68,68)" onClose={() => setShowReject(null)}>
          <p className="text-sb-tx-3 text-sm mb-3">Please enter the rejection reason so the referee knows what to fix:</p>
          <textarea
            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            placeholder="VD: Missing finish time for horse number 3..." rows={4}
            className={inputCls + " mb-4"}
          />
          <div className="flex gap-3">
            <button onClick={() => setShowReject(null)}
              className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm transition-colors">
              Cancel
            </button>
            <button onClick={handleReject} disabled={!!actionLoading}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
              {actionLoading.includes("_reject") && <Loader2 size={14} className="animate-spin" />}
              Confirm Rejection
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
