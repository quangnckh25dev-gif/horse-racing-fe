import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileWarning,
  Loader2,
  RefreshCw,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { complaintService } from "../../services/complaint";
import { uploadService } from "../../services/upload";

const STATUS_FILTERS = ["Pending", "Resolved", "Rejected", "Forwarded", "All"];

const STATUS_STYLE = {
  Pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  Resolved: "bg-green-500/20 text-green-300 border-green-500/40",
  Rejected: "bg-red-500/20 text-red-300 border-red-500/40",
  Forwarded: "bg-purple-500/20 text-purple-300 border-purple-500/40",
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-sb-border bg-[#111827] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-sb-border px-6 py-4">
          <h3 className="font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-sb-tx-3 hover:text-white"><XCircle size={18} /></button>
        </div>
        <div className="p-6 overflow-y-auto min-h-0">{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLE[status] || STATUS_STYLE.Pending}`}>
      {status || "Pending"}
    </span>
  );
}

export default function RefereeRaceComplaintsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);
  const [note, setNote] = useState("");
  const [correctionRequired, setCorrectionRequired] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await complaintService.getRefereeRaceComplaints({
        status: statusFilter,
        keyword: keyword.trim(),
      });
      setItems(res.data || []);
    } catch (err) {
      setError(err.message || "Unable to load race complaints.");
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const pendingCount = useMemo(() => items.filter((item) => item.status === "Pending").length, [items]);

  const openAction = (item, type) => {
    setSelected(item);
    setAction(type);
    setNote("");
    setCorrectionRequired(false);
  };

  const submitAction = async (event) => {
    event.preventDefault();
    if (!selected || !action) return;
    const cleanNote = note.trim();
    if ((action === "reject" || action === "forward") && !cleanNote) {
      setError("Note is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = { refereeNote: cleanNote || undefined };
      if (action === "resolve") {
        payload.resultCorrectionRequired = correctionRequired;
        await complaintService.resolveRaceComplaint(selected.complaintId, payload);
        if (correctionRequired) {
          navigate(`/referee/races/${selected.raceId}`);
          return;
        }
      } else if (action === "reject") {
        await complaintService.rejectRaceComplaint(selected.complaintId, payload);
      } else {
        await complaintService.forwardRaceComplaint(selected.complaintId, payload);
      }
      setAction(null);
      setSelected(null);
      await load();
    } catch (err) {
      setError(err.message || "Unable to process complaint.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout title="Race Complaints">
      <div className="page-header">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/10">
                <FileWarning size={14} className="text-orange-300" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-sb-tx-3">Referee Review</span>
            </div>
            <h1 className="text-2xl font-black text-white">Race Complaints</h1>
            <p className="mt-2 text-sm text-sb-tx-3">{pendingCount} pending complaints assigned to your races</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 rounded-xl border border-sb-border bg-sb-s2 px-3 py-2 text-sm text-sb-tx-3 hover:text-sb-tx">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <div className="rounded-2xl border border-sb-border bg-sb-s1 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sb-tx-3" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Search race, horse, owner, reason..."
                className="w-full rounded-xl border border-sb-border bg-[#070B14] px-3 py-2.5 pl-9 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                    statusFilter === status
                      ? "border-[#D4AF37] bg-[#D4AF37] text-[#0A0E1A]"
                      : "border-sb-border bg-sb-s2 text-sb-tx-3 hover:text-white"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#D4AF37]" /></div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-sb-border bg-sb-s1 py-16 text-center">
            <FileWarning size={34} className="mx-auto mb-3 text-sb-tx-3 opacity-40" />
            <p className="font-semibold text-white">No matching race complaints</p>
            <p className="mt-1 text-sm text-sb-tx-3">Owner complaints for your assigned races will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.complaintId} className="rounded-2xl border border-sb-border bg-[#0d1117] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-white">{item.raceName || `Race #${item.raceId}`}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-sb-tx-3">
                      <span className="stat-pill">{item.horseName || `Entry #${item.entryId}`}</span>
                      <span className="stat-pill">{item.ownerFullName || item.ownerUsername || `Owner #${item.ownerUserId}`}</span>
                      {item.createdAt && <span>{new Date(item.createdAt).toLocaleString("en-US")}</span>}
                    </div>
                    <p className="mt-3 text-sm text-sb-tx-2">{item.reason}</p>
                    {item.evidenceUrl && (
                      <a href={uploadService.normalizeUploadUrl(item.evidenceUrl)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#D4AF37] hover:underline">
                        <Eye size={12} /> View evidence
                      </a>
                    )}
                    {item.refereeNote && <p className="mt-2 text-xs text-blue-300">Referee note: {item.refereeNote}</p>}
                    {item.organizerNote && <p className="mt-1 text-xs text-purple-300">Organizer note: {item.organizerNote}</p>}
                  </div>
                  {item.status === "Pending" && (
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button onClick={() => openAction(item, "resolve")} className="flex items-center gap-1.5 rounded-xl bg-green-600/15 px-3 py-2 text-xs font-bold text-green-300 ring-1 ring-green-600/30">
                        <CheckCircle2 size={13} /> Resolve
                      </button>
                      <button onClick={() => openAction(item, "reject")} className="flex items-center gap-1.5 rounded-xl bg-red-600/15 px-3 py-2 text-xs font-bold text-red-300 ring-1 ring-red-600/30">
                        <XCircle size={13} /> Reject
                      </button>
                      <button onClick={() => openAction(item, "forward")} className="flex items-center gap-1.5 rounded-xl bg-purple-600/15 px-3 py-2 text-xs font-bold text-purple-300 ring-1 ring-purple-600/30">
                        <Send size={13} /> Forward to Organizer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {action && selected && (
        <Modal title={`${action === "resolve" ? "Resolve" : action === "reject" ? "Reject" : "Forward"} Complaint`} onClose={() => setAction(null)}>
          <form onSubmit={submitAction} className="space-y-4">
            <p className="text-sm text-sb-tx-3">
              Complaint for <span className="font-semibold text-white">{selected.raceName || `Race #${selected.raceId}`}</span>.
            </p>
            {action === "resolve" && (
              <label className="flex items-center gap-2 rounded-xl border border-sb-border bg-sb-s2 p-3 text-sm text-sb-tx-2">
                <input
                  type="checkbox"
                  checked={correctionRequired}
                  onChange={(event) => setCorrectionRequired(event.target.checked)}
                  className="accent-[#D4AF37]"
                />
                This complaint requires result correction.
              </label>
            )}
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-sb-tx-3">
                Referee Note{action !== "resolve" && <span className="text-red-400"> *</span>}
              </label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                placeholder="Write a clear note for the owner and organizer..."
                className="w-full resize-none rounded-xl border border-sb-border bg-[#070B14] px-3 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setAction(null)} className="flex-1 rounded-xl border border-sb-border py-2.5 text-sm text-sb-tx-3 hover:text-white">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-2.5 text-sm font-black text-[#0A0E1A] disabled:opacity-60">
                {busy && <Loader2 size={14} className="animate-spin" />} Confirm
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
