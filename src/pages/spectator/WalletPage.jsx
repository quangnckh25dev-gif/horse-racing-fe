import { useState, useEffect, useCallback } from "react";
import {
  Wallet, Plus, History, Loader2, ArrowUpRight, ArrowDownLeft, RotateCcw,
  TrendingUp, Trophy, ShieldCheck, Copy, QrCode, Clock3, CheckCircle2, XCircle,
  MessageSquareWarning,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import SbModal from "../../components/sb/Modal";
import { SbAlert, SbSpinner, SbEmpty } from "../../components/sb/Feedback";
import { SbPageHeader } from "../../components/sb/Data";
import { SbInput } from "../../components/sb/Field";
import { walletService } from "../../services/wallet";
import { complaintService } from "../../services/complaint";

const TX_TYPE = {
  Deposit: { label: "Deposit", cls: "text-sb-win", sign: "+", icon: ArrowDownLeft },
  BetPlaced: { label: "Bet Placed", cls: "text-sb-lose", sign: "-", icon: ArrowUpRight },
  BetWon: { label: "Bet Won", cls: "text-sb-win", sign: "+", icon: TrendingUp },
  BetRefund: { label: "Refunded", cls: "text-sb-info", sign: "+", icon: RotateCcw },
  PrizeAwarded: { label: "Prize Awarded", cls: "text-sb-win", sign: "+", icon: Trophy },
};

const QUICK_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000];
const TX_FILTERS = ["All", "Deposit", "Bet Placed", "Bet Won", "Bet Refund", "Prize Awarded", "Money In", "Money Out"];

const METHODS = [
  { id: "BANK", label: "Bank Transfer", hint: "Bank transfer", qr: "/payments/bank-qr.png" },
  { id: "MOMO", label: "MoMo", hint: "E-wallet transfer", qr: "/payments/momo-qr.png" },
];

const PAYMENT_RECEIVER = {
  BANK: {
    bankCode: "VCB",
    accountNumber: "1027913213",
    accountName: "Bui Quang An",
  },
  MOMO: {
    phone: "09866428960",
    accountName: "Quang An Handsome",
  },
};

const STATUS = {
  Pending: { label: "Pending", cls: "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd", icon: Clock3 },
  Approved: { label: "Approved", cls: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd", icon: CheckCircle2 },
  Resolved: { label: "Resolved", cls: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd", icon: CheckCircle2 },
  Rejected: { label: "Rejected", cls: "bg-sb-lose/10 text-sb-lose border-sb-lose/30", icon: XCircle },
};

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");
const txKey = (tx) => tx.type || tx.transactionType;
const txAmount = (tx) => Number(tx.amount || 0);
const isMoneyIn = (tx) => txAmount(tx) > 0 || ["Deposit", "BetWon", "BetRefund", "PrizeAwarded"].includes(txKey(tx));
const txMatchesFilter = (tx, filter) => {
  const key = txKey(tx);
  if (filter === "All") return true;
  if (filter === "Money In") return isMoneyIn(tx);
  if (filter === "Money Out") return !isMoneyIn(tx);
  return (TX_TYPE[key]?.label || key) === filter;
};
const getPaymentQr = (paymentMethod) =>
  METHODS.find((m) => m.id === paymentMethod)?.qr || "/payments/bank-qr.png";
const getTransferContent = (request) => request?.transferCode || "";
const buildPaymentQr = (request) => {
  const paymentMethod = request?.paymentMethod;
  const amount = Math.round(Number(request?.amount || 0));
  const content = getTransferContent(request);

  if (paymentMethod === "BANK") {
    const bank = PAYMENT_RECEIVER.BANK;
    const params = new URLSearchParams({
      amount: String(amount),
      addInfo: content,
      accountName: bank.accountName,
    });
    return `https://img.vietqr.io/image/${bank.bankCode}-${bank.accountNumber}-compact2.png?${params.toString()}`;
  }

  if (paymentMethod === "MOMO") {
    const momo = PAYMENT_RECEIVER.MOMO;
    const deeplink = `momo://transfer?phone=${momo.phone}&amount=${amount}&comment=${encodeURIComponent(content)}`;
    return `https://quickchart.io/qr?size=420&margin=1&text=${encodeURIComponent(deeplink)}`;
  }

  return getPaymentQr(paymentMethod);
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

function DepositModal({ onClose, onDone }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("BANK");
  const [stage, setStage] = useState("form");
  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");
  const amt = Number(amount);

  const submit = async () => {
    if (!amt || amt <= 0) {
      setError("Deposit amount must be greater than 0");
      return;
    }
    setError("");
    setStage("processing");
    try {
      const res = await walletService.createDepositRequest({ amount: amt, paymentMethod: method });
      setCreated(res.data);
      setStage("created");
      onDone?.();
    } catch (e) {
      setError(e.message || "Failed to create deposit request");
      setStage("form");
    }
  };

  const copyCode = async () => {
    if (created?.transferCode) await navigator.clipboard?.writeText(created.transferCode);
  };

  return (
    <SbModal
      title="Create Deposit Request"
      subtitle="Balance increases only after Admin approval"
      tone="gold"
      onClose={stage === "processing" ? undefined : onClose}
    >
      {stage === "processing" ? (
        <div className="flex flex-col items-center py-10 text-center">
          <Loader2 size={34} className="animate-spin text-sb-gold mb-4" />
          <p className="text-sb-tx font-semibold">Creating request...</p>
        </div>
      ) : stage === "created" ? (
        <div className="space-y-4">
          <SbAlert tone="success">Deposit request created. Please transfer with the content below.</SbAlert>
          <div className="rounded-2xl bg-sb-s2 border border-sb-border p-4 space-y-3">
            <img
              src={buildPaymentQr(created)}
              alt={`${created?.paymentMethod || method} QR`}
              className="mx-auto w-56 h-56 object-contain rounded-xl bg-white p-2"
            />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-sb-tx-3 text-[10px] uppercase font-bold">Amount</p>
                <p className="text-sb-gold-2 font-black tabular-nums">{fmt(created?.amount)} VND</p>
              </div>
              <div>
                <p className="text-sb-tx-3 text-[10px] uppercase font-bold">Method</p>
                <p className="text-sb-tx font-semibold">{created?.paymentMethod}</p>
              </div>
            </div>
            <div className="rounded-xl bg-sb-s1 border border-sb-border p-3 text-xs text-sb-tx-2 space-y-1">
              {created?.paymentMethod === "BANK" ? (
                <>
                  <p>Bank: <span className="font-bold text-sb-tx">Vietcombank</span></p>
                  <p>STK: <span className="font-bold text-sb-tx">{PAYMENT_RECEIVER.BANK.accountNumber}</span></p>
                  <p>Account Name: <span className="font-bold text-sb-tx">{PAYMENT_RECEIVER.BANK.accountName}</span></p>
                </>
              ) : (
                <>
                  <p>MoMo Phone: <span className="font-bold text-sb-tx">{PAYMENT_RECEIVER.MOMO.phone}</span></p>
                  <p>Wallet Owner: <span className="font-bold text-sb-tx">{PAYMENT_RECEIVER.MOMO.accountName}</span></p>
                </>
              )}
            </div>
            <div>
              <p className="text-sb-tx-3 text-[10px] uppercase font-bold mb-1">Transfer Content</p>
              <button onClick={copyCode} className="w-full flex items-center justify-between gap-2 rounded-xl border border-sb-gold-bd bg-sb-gold-soft px-3 py-2">
                <span className="font-data text-sb-gold-2 font-black tracking-wide">{getTransferContent(created)}</span>
                <Copy size={15} className="text-sb-gold-2" />
              </button>
            </div>
          </div>
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-sb-gold text-[#0B0F14] font-bold text-sm">
            Got it
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {error && <SbAlert tone="error">{error}</SbAlert>}
          <div>
            <p className="text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-2">Method</p>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${method === m.id ? "bg-sb-gold-soft border-sb-gold-bd" : "bg-sb-s2 border-sb-border hover:border-sb-border-2"}`}>
                  <p className={`text-sm font-bold ${method === m.id ? "text-sb-gold-2" : "text-sb-tx-2"}`}>{m.label}</p>
                  <p className="text-sb-tx-3 text-[11px] mt-0.5">{m.hint}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-2">Amount</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {QUICK_AMOUNTS.map((v) => (
                <button key={v} onClick={() => setAmount(String(v))}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all tabular-nums ${amount === String(v) ? "bg-sb-emerald text-white border-sb-emerald" : "bg-sb-s2 border-sb-border text-sb-tx-2 hover:border-sb-border-2"}`}>
                  {fmt(v)}
                </button>
              ))}
            </div>
            <SbInput type="number" min="1" placeholder="Enter amount..." value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-sb-s2 border border-sb-border">
            <ShieldCheck size={15} className="text-sb-emerald-ink shrink-0" />
            <p className="text-sb-tx-3 text-[11px] leading-snug">This is a manual deposit request. Your wallet will not be credited until Admin approval.</p>
          </div>
          <div className="rounded-2xl bg-white p-3 border border-sb-border">
            <img src={getPaymentQr(method)} alt={`${method} QR`} className="mx-auto w-40 h-40 object-contain" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-2 hover:text-sb-tx text-sm">Cancel</button>
            <button onClick={submit} disabled={!amt} className="flex-1 py-2.5 rounded-xl bg-sb-gold text-[#0B0F14] font-bold text-sm disabled:opacity-50">
              Create request
            </button>
          </div>
        </div>
      )}
    </SbModal>
  );
}

function ComplaintModal({ depositRequests, onClose, onDone }) {
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({
    transferCode: "",
    amount: "",
    paymentMethod: "BANK",
    reason: "",
    evidenceUrl: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectDeposit = (id) => {
    setSelectedId(id);
    const req = depositRequests.find((item) => String(item.depositRequestId) === id);
    if (!req) return;
    setForm((prev) => ({
      ...prev,
      transferCode: req.transferCode || "",
      amount: req.amount || "",
      paymentMethod: req.paymentMethod || "BANK",
    }));
  };

  const submit = async () => {
    if (!form.transferCode.trim()) {
      setError("Transfer code is required.");
      return;
    }
    if (!Number(form.amount) || Number(form.amount) <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }
    if (!form.reason.trim()) {
      setError("Reason is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await complaintService.createDepositComplaint({
        depositRequestId: selectedId ? Number(selectedId) : null,
        transferCode: form.transferCode.trim(),
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
        reason: form.reason.trim(),
        evidenceUrl: form.evidenceUrl.trim(),
      });
      onDone?.();
    } catch (e) {
      setError(e.message || "Failed to submit complaint.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SbModal title="Deposit Complaint" subtitle="Send missing deposit evidence to Admin" tone="gold" onClose={busy ? undefined : onClose}>
      <div className="space-y-4">
        {error && <SbAlert tone="error">{error}</SbAlert>}
        <div>
          <p className="text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-2">Deposit request</p>
          <select
            value={selectedId}
            onChange={(e) => selectDeposit(e.target.value)}
            className="w-full h-11 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx text-sm px-3 outline-none focus:border-sb-gold"
          >
            <option value="">Manual transfer code</option>
            {depositRequests.map((req) => (
              <option key={req.depositRequestId} value={req.depositRequestId}>
                #{req.depositRequestId} - {req.transferCode} - {fmt(req.amount)} VND - {req.status}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SbInput placeholder="Transfer code" value={form.transferCode} onChange={(e) => setForm({ ...form, transferCode: e.target.value })} />
          <select
            value={form.paymentMethod}
            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            className="h-11 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx text-sm px-3 outline-none focus:border-sb-gold"
          >
            <option value="BANK">BANK</option>
            <option value="MOMO">MOMO</option>
          </select>
        </div>
        <SbInput type="number" min="1" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <textarea
          rows={4}
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          placeholder="Describe the issue..."
          className="w-full rounded-xl bg-sb-s2 border border-sb-border px-3 py-2 text-sm text-sb-tx outline-none focus:border-sb-gold"
        />
        <SbInput placeholder="Evidence image URL" value={form.evidenceUrl} onChange={(e) => setForm({ ...form, evidenceUrl: e.target.value })} />
        <div className="flex gap-3">
          <button onClick={onClose} disabled={busy} className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-2 hover:text-sb-tx text-sm disabled:opacity-50">
            Cancel
          </button>
          <button onClick={submit} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-sb-gold text-[#0B0F14] font-bold text-sm disabled:opacity-50">
            {busy ? <Loader2 size={15} className="animate-spin mx-auto" /> : "Submit complaint"}
          </button>
        </div>
      </div>
    </SbModal>
  );
}

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [depositRequests, setDepositRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [depositOpen, setDepositOpen] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [txFilter, setTxFilter] = useState("All");
  const [txDate, setTxDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [wRes, tRes] = await Promise.all([
        walletService.getMyWallet(),
        walletService.getTransactions(),
      ]);
      setWallet(wRes.data);
      setTransactions(tRes.data || []);
    } catch (e) {
      setError(e.message || "Unable to load wallet data");
    }

    try {
      const dRes = await walletService.getMyDepositRequests();
      setDepositRequests(dRes.data || []);
    } catch (e) {
      setDepositRequests([]);
      setError(e.message || "Unable to load deposit requests");
    } finally {
      setLoading(false);
    }

    try {
      const cRes = await complaintService.getMyDepositComplaints();
      setComplaints(cRes.data || []);
    } catch {
      setComplaints([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onCreated = () => {
    setSuccess("Deposit request created. Balance will update after Admin approval.");
    load();
  };

  const prizeTransactions = transactions.filter((tx) => (tx.type || tx.transactionType) === "PrizeAwarded");
  const prizeTotal = prizeTransactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const filteredTransactions = transactions.filter((tx) => {
    if (!txMatchesFilter(tx, txFilter)) return false;
    if (txDate && !String(tx.createdAt || "").startsWith(txDate)) return false;
    return true;
  });

  return (
    <AdminLayout title="My Wallet">
      <SbPageHeader
        eyebrow="Spectator"
        title="My Wallet"
        icon={Wallet}
        stats={[
          `${transactions.length} transactions`,
          `${depositRequests.length} deposit requests`,
          `${fmt(prizeTotal)} VND prizes`,
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setSuccess(""); setError(""); setComplaintOpen(true); }}
              className="flex items-center gap-2 px-4 h-10 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx-2 hover:text-sb-tx font-bold text-sm">
              <MessageSquareWarning size={15} /> Complaint
            </button>
            <button onClick={() => { setSuccess(""); setError(""); setDepositOpen(true); }}
              className="flex items-center gap-2 px-4 h-10 rounded-xl bg-sb-gold text-[#0B0F14] font-bold text-sm hover:opacity-90">
              <Plus size={15} /> Deposit
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-5">
        {error && <SbAlert tone="error">{error}</SbAlert>}
        {success && <SbAlert tone="success">{success}</SbAlert>}
        {loading ? <SbSpinner /> : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="rounded-2xl bg-sb-s1 border border-sb-border p-6 text-center h-fit">
              <div className="w-14 h-14 rounded-2xl bg-sb-gold-soft border border-sb-gold-bd flex items-center justify-center mx-auto mb-4">
                <Wallet size={24} className="text-sb-gold-2" />
              </div>
              <p className="text-sb-tx-3 text-[10px] uppercase tracking-widest font-bold mb-2">Current Balance</p>
              <p className="text-4xl font-black text-sb-gold-2 tabular-nums">{wallet?.balance != null ? fmt(wallet.balance) : "-"}</p>
              <p className="text-sb-tx-3 text-xs mt-1">VND</p>
              <div className="mt-5 rounded-xl border border-sb-emerald-bd bg-sb-emerald-soft p-3">
                <div className="flex items-center justify-center gap-2 text-sb-emerald-ink">
                  <Trophy size={15} />
                  <span className="text-xs font-bold uppercase tracking-wider">Prize Awarded</span>
                </div>
                <p className="mt-1 text-lg font-black text-sb-win tabular-nums">{fmt(prizeTotal)} VND</p>
                <p className="text-[11px] text-sb-tx-3">{prizeTransactions.length} prize transactions</p>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-5">
              <div className="rounded-2xl bg-sb-s1 border border-sb-border overflow-hidden">
                <div className="flex items-center gap-2 p-5 border-b border-sb-border">
                  <QrCode size={14} className="text-sb-gold-2" />
                  <h3 className="font-bold text-sm text-sb-tx">Deposit requests</h3>
                </div>
                {depositRequests.length === 0 ? <SbEmpty icon="QR" title="No deposit requests yet" hint="Create a request and transfer using the generated code" /> : (
                  <div className="divide-y divide-sb-border">
                    {depositRequests.map((req) => (
                      <div key={req.depositRequestId} className="px-5 py-4 hover:bg-sb-s2 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sb-tx text-sm font-bold tabular-nums">{fmt(req.amount)} VND</p>
                              <StatusBadge status={req.status} />
                            </div>
                            <p className="text-sb-tx-3 text-xs mt-1">
                              {req.paymentMethod} | Code: <span className="text-sb-gold-2 font-bold">{req.transferCode}</span>
                            </p>
                            {req.adminNote && <p className="text-sb-lose text-xs mt-1">Reason: {req.adminNote}</p>}
                          </div>
                          <p className="text-sb-tx-3 text-xs shrink-0">{req.createdAt ? new Date(req.createdAt).toLocaleString("vi-VN") : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-sb-s1 border border-sb-border overflow-hidden">
                <div className="flex items-center gap-2 p-5 border-b border-sb-border">
                  <MessageSquareWarning size={14} className="text-sb-info" />
                  <h3 className="font-bold text-sm text-sb-tx">Deposit complaints</h3>
                </div>
                {complaints.length === 0 ? <SbEmpty icon="!" title="No complaints yet" hint="Submit a complaint if a transfer was missed" /> : (
                  <div className="divide-y divide-sb-border">
                    {complaints.map((item) => (
                      <div key={item.complaintId || item.id} className="px-5 py-4 hover:bg-sb-s2 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sb-tx text-sm font-bold tabular-nums">{fmt(item.amount)} VND</p>
                              <StatusBadge status={item.status} />
                              <span className="text-[11px] font-bold text-sb-tx-3">{item.paymentMethod}</span>
                            </div>
                            <p className="text-sb-tx-3 text-xs mt-1">
                              Code: <span className="text-sb-gold-2 font-bold">{item.transferCode || "Manual"}</span>
                            </p>
                            {item.reason && <p className="text-sb-tx-2 text-xs mt-1 line-clamp-2">{item.reason}</p>}
                            {item.adminNote && <p className="text-sb-info text-xs mt-1">Admin note: {item.adminNote}</p>}
                            {item.evidenceUrl && (
                              <a href={item.evidenceUrl} target="_blank" rel="noreferrer" className="text-sb-emerald-ink text-xs font-bold hover:underline">
                                View evidence
                              </a>
                            )}
                          </div>
                          <p className="text-sb-tx-3 text-xs shrink-0">{item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-sb-s1 border border-sb-border overflow-hidden">
                <div className="flex flex-col gap-3 p-5 border-b border-sb-border">
                  <div className="flex items-center gap-2">
                    <History size={14} className="text-sb-emerald-ink" />
                    <h3 className="font-bold text-sm text-sb-tx">Transaction History</h3>
                  </div>
                  <div className="flex flex-col xl:flex-row gap-2 xl:items-center">
                    <div className="flex flex-wrap gap-1.5">
                      {TX_FILTERS.map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setTxFilter(filter)}
                          className={`px-3 h-9 rounded-xl border text-[11px] font-bold transition-colors ${
                            txFilter === filter
                              ? "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd"
                              : "bg-sb-s2 text-sb-tx-3 border-sb-border hover:text-sb-tx"
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                    <input
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="h-9 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx text-xs px-3 outline-none focus:border-sb-emerald"
                    />
                  </div>
                </div>
                {transactions.length === 0 ? <SbEmpty icon="TX" title="No transactions yet" hint="Deposit transactions appear only after Admin approval" /> : filteredTransactions.length === 0 ? (
                  <SbEmpty icon="TX" title="No matching transactions" hint="Try another type or date filter" />
                ) : (
                  <div className="divide-y divide-sb-border">
                    {filteredTransactions.map((tx, i) => {
                      const key = tx.type || tx.transactionType;
                      const type = TX_TYPE[key] || { label: key || "Transaction", cls: "text-sb-tx-2", sign: "", icon: History };
                      const TxIcon = type.icon;
                      const isPrize = key === "PrizeAwarded";
                      const amount = txAmount(tx);
                      const moneyIn = isMoneyIn(tx);
                      return (
                        <div key={tx.transactionId || i} className={`flex items-center gap-4 px-5 py-4 transition-colors ${isPrize ? "bg-sb-emerald-soft/40 hover:bg-sb-emerald-soft/60" : "hover:bg-sb-s2"}`}>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${isPrize ? "bg-sb-emerald-soft border-sb-emerald-bd" : "bg-sb-s2 border-sb-border"} ${moneyIn ? "text-sb-win" : "text-sb-lose"}`}>
                            <TxIcon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sb-tx text-sm font-semibold">{type.label}</p>
                            {tx.description && <p className="text-sb-tx-3 text-xs mt-0.5 truncate">{tx.description}</p>}
                            {tx.createdAt && <p className="text-sb-tx-3 text-xs mt-0.5">{new Date(tx.createdAt).toLocaleString("vi-VN")}</p>}
                          </div>
                          <span className={`font-bold text-sm shrink-0 tabular-nums ${moneyIn ? "text-sb-win" : "text-sb-lose"}`}>
                            {moneyIn ? "+" : "-"}{fmt(Math.abs(amount))} VND
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {depositOpen && <DepositModal onClose={() => setDepositOpen(false)} onDone={onCreated} />}
      {complaintOpen && (
        <ComplaintModal
          depositRequests={depositRequests}
          onClose={() => setComplaintOpen(false)}
          onDone={() => {
            setComplaintOpen(false);
            setSuccess("Deposit complaint submitted. Admin will review it soon.");
            load();
          }}
        />
      )}
    </AdminLayout>
  );
}
