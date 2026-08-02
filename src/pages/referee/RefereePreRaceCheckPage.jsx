import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, AlertCircle, CheckCircle2, Eye, Loader2,
  ShieldCheck, XCircle, Stethoscope, ArrowRight,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { spectatorService } from "../../services/spectator";
import { raceResultService } from "../../services/raceResult";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#111827] border border-sb-border rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sb-border sticky top-0 bg-[#111827]">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-sb-tx-3 hover:text-sb-tx"><XCircle size={18} /></button>
        </div>
        <div className="p-6 overflow-y-auto min-h-0">{children}</div>
      </div>
    </div>
  );
}

function getId(value, keys) {
  for (const key of keys) {
    if (value?.[key] !== undefined && value?.[key] !== null) return value[key];
  }
  return null;
}

function normalizeStatus(status) {
  return String(status || "Pending").toLowerCase();
}

function statusBadge(status) {
  const normalized = normalizeStatus(status);
  if (normalized === "checked") return "bg-sb-emerald-soft border-sb-emerald-bd text-sb-emerald-ink";
  if (normalized === "rejected") return "bg-red-500/10 border-red-500/30 text-red-300";
  return "bg-yellow-500/10 border-yellow-500/30 text-yellow-300";
}

function isReadyEntry(entry) {
  const status = String(entry?.registrationStatus || "").toLowerCase();
  return status === "ready" && Boolean(entry?.jockeyId || entry?.jockeyName) && entry?.jockeyConfirmed !== false;
}

export default function RefereePreRaceCheckPage() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const [race, setRace] = useState(null);
  const [checks, setChecks] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyEntryId, setBusyEntryId] = useState("");
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [detail, setDetail] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [raceRes, entryRes] = await Promise.all([
        spectatorService.getRaceById(raceId),
        spectatorService.getRaceEntries(raceId),
      ]);
      const initRes = await raceResultService.initPreRaceChecks(raceId);
      setRace(raceRes.data);
      setEntries((entryRes.data || []).filter(isReadyEntry));
      setChecks(initRes.data || []);
    } catch (e) {
      setError(e.message || "Unable to load pre-race checks");
    } finally {
      setLoading(false);
    }
  }, [raceId]);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    return checks.map((check) => {
      const checkEntryId = getId(check, ["entryId", "raceEntryId"]);
      const entry = entries.find((item) => String(item.entryId) === String(checkEntryId)) || {};
      return { ...entry, ...check, entryId: checkEntryId || entry.entryId };
    }).filter((row) => row.entryId && (isReadyEntry(row) || normalizeStatus(row.status) === "rejected"));
  }, [checks, entries]);

  const processedCount = rows.filter((row) => ["checked", "rejected"].includes(normalizeStatus(row.status))).length;
  const pendingCount = rows.length - processedCount;
  const complete = rows.length > 0 && pendingCount === 0;

  const updateCheck = async (entryId, data, successMessage) => {
    setBusyEntryId(entryId);
    setError("");
    setFlash("");
    try {
      await raceResultService.updatePreRaceCheck(raceId, entryId, data);
      setFlash(successMessage);
      const res = await raceResultService.getPreRaceChecks(raceId);
      setChecks(res.data || []);
      const entryRes = await spectatorService.getRaceEntries(raceId);
      setEntries((entryRes.data || []).filter(isReadyEntry));
    } catch (e) {
      setError(e.message || "Unable to update pre-race check");
    } finally {
      setBusyEntryId("");
    }
  };

  const handleReject = async (event) => {
    event.preventDefault();
    const cleanReason = reason.trim();
    if (!cleanReason) {
      setError("Reject reason is required.");
      return;
    }
    await updateCheck(rejecting.entryId, { status: "Rejected", reason: cleanReason }, "Horse rejected from this race.");
    setRejecting(null);
    setReason("");
  };

  return (
    <AdminLayout title="Pre-Race Check">
      <div className="p-6 space-y-6">
        <button onClick={() => navigate("/referee/races")}
          className="flex items-center gap-2 text-sb-tx-3 hover:text-sb-tx transition-colors text-sm">
          <ArrowLeft size={16} /> Back to My Races
        </button>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#D4AF37]" size={32} /></div>
        ) : (
          <>
            <div className="bg-[#111827]/80 border border-sb-border rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">{race?.raceName || "Race"} Pre-Race Check</h1>
                    <p className="text-sb-tx-3 text-sm mt-1">
                      Check every horse before starting the race.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-white">{processedCount}/{rows.length}</p>
                  <p className="text-sb-tx-3 text-xs uppercase tracking-wider">Completed</p>
                </div>
              </div>
              <div className="mt-5 h-2 rounded-full bg-sb-s2 overflow-hidden">
                <div
                  className="h-full bg-[#D4AF37] transition-all"
                  style={{ width: rows.length ? `${(processedCount / rows.length) * 100}%` : "0%" }}
                />
              </div>
            </div>

            {flash && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-sb-emerald-soft border border-sb-emerald-bd text-sb-emerald-ink text-sm">
                <CheckCircle2 size={15} /> {flash}
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-950/40 border border-red-900 text-red-300 text-sm">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            {rows.length === 0 ? (
              <div className="text-center py-16 bg-[#111827]/70 border border-sb-border rounded-2xl">
                <Stethoscope size={34} className="mx-auto mb-3 text-sb-tx-3 opacity-40" />
                <p className="text-white font-semibold">No ready entries with confirmed jockey.</p>
                <p className="text-sb-tx-3 text-sm mt-1">Only Ready entries are listed for pre-race checks.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rows.map((row) => {
                  const status = row.status || "Pending";
                  const entryId = row.entryId;
                  const isBusy = String(busyEntryId) === String(entryId);
                  return (
                    <div key={entryId} className="bg-[#111827]/80 border border-sb-border rounded-2xl p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-bold">{row.horseName || `Horse #${row.horseId}`}</h3>
                            <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusBadge(status)}`}>
                              {status}
                            </span>
                          </div>
                          <div className="grid sm:grid-cols-3 gap-2 mt-3 text-sm">
                            <p className="text-sb-tx-3">Entry <span className="text-sb-tx-2">#{entryId}</span></p>
                            <p className="text-sb-tx-3">Jockey <span className="text-sb-tx-2">{row.jockeyName || "-"}</span></p>
                            <p className="text-sb-tx-3">Health <span className="text-sb-tx-2">{row.healthStatus || "Not Recorded"}</span></p>
                          </div>
                          {row.reason && <p className="text-red-300 text-sm mt-2">Reason: {row.reason}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => setDetail(row)}
                            className="flex items-center gap-2 px-3 h-10 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx-2 hover:text-white text-sm font-semibold">
                            <Eye size={14} /> Horse Detail
                          </button>
                          <button onClick={() => updateCheck(entryId, { status: "Checked" }, "Horse checked.")}
                            disabled={isBusy || normalizeStatus(status) === "checked"}
                            className="flex items-center gap-2 px-3 h-10 rounded-xl bg-sb-emerald text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                            {isBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Check
                          </button>
                          <button onClick={() => { setRejecting(row); setReason(row.reason || ""); }}
                            disabled={isBusy || normalizeStatus(status) === "rejected"}
                            className="flex items-center gap-2 px-3 h-10 rounded-xl bg-red-500/15 border border-red-500/35 text-red-300 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={() => navigate(`/referee/races/${raceId}`)}
                disabled={!complete}
                title={complete ? "Go to race control" : "Process all entries before continuing"}
                className="flex items-center gap-2 px-5 h-11 rounded-xl bg-[#D4AF37] text-[#0A0E1A] font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                Continue to Race Control <ArrowRight size={15} />
              </button>
            </div>
          </>
        )}
      </div>

      {detail && (
        <Modal title="Horse Detail" onClose={() => setDetail(null)}>
          <div className="space-y-3 text-sm">
            {[
              ["Horse", detail.horseName || `Horse #${detail.horseId}`],
              ["Owner", detail.ownerName || "-"],
              ["Jockey", detail.jockeyName || "-"],
              ["Registration Status", detail.registrationStatus || "-"],
              ["Health Status", detail.healthStatus || "Not Recorded"],
              ["Last Health Note", detail.latestHealthNote || detail.healthNote || "-"],
            ].map(([label, value]) => (
              <div key={label} className="bg-[#0A0E1A]/70 rounded-xl p-3">
                <p className="text-sb-tx-3 text-xs uppercase tracking-wider mb-1">{label}</p>
                <p className="text-white">{value}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {rejecting && (
        <Modal title="Reject Horse" onClose={() => { setRejecting(null); setReason(""); }}>
          <form onSubmit={handleReject} className="space-y-4">
            <p className="text-sb-tx-2 text-sm">
              Rejecting <span className="text-white font-semibold">{rejecting.horseName || `Horse #${rejecting.horseId}`}</span> removes this entry from the race.
            </p>
            <div>
              <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-wider mb-1">Reject Reason *</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} required
                className="w-full bg-[#0A0E1A] border border-sb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37] resize-none"
                placeholder="Explain why this horse cannot join the race..." />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setRejecting(null); setReason(""); }}
                className="flex-1 py-2 rounded-lg border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm">
                Cancel
              </button>
              <button type="submit" disabled={!!busyEntryId}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {busyEntryId && <Loader2 size={14} className="animate-spin" />} Reject
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
