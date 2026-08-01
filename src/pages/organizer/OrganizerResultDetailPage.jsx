import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  Flag,
  Globe,
  Loader2,
  RefreshCw,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { confirmBox } from "../../lib/toast";
import { organizerService } from "../../services/organizer";
import { raceResultService } from "../../services/raceResult";

const inputCls = "w-full rounded-xl border border-sb-border bg-[#070B14] px-3 py-2.5 text-sm text-white transition-all resize-none focus:border-[#D4AF37]/60 focus:outline-none focus:shadow-[0_0_0_3px_rgba(212,175,55,0.08)]";

const STATUS_CONFIG = {
  Pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", icon: Clock },
  Approved: { label: "Approved", color: "bg-blue-500/20 text-blue-300 border-blue-500/40", icon: CheckCircle2 },
  Published: { label: "Published", color: "bg-green-500/20 text-green-300 border-green-500/40", icon: Globe },
  Rejected: { label: "Rejected", color: "bg-red-500/20 text-red-300 border-red-500/40", icon: XCircle },
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-sb-border bg-[#111827] shadow-2xl">
        <div className="flex items-center justify-between border-b border-sb-border px-6 py-4">
          <h3 className="font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-sb-tx-3 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function deriveResultStatus(results) {
  if (!results || results.length === 0) return "Pending";
  const statuses = results.map((item) => item.approvalStatus || "Pending");
  if (statuses.some((status) => status === "Published")) return "Published";
  if (statuses.some((status) => status === "Rejected")) return "Rejected";
  if (statuses.every((status) => status === "Approved")) return "Approved";
  return "Pending";
}

function formatTime(value) {
  if (value === null || value === undefined || value === "") return "-";
  return `${Number(value).toFixed(2)}s`;
}

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} VND`;
}

function isRedFlagResult(result) {
  const status = String(result.status || result.resultStatus || result.registrationStatus || "").toLowerCase();
  return result.dq || result.dnf || status.includes("eliminated") || status.includes("pre") || status.includes("reject");
}

export default function OrganizerResultDetailPage() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const [race, setRace] = useState(null);
  const [results, setResults] = useState([]);
  const [violations, setViolations] = useState([]);
  const [minutes, setMinutes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [raceResponse, resultResponse, violationResponse, minutesResponse] = await Promise.all([
        organizerService.getRaceById(raceId),
        raceResultService.getResults(raceId),
        raceResultService.getViolations(raceId).catch(() => ({ data: [] })),
        raceResultService.getMinutes(raceId).catch(() => ({ data: null })),
      ]);
      setRace(raceResponse.data);
      setResults(resultResponse.data || []);
      setViolations(violationResponse.data || []);
      setMinutes(minutesResponse.data || null);
    } catch (err) {
      setError(err.message || "Unable to load result detail.");
    } finally {
      setLoading(false);
    }
  }, [raceId]);

  useEffect(() => {
    load();
  }, [load]);

  const status = deriveResultStatus(results);
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  const StatusIcon = statusConfig.icon;
  const sortedResults = useMemo(
    () => [...results].sort((a, b) => {
      const aFlag = isRedFlagResult(a) ? 1 : 0;
      const bFlag = isRedFlagResult(b) ? 1 : 0;
      if (aFlag !== bFlag) return aFlag - bFlag;
      return Number(a.finishPosition || 9999) - Number(b.finishPosition || 9999);
    }),
    [results]
  );

  const handleApprove = async () => {
    setBusy("approve");
    try {
      await organizerService.approveResults(raceId);
      await load();
    } catch (err) {
      alert(err.message || "Approval failed.");
    } finally {
      setBusy("");
    }
  };

  const handleReject = async () => {
    const reason = rejectReason.trim();
    if (!reason) {
      alert("Reject reason is required.");
      return;
    }
    setBusy("reject");
    try {
      await organizerService.rejectResults(raceId, reason);
      setRejectOpen(false);
      setRejectReason("");
      await load();
    } catch (err) {
      alert(err.message || "Rejection failed.");
    } finally {
      setBusy("");
    }
  };

  const handlePublish = async () => {
    if (status !== "Approved") return;
    if (!(await confirmBox("Publish approved race results?", { okText: "Publish" }))) return;
    setBusy("publish");
    try {
      await organizerService.publishResults(raceId);
      await load();
    } catch (err) {
      alert(err.message || "Publish failed.");
    } finally {
      setBusy("");
    }
  };

  return (
    <AdminLayout title="Result Detail">
      <div className="page-header">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => navigate("/organizer/results")}
              className="mb-4 flex items-center gap-2 text-sm text-sb-tx-3 transition-colors hover:text-white"
            >
              <ArrowLeft size={16} />
              Back to Result Reviews
            </button>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/10">
                <Award size={14} className="text-[#D4AF37]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-sb-tx-3">Organizer Approval</span>
            </div>
            <h1 className="text-2xl font-black leading-tight text-white">{race?.raceName || "Race Result"}</h1>
          </div>
          <button
            onClick={load}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-sb-border bg-sb-s2 px-3 py-2 text-sm text-sb-tx-3 transition-all hover:text-sb-tx"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-[#D4AF37]" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-sb-border bg-[#0d1117] p-5">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${statusConfig.color}`}>
                    <StatusIcon size={13} />
                    {statusConfig.label}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-sb-tx-3">
                    <Flag size={12} />
                    {formatDate(race?.startTime)}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-sb-tx-3">Race status</p>
                    <p className="font-semibold text-white">{race?.status || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-sb-tx-3">Result entries</p>
                    <p className="font-semibold text-white">{results.length}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-sb-tx-3">Violations</p>
                    <p className="font-semibold text-white">{violations.length}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-sb-border bg-[#0d1117] p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-sb-tx-3">Race Minutes</p>
                {minutes ? (
                  <div className="space-y-2 text-sm">
                    <p className="text-white">{minutes.weatherCondition || "No weather condition"}</p>
                    {minutes.minutesFileUrl && (
                      <a className="break-all text-[#D4AF37] hover:underline" href={minutes.minutesFileUrl} target="_blank" rel="noreferrer">
                        {minutes.minutesFileUrl}
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-sb-tx-3">No race minutes submitted yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-sb-border bg-[#0d1117]">
              <div className="flex items-center justify-between border-b border-sb-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-[#D4AF37]" />
                  <h2 className="font-bold text-white">Final Ranking</h2>
                </div>
              </div>

              {sortedResults.length === 0 ? (
                <div className="py-12 text-center text-sm text-sb-tx-3">No result entries have been submitted.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-[#070B14] text-xs uppercase tracking-wider text-sb-tx-3">
                      <tr>
                        <th className="px-5 py-3 text-left">Rank / Horse</th>
                        <th className="px-5 py-3 text-left">Jockey</th>
                        <th className="px-5 py-3 text-right">Finish Time</th>
                        <th className="px-5 py-3 text-right">Penalty</th>
                        <th className="px-5 py-3 text-right">Final Time</th>
                        <th className="px-5 py-3 text-right">Points</th>
                        <th className="px-5 py-3 text-right">Prize Won</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedResults.map((result) => {
                        const redFlag = isRedFlagResult(result);
                        return (
                          <tr key={result.resultId || result.entryId} className={`border-t border-sb-border ${redFlag ? "bg-red-950/20 text-red-300" : "text-sb-tx"}`}>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <span className={`flex h-8 w-8 items-center justify-center rounded-lg font-black ${redFlag ? "bg-red-500/15 text-red-300" : "bg-[#D4AF37]/15 text-[#D4AF37]"}`}>
                                  {redFlag ? "!" : result.finishPosition || "-"}
                                </span>
                                <div>
                                  <p className="font-bold">{result.horseName || `Horse #${result.horseId || result.entryId}`}</p>
                                  {redFlag && <p className="text-xs text-red-300">DQ / DNF / Eliminated</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3">{result.jockeyName || "-"}</td>
                            <td className="px-5 py-3 text-right">{formatTime(result.finishTime)}</td>
                            <td className="px-5 py-3 text-right text-red-300">{formatTime(result.penaltyTime || 0)}</td>
                            <td className="px-5 py-3 text-right font-bold">{formatTime(result.finalTime)}</td>
                            <td className="px-5 py-3 text-right">{result.points ?? "-"}</td>
                            <td className="px-5 py-3 text-right font-bold text-sb-emerald-ink">
                              {Number(result.prizeWon || 0) > 0 ? formatMoney(result.prizeWon) : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={() => setRejectOpen(true)}
                disabled={status === "Published" || !results.length || !!busy}
                className="flex items-center gap-2 rounded-xl border border-red-600/30 bg-red-600/10 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-600/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle size={15} />
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={status === "Approved" || status === "Published" || !results.length || !!busy}
                className="flex items-center gap-2 rounded-xl border border-blue-600/30 bg-blue-600/15 px-4 py-2 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-600/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "approve" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                Approve
              </button>
              <button
                onClick={handlePublish}
                disabled={status !== "Approved" || !!busy}
                title={status === "Approved" ? "Publish approved results" : "Results must be approved before publishing"}
                className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-black text-[#0A0E1A] transition-colors hover:bg-[#c49b2e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "publish" ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
                Publish
              </button>
            </div>
          </>
        )}
      </div>

      {rejectOpen && (
        <Modal title="Reject Result" onClose={() => setRejectOpen(false)}>
          <p className="mb-3 text-sm text-sb-tx-3">Enter a clear reason so the referee can fix the submitted result.</p>
          <textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            rows={4}
            placeholder="Example: Missing finish time for one horse..."
            className={`${inputCls} mb-4`}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRejectOpen(false)}
              className="flex-1 rounded-xl border border-sb-border py-2.5 text-sm text-sb-tx-3 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={busy === "reject"}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {busy === "reject" && <Loader2 size={14} className="animate-spin" />}
              Confirm Rejection
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
