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
  Deposit: { label: "Nap tien", cls: "text-sb-win", sign: "+", icon: ArrowDownLeft },
  BetPlaced: { label: "Dat cuoc", cls: "text-sb-lose", sign: "-", icon: ArrowUpRight },
  BetWon: { label: "Thang cuoc", cls: "text-sb-win", sign: "+", icon: TrendingUp },
  BetRefund: { label: "Hoan tien", cls: "text-sb-info", sign: "+", icon: RotateCcw },
  PrizeAwarded: { label: "Tien thuong", cls: "text-sb-gold-2", sign: "+", icon: Trophy },
};

const QUICK_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000];

const METHODS = [
  { id: "BANK", label: "Bank Transfer", hint: "Chuyen khoan ngan hang", qr: "/payments/bank-qr.png" },
  { id: "MOMO", label: "MoMo", hint: "Chuyen tien vi dien tu", qr: "/payments/momo-qr.png" },
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
  Pending: { label: "Cho duyet", cls: "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd", icon: Clock3 },
  Approved: { label: "Da duyet", cls: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd", icon: CheckCircle2 },
  Rejected: { label: "Tu choi", cls: "bg-sb-lose/10 text-sb-lose border-sb-lose/30", icon: XCircle },
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
      setError("So tien nap phai lon hon 0");
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
      setError(e.message || "Tao yeu cau nap tien that bai");
      setStage("form");
    }
  };

  const copyCode = async () => {
    if (created?.transferCode) await navigator.clipboard?.writeText(created.transferCode);
  };

  return (
    <SbModal
      title="Tao yeu cau nap tien"
      subtitle="So du chi tang sau khi Admin duyet"
      tone="gold"
      onClose={stage === "processing" ? undefined : onClose}
    >
      {stage === "processing" ? (
        <div className="flex flex-col items-center py-10 text-center">
          <Loader2 size={34} className="animate-spin text-sb-gold mb-4" />
          <p className="text-sb-tx font-semibold">Dang tao yeu cau...</p>
        </div>
      ) : stage === "created" ? (
        <div className="space-y-4">
          <SbAlert tone="success">Yeu cau nap tien da duoc tao. Vui long chuyen khoan dung noi dung ben duoi.</SbAlert>
          <div className="rounded-2xl bg-sb-s2 border border-sb-border p-4 space-y-3">
            <img
              src={buildPaymentQr(created)}
              alt={`${created?.paymentMethod || method} QR`}
              className="mx-auto w-56 h-56 object-contain rounded-xl bg-white p-2"
            />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-sb-tx-3 text-[10px] uppercase font-bold">So tien</p>
                <p className="text-sb-gold-2 font-black tabular-nums">{fmt(created?.amount)} VND</p>
              </div>
              <div>
                <p className="text-sb-tx-3 text-[10px] uppercase font-bold">Phuong thuc</p>
                <p className="text-sb-tx font-semibold">{created?.paymentMethod}</p>
              </div>
            </div>
            <div className="rounded-xl bg-sb-s1 border border-sb-border p-3 text-xs text-sb-tx-2 space-y-1">
              {created?.paymentMethod === "BANK" ? (
                <>
                  <p>Ngan hang: <span className="font-bold text-sb-tx">Vietcombank</span></p>
                  <p>STK: <span className="font-bold text-sb-tx">{PAYMENT_RECEIVER.BANK.accountNumber}</span></p>
                  <p>Chu TK: <span className="font-bold text-sb-tx">{PAYMENT_RECEIVER.BANK.accountName}</span></p>
                </>
              ) : (
                <>
                  <p>So MoMo: <span className="font-bold text-sb-tx">{PAYMENT_RECEIVER.MOMO.phone}</span></p>
                  <p>Chu vi: <span className="font-bold text-sb-tx">{PAYMENT_RECEIVER.MOMO.accountName}</span></p>
                </>
              )}
            </div>
            <div>
              <p className="text-sb-tx-3 text-[10px] uppercase font-bold mb-1">Noi dung chuyen khoan</p>
              <button onClick={copyCode} className="w-full flex items-center justify-between gap-2 rounded-xl border border-sb-gold-bd bg-sb-gold-soft px-3 py-2">
                <span className="font-data text-sb-gold-2 font-black tracking-wide">{getTransferContent(created)}</span>
                <Copy size={15} className="text-sb-gold-2" />
              </button>
            </div>
          </div>
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-sb-gold text-[#0B0F14] font-bold text-sm">
            Da hieu
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {error && <SbAlert tone="error">{error}</SbAlert>}
          <div>
            <p className="text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-2">Phuong thuc</p>
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
            <p className="text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-2">So tien</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {QUICK_AMOUNTS.map((v) => (
                <button key={v} onClick={() => setAmount(String(v))}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all tabular-nums ${amount === String(v) ? "bg-sb-emerald text-white border-sb-emerald" : "bg-sb-s2 border-sb-border text-sb-tx-2 hover:border-sb-border-2"}`}>
                  {fmt(v)}
                </button>
              ))}
            </div>
            <SbInput type="number" min="1" placeholder="Nhap so tien..." value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-sb-s2 border border-sb-border">
            <ShieldCheck size={15} className="text-sb-emerald-ink shrink-0" />
            <p className="text-sb-tx-3 text-[11px] leading-snug">Day la yeu cau nap thu cong. Vi se khong duoc cong tien cho den khi Admin phe duyet.</p>
          </div>
          <div className="rounded-2xl bg-white p-3 border border-sb-border">
            <img src={getPaymentQr(method)} alt={`${method} QR`} className="mx-auto w-40 h-40 object-contain" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-2 hover:text-sb-tx text-sm">Huy</button>
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
      setError(e.message || "Khong the tai du lieu vi");
    }

    try {
      const dRes = await walletService.getMyDepositRequests();
      setDepositRequests(dRes.data || []);
    } catch (e) {
      setDepositRequests([]);
      setError(e.message || "Khong the tai danh sach yeu cau nap tien");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onCreated = () => {
    setSuccess("Da tao yeu cau nap tien. So du se cap nhat sau khi Admin duyet.");
    load();
  };

  return (
    <AdminLayout title="Vi cua toi">
      <SbPageHeader
        eyebrow="Khan gia"
        title="Vi cua toi"
        icon={Wallet}
        stats={[`${transactions.length} giao dich`, `${depositRequests.length} yeu cau nap`]}
        actions={
          <button onClick={() => { setSuccess(""); setError(""); setDepositOpen(true); }}
            className="flex items-center gap-2 px-4 h-10 rounded-xl bg-sb-gold text-[#0B0F14] font-bold text-sm hover:opacity-90">
            <Plus size={15} /> Nap tien
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
              <p className="text-sb-tx-3 text-[10px] uppercase tracking-widest font-bold mb-2">So du hien tai</p>
              <p className="text-4xl font-black text-sb-gold-2 tabular-nums">{wallet?.balance != null ? fmt(wallet.balance) : "-"}</p>
              <p className="text-sb-tx-3 text-xs mt-1">VND</p>
            </div>

            <div className="lg:col-span-2 space-y-5">
              <div className="rounded-2xl bg-sb-s1 border border-sb-border overflow-hidden">
                <div className="flex items-center gap-2 p-5 border-b border-sb-border">
                  <QrCode size={14} className="text-sb-gold-2" />
                  <h3 className="font-bold text-sm text-sb-tx">Yeu cau nap tien</h3>
                </div>
                {depositRequests.length === 0 ? <SbEmpty icon="QR" title="Chua co yeu cau nap" hint="Tao yeu cau va chuyen khoan theo ma duoc cap" /> : (
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
                            {req.adminNote && <p className="text-sb-lose text-xs mt-1">Ly do: {req.adminNote}</p>}
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
                  <h3 className="font-bold text-sm text-sb-tx">Lich su giao dich</h3>
                </div>
                {transactions.length === 0 ? <SbEmpty icon="TX" title="Chua co giao dich nao" hint="Giao dich nap tien chi xuat hien sau khi Admin duyet" /> : (
                  <div className="divide-y divide-sb-border">
                    {transactions.map((tx, i) => {
                      const key = tx.type || tx.transactionType;
                      const type = TX_TYPE[key] || { label: key || "Giao dich", cls: "text-sb-tx-2", sign: "", icon: History };
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
