import { useState, useEffect, useCallback } from "react";
import {
  Wallet, Plus, History, Loader2,
  ArrowUpRight, ArrowDownLeft, RotateCcw, TrendingUp, Trophy, ShieldCheck,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import SbModal from "../../components/sb/Modal";
import { SbAlert, SbSpinner, SbEmpty } from "../../components/sb/Feedback";
import { SbPageHeader } from "../../components/sb/Data";
import { SbInput } from "../../components/sb/Field";
import { walletService } from "../../services/wallet";

// Quy ước dấu khớp DB: Deposit(+) BetPlaced(−) BetWon(+) BetRefund(+) PrizeAwarded(+)
const TX_TYPE = {
  Deposit:      { label: "Nạp tiền",   cls: "text-sb-win",  sign: "+", icon: ArrowDownLeft },
  BetPlaced:    { label: "Đặt cược",   cls: "text-sb-lose", sign: "−", icon: ArrowUpRight },
  BetWon:       { label: "Thắng cược", cls: "text-sb-win",  sign: "+", icon: TrendingUp },
  BetRefund:    { label: "Hoàn tiền",  cls: "text-sb-info", sign: "+", icon: RotateCcw },
  PrizeAwarded: { label: "Tiền thưởng", cls: "text-sb-gold-2", sign: "+", icon: Trophy },
};

const QUICK_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000];

// Tiền DEMO — không có cổng thanh toán thật, chỉ mô phỏng cho đồ án
const METHODS = [
  { id: "momo",  label: "Ví MoMo",       icon: "🟣", hint: "Chuyển khoản ví điện tử" },
  { id: "bank",  label: "Ngân hàng",     icon: "🏦", hint: "Vietcombank · Techcombank" },
  { id: "card",  label: "Thẻ tín dụng",  icon: "💳", hint: "Visa · Mastercard" },
];

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");

function DepositModal({ onClose, onDone }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("momo");
  const [stage, setStage]   = useState("form"); // form | processing
  const [error, setError]   = useState("");

  const amt = Number(amount);

  const submit = async () => {
    if (!amt || amt < 10_000) { setError("Số tiền nạp tối thiểu 10.000 VNĐ"); return; }
    setError(""); setStage("processing");
    try {
      // Mô phỏng thời gian xử lý của cổng thanh toán
      await new Promise((r) => setTimeout(r, 1500));
      await walletService.deposit(amt);
      onDone(amt);
    } catch (e) {
      setError(e.message || "Nạp tiền thất bại");
      setStage("form");
    }
  };

  return (
    <SbModal title="Nạp tiền vào ví" subtitle="Tiền demo — không có giao dịch thật" tone="gold" onClose={stage === "processing" ? undefined : onClose}>
      {stage === "processing" ? (
        <div className="flex flex-col items-center py-10 text-center">
          <Loader2 size={34} className="animate-spin text-sb-gold mb-4" />
          <p className="text-sb-tx font-semibold">Đang xử lý giao dịch…</p>
          <p className="text-sb-tx-3 text-sm mt-1">{fmt(amt)} VNĐ · {METHODS.find((m) => m.id === method)?.label}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {error && <SbAlert tone="error">{error}</SbAlert>}

          <div>
            <p className="text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-2">Phương thức</p>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    method === m.id
                      ? "bg-sb-gold-soft border-sb-gold-bd"
                      : "bg-sb-s2 border-sb-border hover:border-sb-border-2"
                  }`}>
                  <div className="text-xl mb-1">{m.icon}</div>
                  <p className={`text-xs font-bold ${method === m.id ? "text-sb-gold-2" : "text-sb-tx-2"}`}>{m.label}</p>
                  <p className="text-sb-tx-3 text-[10px] mt-0.5 leading-tight">{m.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-2">Số tiền</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {QUICK_AMOUNTS.map((v) => (
                <button key={v} onClick={() => setAmount(String(v))}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all tabular-nums ${
                    amount === String(v)
                      ? "bg-sb-emerald text-white border-sb-emerald"
                      : "bg-sb-s2 border-sb-border text-sb-tx-2 hover:border-sb-border-2"
                  }`}>
                  {fmt(v)}
                </button>
              ))}
            </div>
            <SbInput type="number" placeholder="Hoặc nhập số tiền khác…"
              value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-sb-s2 border border-sb-border">
            <ShieldCheck size={15} className="text-sb-emerald-ink shrink-0" />
            <p className="text-sb-tx-3 text-[11px] leading-snug">
              Đây là môi trường mô phỏng phục vụ đồ án. Không có tiền thật nào được chuyển.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-2 hover:text-sb-tx text-sm transition-colors">
              Huỷ
            </button>
            <button onClick={submit} disabled={!amt}
              className="flex-1 py-2.5 rounded-xl bg-sb-gold text-[#0B0F14] font-bold text-sm disabled:opacity-50 transition-opacity">
              Nạp {amt ? fmt(amt) : ""} VNĐ
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [depositOpen, setDepositOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, tRes] = await Promise.all([
        walletService.getMyWallet(),
        walletService.getTransactions(),
      ]);
      setWallet(wRes.data);
      setTransactions(tRes.data || []);
    } catch (e) {
      setError(e.message || "Không thể tải dữ liệu ví");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onDeposited = (amt) => {
    setDepositOpen(false);
    setSuccess(`Nạp ${fmt(amt)} VNĐ thành công!`);
    load();
  };

  return (
    <AdminLayout title="Ví của tôi">
      <SbPageHeader
        eyebrow="Khán giả"
        title="Ví của tôi"
        icon={Wallet}
        stats={[`${transactions.length} giao dịch`]}
        actions={
          <button onClick={() => { setSuccess(""); setError(""); setDepositOpen(true); }}
            className="flex items-center gap-2 px-4 h-10 rounded-xl bg-sb-gold text-[#0B0F14] font-bold text-sm hover:opacity-90 transition-opacity">
            <Plus size={15} /> Nạp tiền
          </button>
        }
      />

      <div className="p-6 space-y-5">
        {error && <SbAlert tone="error">{error}</SbAlert>}
        {success && <SbAlert tone="success">{success}</SbAlert>}

        {loading ? (
          <SbSpinner />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Số dư */}
            <div className="rounded-2xl bg-sb-s1 border border-sb-border p-6 text-center h-fit">
              <div className="w-14 h-14 rounded-2xl bg-sb-gold-soft border border-sb-gold-bd flex items-center justify-center mx-auto mb-4">
                <Wallet size={24} className="text-sb-gold-2" />
              </div>
              <p className="text-sb-tx-3 text-[10px] uppercase tracking-widest font-bold mb-2">Số dư hiện tại</p>
              <p className="text-4xl font-black text-sb-gold-2 tabular-nums">
                {wallet?.balance != null ? fmt(wallet.balance) : "—"}
              </p>
              <p className="text-sb-tx-3 text-xs mt-1">VNĐ</p>
            </div>

            {/* Lịch sử giao dịch */}
            <div className="lg:col-span-2 rounded-2xl bg-sb-s1 border border-sb-border overflow-hidden">
              <div className="flex items-center gap-2 p-5 border-b border-sb-border">
                <History size={14} className="text-sb-emerald-ink" />
                <h3 className="font-bold text-sm text-sb-tx">Lịch sử giao dịch</h3>
              </div>

              {transactions.length === 0 ? (
                <SbEmpty icon="🧾" title="Chưa có giao dịch nào" hint="Nạp tiền để bắt đầu đặt cược" />
              ) : (
                <div className="divide-y divide-sb-border">
                  {transactions.map((tx, i) => {
                    const key = tx.type || tx.transactionType;
                    const type = TX_TYPE[key] || { label: key || "Giao dịch", cls: "text-sb-tx-2", sign: "", icon: History };
                    const TxIcon = type.icon;
                    return (
                      <div key={tx.transactionId || i} className="flex items-center gap-4 px-5 py-4 hover:bg-sb-s2 transition-colors">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-sb-s2 border border-sb-border ${type.cls}`}>
                          <TxIcon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sb-tx text-sm font-semibold">{type.label}</p>
                          {tx.description && <p className="text-sb-tx-3 text-xs mt-0.5 truncate">{tx.description}</p>}
                          {tx.createdAt && (
                            <p className="text-sb-tx-3 text-xs mt-0.5">{new Date(tx.createdAt).toLocaleString("vi-VN")}</p>
                          )}
                        </div>
                        <span className={`font-bold text-sm shrink-0 tabular-nums ${type.cls}`}>
                          {type.sign}{fmt(tx.amount)} VNĐ
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {depositOpen && <DepositModal onClose={() => setDepositOpen(false)} onDone={onDeposited} />}
    </AdminLayout>
  );
}
