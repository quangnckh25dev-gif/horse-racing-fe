import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Eye, Loader2, MessageSquareWarning, RefreshCw, Search, XCircle } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import SbModal from "../../components/sb/Modal";
import { SbAlert, SbEmpty, SbSpinner } from "../../components/sb/Feedback";
import { SbPageHeader } from "../../components/sb/Data";
import { complaintService } from "../../services/complaint";

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");
const STATUS_FILTERS = ["All", "Pending", "Resolved", "Rejected"];

const STATUS = {
  Pending: { label: "Pending", cls: "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd", icon: Clock3 },
  Resolved: { label: "Resolved", cls: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd", icon: CheckCircle2 },
  Rejected: { label: "Rejected", cls: "bg-sb-lose/10 text-sb-lose border-sb-lose/30", icon: XCircle },
};

const getCustomerName = (item) =>
  item.fullName || item.spectatorName || item.customerName || item.username || item.email || `User #${item.userId}`;

function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.Pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${cfg.cls}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

function ActionModal({ item, action, busy, onClose, onSubmit }) {
  const [note, setNote] = useState("");
  const isReject = action === "reject";

  return (
    <SbModal
      title={isReject ? "Reject Complaint" : "Resolve Complaint"}
      subtitle={`Complaint #${item.complaintId || item.id}`}
      tone={isReject ? "danger" : "default"}
      onClose={busy ? undefined : onClose}
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-sb-s2 border border-sb-border p-3 text-sm">
          <p className="text-sb-tx font-bold">{fmt(item.amount)} VND</p>
          <p className="text-sb-tx-3 text-xs mt-1">{item.paymentMethod} | {item.transferCode}</p>
          {item.reason && <p className="text-sb-tx-2 text-xs mt-2">{item.reason}</p>}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder={isReject ? "Enter rejection reason..." : "Enter resolution note..."}
          className="w-full rounded-xl bg-sb-s1 border border-sb-border px-3 py-2 text-sm text-sb-tx outline-none focus:border-sb-emerald"
        />
        <div className="flex gap-3">
          <button onClick={onClose} disabled={busy} className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-2 hover:text-sb-tx text-sm disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => onSubmit(note)}
            disabled={busy || (isReject && !note.trim())}
            className={`flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 ${isReject ? "bg-sb-lose" : "bg-sb-emerald"}`}
          >
            {busy ? <Loader2 size={15} className="animate-spin mx-auto" /> : isReject ? "Reject" : "Resolve"}
          </button>
        </div>
      </div>
    </SbModal>
  );
}

export default function DepositComplaintsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await complaintService.getAdminDepositComplaints();
      setItems(res.data || []);
    } catch (e) {
      setError(e.message || "Unable to load deposit complaints");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      if (!kw) return true;
      const hay = `${getCustomerName(item)} ${item.userId || ""} ${item.transferCode || ""} ${item.reason || ""}`.toLowerCase();
      return hay.includes(kw);
    });
  }, [items, statusFilter, keyword]);

  const submitAction = async (note) => {
    if (!modal) return;
    const id = modal.item.complaintId || modal.item.id;
    setBusyId(id);
    setError("");
    setSuccess("");
    try {
      if (modal.action === "reject") {
        await complaintService.rejectDepositComplaint(id, note);
        setSuccess(`Rejected complaint #${id}.`);
      } else {
        await complaintService.resolveDepositComplaint(id, note);
        setSuccess(`Resolved complaint #${id}.`);
      }
      setModal(null);
      await load();
    } catch (e) {
      setError(e.message || "Failed to update complaint");
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = items.filter((item) => item.status === "Pending").length;

  return (
    <AdminLayout title="Deposit Complaints">
      <SbPageHeader
        eyebrow="Admin"
        title="Deposit Complaints"
        icon={MessageSquareWarning}
        stats={[`${items.length} complaints`, `${pendingCount} pending`]}
        actions={
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 h-10 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx-2 hover:text-sb-tx text-sm disabled:opacity-50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        }
      />

      <div className="p-6 space-y-5">
        {error && <SbAlert tone="error">{error}</SbAlert>}
        {success && <SbAlert tone="success">{success}</SbAlert>}

        <div className="flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sb-tx-3" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by customer, transfer code, reason..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-sb-s1 border border-sb-border text-sb-tx text-sm placeholder:text-sb-tx-3 outline-none focus:border-sb-emerald"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 h-10 rounded-xl text-xs font-semibold border transition-all ${
                  statusFilter === status
                    ? "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd"
                    : "bg-sb-s1 text-sb-tx-3 border-sb-border hover:text-sb-tx hover:border-sb-tx-3"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? <SbSpinner /> : filtered.length === 0 ? (
          <SbEmpty icon="!" title="No matching complaints" hint="New deposit complaints will appear here" />
        ) : (
          <div className="rounded-2xl bg-sb-s1 border border-sb-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sb-s2 text-sb-tx-3 text-[11px] uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Complaint</th>
                    <th className="px-5 py-3 text-left">Customer</th>
                    <th className="px-5 py-3 text-left">Payment</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-left">Reason</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sb-border">
                  {filtered.map((item) => {
                    const id = item.complaintId || item.id;
                    const pending = item.status === "Pending";
                    const busy = busyId === id;
                    return (
                      <tr key={id} className="hover:bg-sb-s2/60">
                        <td className="px-5 py-4">
                          <p className="text-sb-tx font-bold">#{id}</p>
                          <p className="text-sb-tx-3 text-xs">{item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : ""}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sb-tx font-semibold">{getCustomerName(item)}</p>
                          <p className="text-sb-tx-3 text-xs">User #{item.userId}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sb-tx font-semibold">{item.paymentMethod}</p>
                          <p className="text-sb-gold-2 text-xs font-bold">{item.transferCode || "Manual"}</p>
                        </td>
                        <td className="px-5 py-4 text-right text-sb-gold-2 font-black tabular-nums">{fmt(item.amount)} VND</td>
                        <td className="px-5 py-4 max-w-[260px]">
                          <p className="text-sb-tx-2 text-xs line-clamp-2">{item.reason}</p>
                          {item.evidenceUrl && (
                            <a href={item.evidenceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sb-info text-xs font-bold hover:underline mt-1">
                              <Eye size={12} /> Evidence
                            </a>
                          )}
                          {item.adminNote && <p className="text-sb-tx-3 text-xs mt-1">Admin note: {item.adminNote}</p>}
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setModal({ action: "resolve", item })}
                              disabled={!pending || busy}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sb-emerald text-white text-xs font-bold disabled:opacity-40"
                            >
                              {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Resolve
                            </button>
                            <button
                              onClick={() => setModal({ action: "reject", item })}
                              disabled={!pending || busy}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sb-lose text-white text-xs font-bold disabled:opacity-40"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <ActionModal
          item={modal.item}
          action={modal.action}
          busy={busyId === (modal.item.complaintId || modal.item.id)}
          onClose={() => setModal(null)}
          onSubmit={submitAction}
        />
      )}
    </AdminLayout>
  );
}
