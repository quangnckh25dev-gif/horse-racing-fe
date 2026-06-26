import { useState, useEffect, useCallback } from "react";
import {
  Wallet, Plus, History, Loader2, AlertCircle,
  CheckCircle2, ArrowUpRight, ArrowDownLeft, RotateCcw,
  TrendingUp,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { walletService } from "../../services/wallet";

const TX_TYPE = {
  Deposit:   { label: "Nạp tiền",   cls: "text-green-600",  sign: "+", icon: ArrowDownLeft },
  BetPlaced: { label: "Đặt cược",   cls: "text-red-600",    sign: "-", icon: ArrowUpRight },
  BetWon:    { label: "Thắng cược", cls: "text-green-600",  sign: "+", icon: TrendingUp },
  BetRefund: { label: "Hoàn tiền",  cls: "text-blue-600",   sign: "+", icon: RotateCcw },
};

const QUICK_AMOUNTS = [
  { label: "100k",  value: 100_000 },
  { label: "200k",  value: 200_000 },
  { label: "500k",  value: 500_000 },
  { label: "1tr",   value: 1_000_000 },
];

export default function WalletPage() {
  const [wallet, setWallet]             = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [depositAmt, setDepositAmt]     = useState("");
  const [depositing, setDepositing]     = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");

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

  const handleDeposit = async () => {
    const amt = Number(depositAmt);
    if (!amt || amt < 10_000) {
      setError("Số tiền nạp tối thiểu 10,000 VNĐ");
      return;
    }
    setDepositing(true); setError(""); setSuccess("");
    try {
      await walletService.deposit(amt);
      setSuccess(`Nạp ${amt.toLocaleString("vi-VN")} VNĐ thành công!`);
      setDepositAmt("");
      load();
    } catch (e) {
      setError(e.message || "Nạp tiền thất bại");
    } finally {
      setDepositing(false);
    }
  };

  return (
    <AdminLayout title="Ví của tôi">
      {/* Page Header */}
      <div className="relative p-6 pb-5 border-b border-gray-100 bg-white overflow-hidden">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-[0.05] pointer-events-none select-none">💰</div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Wallet size={14} className="text-amber-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Khán giả</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 leading-tight">Ví của tôi</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý số dư và lịch sử giao dịch</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            <CheckCircle2 size={14} className="shrink-0" /> {success}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-blue-600" size={30} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Left column: balance + deposit */}
            <div className="space-y-4">

              {/* Balance card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                  <Wallet size={24} className="text-amber-600" />
                </div>
                <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-2">Số dư hiện tại</p>
                <p className="text-4xl font-bold text-amber-600">
                  {wallet?.balance != null
                    ? Number(wallet.balance).toLocaleString("vi-VN")
                    : "—"}
                </p>
                <p className="text-gray-400 text-xs mt-1">VNĐ</p>
              </div>

              {/* Deposit card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
                  <div className="w-6 h-6 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center">
                    <Plus size={12} className="text-green-600" />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900">Nạp tiền</h3>
                </div>

                {/* Quick amount buttons */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {QUICK_AMOUNTS.map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => setDepositAmt(String(value))}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        depositAmt === String(value)
                          ? "bg-[#D4AF37] text-[#0A0E1A] border-[#D4AF37]"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  placeholder="Nhập số tiền..."
                  value={depositAmt}
                  onChange={(e) => setDepositAmt(e.target.value)}
                  className="w-full h-10 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm px-3 mb-3 focus:outline-none focus:ring-1 focus:ring-amber-300 focus:border-amber-400 placeholder:text-gray-400"
                />

                <button
                  onClick={handleDeposit}
                  disabled={depositing || !depositAmt}
                  className="w-full h-10 rounded-xl bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {depositing
                    ? <Loader2 size={14} className="animate-spin" />
                    : <ArrowDownLeft size={14} />
                  }
                  Nạp tiền
                </button>
              </div>
            </div>

            {/* Right column: transaction history */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 p-5 border-b border-gray-100">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <History size={12} className="text-blue-600" />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900">Lịch sử giao dịch</h3>
                  <span className="ml-auto text-xs text-gray-500">{transactions.length} giao dịch</span>
                </div>

                {transactions.length === 0 ? (
                  <div className="py-16 text-center">
                    <History size={28} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-700 font-semibold">Chưa có giao dịch nào</p>
                    <p className="text-gray-500 text-sm mt-1">Nạp tiền để bắt đầu đặt cược</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {transactions.map((tx, i) => {
                      const type = TX_TYPE[tx.type] || {
                        label: tx.type || "Giao dịch",
                        cls: "text-gray-600",
                        sign: "",
                        icon: History,
                      };
                      const TxIcon = type.icon;
                      return (
                        <div
                          key={tx.transactionId || i}
                          className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${type.cls} bg-gray-50 border border-gray-100`}>
                            <TxIcon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 text-sm font-semibold">{type.label}</p>
                            {tx.description && (
                              <p className="text-gray-500 text-xs mt-0.5 truncate">{tx.description}</p>
                            )}
                            {tx.createdAt && (
                              <p className="text-gray-400 text-xs mt-0.5">
                                {new Date(tx.createdAt).toLocaleString("vi-VN")}
                              </p>
                            )}
                          </div>
                          <span className={`font-bold text-sm shrink-0 ${type.cls}`}>
                            {type.sign}{Number(tx.amount).toLocaleString("vi-VN")} VNĐ
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
    </AdminLayout>
  );
}
