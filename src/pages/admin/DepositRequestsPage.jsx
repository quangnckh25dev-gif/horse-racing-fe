import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, Loader2, RefreshCw, Wallet, XCircle, Search, Zap } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import SbModal from "../../components/sb/Modal";
import { SbAlert, SbEmpty, SbSpinner } from "../../components/sb/Feedback";
import { SbPageHeader } from "../../components/sb/Data";
import { adminService } from "../../services/admin";

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected"];
const METHOD_FILTERS = ["All", "BANK", "MOMO"];
// Deposit bi he thong tu dong tu choi (het 30s khong duyet) -> adminNote chua "auto"
const isAutoRejected = (req) =>
  req.status === "Rejected" && (req.adminNote || "").toLowerCase().includes("auto");

const STATUS = {
  Pending: { label: "Pending", cls: "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd", icon: Clock3 },
  Approved: { label: "Approved", cls: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd", icon: CheckCircle2 },
  Rejected: { label: "Rejected", cls: "bg-sb-lose/10 text-sb-lose border-sb-lose/30", icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.Pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${cfg.cls}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

const getSpectatorName = (req) =>
  req.fullName || req.spectatorName || req.customerName || req.username || req.email || `User #${req.userId}`;

function RejectModal({ request, busy, onClose, onSubmit }) {
  const [note, setNote] = useState("");

  return (
    <SbModal title="Reject Deposit Request" subtitle={`Request #${request.depositRequestId}`} tone="danger" onClose={busy ? undefined : onClose}>
      <div className="space-y-4">
        <div className="rounded-xl bg-sb-s2 border border-sb-border p-3 text-sm">
          <p className="text-sb-tx font-bold">{fmt(request.amount)} VND</p>
          <p className="text-sb-tx-3 text-xs mt-1">{request.paymentMethod} | {request.transferCode}</p>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Enter rejection reason..."
          className="w-full rounded-xl bg-sb-s1 border border-sb-border px-3 py-2 text-sm text-sb-tx outline-none focus:border-sb-lose"
        />
        <div className="flex gap-3">
          <button onClick={onClose} disabled={busy} className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-2 hover:text-sb-tx text-sm disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => onSubmit(note)} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-sb-lose text-white font-bold text-sm disabled:opacity-50">
            {busy ? <Loader2 size={15} className="animate-spin mx-auto" /> : "Reject"}
          </button>
        </div>
      </div>
    </SbModal>
  );
}

export default function DepositRequestsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState(""); // yyyy-mm-dd
  const [keyword, setKeyword] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminService.getDepositRequests({
        status: statusFilter,
        paymentMethod: methodFilter,
        date: dateFilter,
        keyword,
      });
      setItems(res.data || []);
    } catch (e) {
      setError(e.message || "Unable to load deposit requests");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, methodFilter, dateFilter, keyword]);

  useEffect(() => { load(); }, [load]);

  const approve = async (req) => {
    setBusyId(req.depositRequestId);
    setError("");
    setSuccess("");
    try {
      await adminService.approveDepositRequest(req.depositRequestId);
      setSuccess(`Approved request #${req.depositRequestId} and credited ${fmt(req.amount)} VND to wallet.`);
      await load();
    } catch (e) {
      setError(e.message || "Failed to approve request");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (note) => {
    if (!rejecting) return;
    setBusyId(rejecting.depositRequestId);
    setError("");
    setSuccess("");
    try {
      await adminService.rejectDepositRequest(rejecting.depositRequestId, note);
      setSuccess(`Rejected request #${rejecting.depositRequestId}.`);
      setRejecting(null);
      await load();
    } catch (e) {
      setError(e.message || "Failed to reject request");
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = items.filter((x) => x.status === "Pending").length;
  const hasActiveFilters = statusFilter !== "All" || methodFilter !== "All" || !!dateFilter || !!keyword.trim();

  return (
    <AdminLayout title="Approve Deposits">
      <SbPageHeader
        eyebrow="Admin"
        title="Approve Deposits"
        icon={Wallet}
        stats={[`${items.length} requests`, `${pendingCount} pending`]}
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
              placeholder="Search by spectator, email, phone, transfer code..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-sb-s1 border border-sb-border text-sb-tx text-sm placeholder:text-sb-tx-3 outline-none focus:border-sb-emerald focus:ring-1 focus:ring-sb-emerald/40 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 h-10 rounded-xl text-xs font-semibold border transition-all ${
                  statusFilter === s
                    ? "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd"
                    : "bg-sb-s1 text-sb-tx-3 border-sb-border hover:text-sb-tx hover:border-sb-tx-3"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="h-10 rounded-xl bg-sb-s1 border border-sb-border text-sb-tx text-sm px-3 outline-none focus:border-sb-info focus:ring-1 focus:ring-sb-info/40 transition-colors cursor-pointer"
          >
            {METHOD_FILTERS.map((m) => (
              <option key={m} value={m}>{m === "All" ? "All methods" : m}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-10 rounded-xl bg-sb-s1 border border-sb-border text-sb-tx text-sm px-3 outline-none focus:border-sb-info focus:ring-1 focus:ring-sb-info/40 transition-colors cursor-pointer"
          />
          {hasActiveFilters && (
            <button
              onClick={() => { setStatusFilter("All"); setMethodFilter("All"); setDateFilter(""); setKeyword(""); }}
              className="px-3 h-10 rounded-xl text-xs font-semibold border border-sb-border bg-sb-s1 text-sb-tx-3 hover:text-sb-tx transition-all"
            >
              Clear
            </button>
          )}
        </div>

        {loading ? <SbSpinner /> : items.length === 0 && !hasActiveFilters ? (
          <SbEmpty icon="VND" title="No deposit requests yet" hint="New user requests will appear here" />
        ) : items.length === 0 ? (
          <SbEmpty icon="🔍" title="No matching requests" hint="Try changing the filters or search" />
        ) : (
          <div className="rounded-2xl bg-sb-s1 border border-sb-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sb-s2 text-sb-tx-3 text-[11px] uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Request</th>
                    <th className="px-5 py-3 text-left">User / Wallet</th>
                    <th className="px-5 py-3 text-left">Payment</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sb-border">
                  {items.map((req) => {
                    const busy = busyId === req.depositRequestId;
                    const isPending = req.status === "Pending";
                    const autoRej = isAutoRejected(req);
                    return (
                      <tr key={req.depositRequestId} className="hover:bg-sb-s2/60">
                        <td className="px-5 py-4">
                          <p className="text-sb-tx font-bold">#{req.depositRequestId}</p>
                          <p className="text-sb-tx-3 text-xs">{req.createdAt ? new Date(req.createdAt).toLocaleString("vi-VN") : ""}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sb-tx font-semibold">{getSpectatorName(req)}</p>
                          <p className="text-sb-tx-3 text-xs">Wallet #{req.walletId}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sb-tx font-semibold">{req.paymentMethod}</p>
                          <p className="text-sb-gold-2 text-xs font-bold">{req.transferCode}</p>
                        </td>
                        <td className="px-5 py-4 text-right text-sb-gold-2 font-black tabular-nums">{fmt(req.amount)} VND</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={req.status} />
                          {autoRej && (
                            <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-sb-lose/10 text-sb-lose border-sb-lose/30">
                              <Zap size={10} /> Auto-rejected (30s)
                            </span>
                          )}
                          {req.adminNote && <p className="text-sb-tx-3 text-xs mt-1 max-w-[220px] truncate">{req.adminNote}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => approve(req)}
                              disabled={!isPending || busy}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sb-emerald text-white text-xs font-bold disabled:opacity-40"
                            >
                              {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Approve
                            </button>
                            <button
                              onClick={() => setRejecting(req)}
                              disabled={!isPending || busy}
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

      {rejecting && (
        <RejectModal
          request={rejecting}
          busy={busyId === rejecting.depositRequestId}
          onClose={() => setRejecting(null)}
          onSubmit={reject}
        />
      )}
    </AdminLayout>
  );
}
