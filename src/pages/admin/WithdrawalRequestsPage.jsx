import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Loader2, RefreshCw, DollarSign, XCircle, Search } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import SbModal from "../../components/sb/Modal";
import { SbAlert, SbEmpty, SbSpinner } from "../../components/sb/Feedback";
import { SbPageHeader } from "../../components/sb/Data";
import { walletService } from "../../services/wallet";

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");
const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected"];

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

const customerOf = (item) =>
  item.fullName || item.username || item.email || `User #${item.userId}`;

function RejectModal({ request, busy, onClose, onSubmit }) {
  const [note, setNote] = useState("");
  return (
    <SbModal title="Reject Withdrawal" subtitle={`Request #${request.withdrawalRequestId}`} tone="danger" onClose={busy ? undefined : onClose}>
      <div className="space-y-4">
        <div className="rounded-xl bg-sb-s2 border border-sb-border p-3 text-sm">
          <p className="text-sb-tx font-bold">{fmt(request.amount)} VND</p>
          <p className="text-sb-tx-3 text-xs mt-1">{request.paymentMethod} · {request.bankAccountNumber} · {request.bankAccountName}</p>
        </div>
        <p className="text-sb-tx-2 text-xs">Rejecting will refund the amount back to the user's wallet.</p>
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
            {busy ? <Loader2 size={15} className="animate-spin mx-auto" /> : "Reject & refund"}
          </button>
        </div>
      </div>
    </SbModal>
  );
}

export default function WithdrawalRequestsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [keyword, setKeyword] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await walletService.getAdminWithdrawalRequests();
      setItems(res.data || []);
    } catch (e) {
      setError(e.message || "Unable to load withdrawal requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (req) => {
    setBusyId(req.withdrawalRequestId); setError(""); setSuccess("");
    try {
      await walletService.approveWithdrawalRequest(req.withdrawalRequestId);
      setSuccess(`Approved withdrawal #${req.withdrawalRequestId} (${fmt(req.amount)} VND).`);
      await load();
    } catch (e) {
      setError(e.message || "Failed to approve withdrawal");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (note) => {
    if (!rejecting) return;
    setBusyId(rejecting.withdrawalRequestId); setError(""); setSuccess("");
    try {
      await walletService.rejectWithdrawalRequest(rejecting.withdrawalRequestId, note);
      setSuccess(`Rejected withdrawal #${rejecting.withdrawalRequestId} and refunded to wallet.`);
      setRejecting(null);
      await load();
    } catch (e) {
      setError(e.message || "Failed to reject withdrawal");
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = items.filter((x) => x.status === "Pending").length;

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return items.filter((it) => {
      if (statusFilter !== "All" && it.status !== statusFilter) return false;
      if (kw) {
        const hay = `${customerOf(it)} ${it.userId} ${it.bankAccountNumber || ""} ${it.bankAccountName || ""}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [items, statusFilter, keyword]);

  return (
    <AdminLayout title="Withdrawal Requests">
      <SbPageHeader
        eyebrow="Admin"
        title="Withdrawal Requests"
        icon={DollarSign}
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

        {!loading && items.length > 0 && (
          <div className="flex flex-col xl:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sb-tx-3" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search by customer, account number/name..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-sb-s1 border border-sb-border text-sb-tx text-sm placeholder:text-sb-tx-3 outline-none focus:border-sb-emerald focus:ring-1 focus:ring-sb-emerald/40 transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 h-10 rounded-xl text-xs font-semibold border transition-all ${
                    statusFilter === s
                      ? "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd"
                      : "bg-sb-s1 text-sb-tx-3 border-sb-border hover:text-sb-tx hover:border-sb-tx-3"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? <SbSpinner /> : items.length === 0 ? (
          <SbEmpty icon="↑" title="No withdrawal requests yet" hint="User withdrawal requests will appear here" />
        ) : filtered.length === 0 ? (
          <SbEmpty icon="🔍" title="No matching requests" hint="Try changing filters or search" />
        ) : (
          <div className="rounded-2xl bg-sb-s1 border border-sb-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sb-s2 text-sb-tx-3 text-[11px] uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Request</th>
                    <th className="px-5 py-3 text-left">Customer</th>
                    <th className="px-5 py-3 text-left">Destination</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sb-border">
                  {filtered.map((req) => {
                    const busy = busyId === req.withdrawalRequestId;
                    const pending = req.status === "Pending";
                    return (
                      <tr key={req.withdrawalRequestId} className="hover:bg-sb-s2/60">
                        <td className="px-5 py-4">
                          <p className="text-sb-tx font-bold">#{req.withdrawalRequestId}</p>
                          <p className="text-sb-tx-3 text-xs">{req.createdAt ? new Date(req.createdAt).toLocaleString("vi-VN") : ""}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sb-tx font-semibold">{customerOf(req)}</p>
                          <p className="text-sb-tx-3 text-xs">User #{req.userId}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sb-tx font-semibold">{req.paymentMethod}{req.bankName ? ` · ${req.bankName}` : ""}</p>
                          <p className="text-sb-gold-2 text-xs font-bold">{req.bankAccountNumber}</p>
                          <p className="text-sb-tx-3 text-xs">{req.bankAccountName}</p>
                        </td>
                        <td className="px-5 py-4 text-right text-sb-gold-2 font-black tabular-nums">{fmt(req.amount)} VND</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={req.status} />
                          {req.adminNote && <p className="text-sb-tx-3 text-xs mt-1 max-w-[200px] truncate">{req.adminNote}</p>}
                        </td>
                        <td className="px-5 py-4">
                          {pending ? (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => approve(req)} disabled={busy}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sb-emerald text-white text-xs font-bold disabled:opacity-40">
                                {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Approve
                              </button>
                              <button onClick={() => setRejecting(req)} disabled={busy}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sb-lose text-white text-xs font-bold disabled:opacity-40">
                                <XCircle size={13} /> Reject
                              </button>
                            </div>
                          ) : (
                            <p className="text-right text-xs text-sb-tx-3">{req.status}</p>
                          )}
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
          busy={busyId === rejecting.withdrawalRequestId}
          onClose={() => setRejecting(null)}
          onSubmit={reject}
        />
      )}
    </AdminLayout>
  );
}
