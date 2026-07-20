import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, Loader2, RefreshCw, Wallet, XCircle } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import SbModal from "../../components/sb/Modal";
import { SbAlert, SbEmpty, SbSpinner } from "../../components/sb/Feedback";
import { SbPageHeader } from "../../components/sb/Data";
import { adminService } from "../../services/admin";

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");

const STATUS = {
  Pending: { label: "Cho duyet", cls: "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd", icon: Clock3 },
  Approved: { label: "Da duyet", cls: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd", icon: CheckCircle2 },
  Rejected: { label: "Tu choi", cls: "bg-sb-lose/10 text-sb-lose border-sb-lose/30", icon: XCircle },
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

function RejectModal({ request, busy, onClose, onSubmit }) {
  const [note, setNote] = useState("");

  return (
    <SbModal title="Tu choi yeu cau nap" subtitle={`Request #${request.depositRequestId}`} tone="danger" onClose={busy ? undefined : onClose}>
      <div className="space-y-4">
        <div className="rounded-xl bg-sb-s2 border border-sb-border p-3 text-sm">
          <p className="text-sb-tx font-bold">{fmt(request.amount)} VND</p>
          <p className="text-sb-tx-3 text-xs mt-1">{request.paymentMethod} | {request.transferCode}</p>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Nhap ly do tu choi..."
          className="w-full rounded-xl bg-sb-s1 border border-sb-border px-3 py-2 text-sm text-sb-tx outline-none focus:border-sb-lose"
        />
        <div className="flex gap-3">
          <button onClick={onClose} disabled={busy} className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-2 hover:text-sb-tx text-sm disabled:opacity-50">
            Huy
          </button>
          <button onClick={() => onSubmit(note)} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-sb-lose text-white font-bold text-sm disabled:opacity-50">
            {busy ? <Loader2 size={15} className="animate-spin mx-auto" /> : "Tu choi"}
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

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminService.getDepositRequests();
      setItems(res.data || []);
    } catch (e) {
      setError(e.message || "Khong the tai danh sach yeu cau nap tien");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (req) => {
    setBusyId(req.depositRequestId);
    setError("");
    setSuccess("");
    try {
      await adminService.approveDepositRequest(req.depositRequestId);
      setSuccess(`Da duyet yeu cau #${req.depositRequestId} va cong ${fmt(req.amount)} VND vao vi.`);
      await load();
    } catch (e) {
      setError(e.message || "Duyet yeu cau that bai");
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
      setSuccess(`Da tu choi yeu cau #${rejecting.depositRequestId}.`);
      setRejecting(null);
      await load();
    } catch (e) {
      setError(e.message || "Tu choi yeu cau that bai");
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = items.filter((x) => x.status === "Pending").length;

  return (
    <AdminLayout title="Duyet nap tien">
      <SbPageHeader
        eyebrow="Admin"
        title="Duyet nap tien"
        icon={Wallet}
        stats={[`${items.length} yeu cau`, `${pendingCount} cho duyet`]}
        actions={
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 h-10 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx-2 hover:text-sb-tx text-sm disabled:opacity-50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Lam moi
          </button>
        }
      />

      <div className="p-6 space-y-5">
        {error && <SbAlert tone="error">{error}</SbAlert>}
        {success && <SbAlert tone="success">{success}</SbAlert>}
        {loading ? <SbSpinner /> : items.length === 0 ? (
          <SbEmpty icon="VND" title="Chua co yeu cau nap tien" hint="Yeu cau moi tu nguoi dung se hien thi tai day" />
        ) : (
          <div className="rounded-2xl bg-sb-s1 border border-sb-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sb-s2 text-sb-tx-3 text-[11px] uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Request</th>
                    <th className="px-5 py-3 text-left">User / Wallet</th>
                    <th className="px-5 py-3 text-left">Thanh toan</th>
                    <th className="px-5 py-3 text-right">So tien</th>
                    <th className="px-5 py-3 text-left">Trang thai</th>
                    <th className="px-5 py-3 text-right">Thao tac</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sb-border">
                  {items.map((req) => {
                    const busy = busyId === req.depositRequestId;
                    const isPending = req.status === "Pending";
                    return (
                      <tr key={req.depositRequestId} className="hover:bg-sb-s2/60">
                        <td className="px-5 py-4">
                          <p className="text-sb-tx font-bold">#{req.depositRequestId}</p>
                          <p className="text-sb-tx-3 text-xs">{req.createdAt ? new Date(req.createdAt).toLocaleString("vi-VN") : ""}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sb-tx font-semibold">User #{req.userId}</p>
                          <p className="text-sb-tx-3 text-xs">Wallet #{req.walletId}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sb-tx font-semibold">{req.paymentMethod}</p>
                          <p className="text-sb-gold-2 text-xs font-bold">{req.transferCode}</p>
                        </td>
                        <td className="px-5 py-4 text-right text-sb-gold-2 font-black tabular-nums">{fmt(req.amount)} VND</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={req.status} />
                          {req.adminNote && <p className="text-sb-lose text-xs mt-1 max-w-[220px] truncate">{req.adminNote}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => approve(req)}
                              disabled={!isPending || busy}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sb-emerald text-white text-xs font-bold disabled:opacity-40"
                            >
                              {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Duyet
                            </button>
                            <button
                              onClick={() => setRejecting(req)}
                              disabled={!isPending || busy}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sb-lose text-white text-xs font-bold disabled:opacity-40"
                            >
                              <XCircle size={13} /> Tu choi
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
