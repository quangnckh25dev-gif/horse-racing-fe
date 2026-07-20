import { useState, useEffect, useCallback } from "react";
import {
  Wallet, Plus, History, Loader2, ArrowUpRight, ArrowDownLeft, RotateCcw,
  TrendingUp, Trophy, ShieldCheck, Copy, QrCode, Clock3, CheckCircle2, XCircle,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import SbModal from "../../components/sb/Modal";
import { SbAlert, SbSpinner, SbEmpty } from "../../components/sb/Feedback";
import { SbPageHeader } from "../../components/sb/Data";
import { SbInput } from "../../components/sb/Field";
import { walletService } from "../../services/wallet";

const TX_TYPE = {
  Deposit: { label: "Deposit", cls: "text-sb-win", sign: "+", icon: ArrowDownLeft },
  BetPlaced: { label: "Bet Placed", cls: "text-sb-lose", sign: "-", icon: ArrowUpRight },
  BetWon: { label: "Bet Won", cls: "text-sb-win", sign: "+", icon: TrendingUp },
  BetRefund: { label: "Refunded", cls: "text-sb-info", sign: "+", icon: RotateCcw },
  PrizeAwarded: { label: "Prize Awarded", cls: "text-sb-gold-2", sign: "+", icon: Trophy },
};

const QUICK_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000];

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
  Rejected: { label: "Rejected", cls: "bg-sb-lose/10 text-sb-lose border-sb-lose/30", icon: XCircle },
};

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");
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
              Tao yeu cau
            </button>
          </div>
        </div>
      )}
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
  }, []);

  useEffect(() => { load(); }, [load]);

  const onCreated = () => {
    setSuccess("Deposit request created. Balance will update after Admin approval.");
    load();
  };

  return (
    <AdminLayout title="My Wallet">
      <SbPageHeader
        eyebrow="Spectator"
        title="My Wallet"
        icon={Wallet}
        stats={[`${transactions.length} transactions`, `${depositRequests.length} deposit requests`]}
        actions={
          <button onClick={() => { setSuccess(""); setError(""); setDepositOpen(true); }}
            className="flex items-center gap-2 px-4 h-10 rounded-xl bg-sb-gold text-[#0B0F14] font-bold text-sm hover:opacity-90">
            <Plus size={15} /> Deposit
          </button>
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
            </div>

            <div className="lg:col-span-2 space-y-5">
              <div className="rounded-2xl bg-sb-s1 border border-sb-border overflow-hidden">
                <div className="flex items-center gap-2 p-5 border-b border-sb-border">
                  <QrCode size={14} className="text-sb-gold-2" />
                  <h3 className="font-bold text-sm text-sb-tx">requests nap tien</h3>
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
                  <History size={14} className="text-sb-emerald-ink" />
                  <h3 className="font-bold text-sm text-sb-tx">Transaction History</h3>
                </div>
                {transactions.length === 0 ? <SbEmpty icon="TX" title="No transactions yet" hint="Deposit transactions appear only after Admin approval" /> : (
                  <div className="divide-y divide-sb-border">
                    {transactions.map((tx, i) => {
                      const key = tx.type || tx.transactionType;
                      const type = TX_TYPE[key] || { label: key || "Transaction", cls: "text-sb-tx-2", sign: "", icon: History };
                      const TxIcon = type.icon;
                      return (
                        <div key={tx.transactionId || i} className="flex items-center gap-4 px-5 py-4 hover:bg-sb-s2 transition-colors">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-sb-s2 border border-sb-border ${type.cls}`}>
                            <TxIcon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sb-tx text-sm font-semibold">{type.label}</p>
                            {tx.description && <p className="text-sb-tx-3 text-xs mt-0.5 truncate">{tx.description}</p>}
                            {tx.createdAt && <p className="text-sb-tx-3 text-xs mt-0.5">{new Date(tx.createdAt).toLocaleString("vi-VN")}</p>}
                          </div>
                          <span className={`font-bold text-sm shrink-0 tabular-nums ${type.cls}`}>{type.sign}{fmt(tx.amount)} VND</span>
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
    </AdminLayout>
  );
}
