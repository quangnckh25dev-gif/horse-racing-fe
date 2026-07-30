import { useCallback, useEffect, useState } from "react";
import { History, Trophy } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { SbAlert, SbEmpty, SbSpinner } from "../../components/sb/Feedback";
import { SbPageHeader } from "../../components/sb/Data";
import { betService } from "../../services/bet";

const BET_STATUS = {
  Pending: { label: "Pending", cls: "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd" },
  Won: { label: "Won", cls: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd" },
  Lost: { label: "Lost", cls: "bg-sb-lose/10 text-sb-lose border-sb-lose/30" },
  Cancelled: { label: "Cancelled", cls: "bg-sb-s2 text-sb-tx-3 border-sb-border" },
  Refunded: { label: "Refunded", cls: "bg-sb-info/10 text-sb-info border-sb-info/30" },
};

const BET_FILTERS = [
  { key: "all", label: "All" },
  { key: "unpaid", label: "Unpaid" },
  { key: "paid", label: "Paid" },
  { key: "cancelled", label: "Cancelled" },
  { key: "refunded", label: "Refunded" },
];

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");

const getBetResult = (bet) => {
  if (bet.status === "Won") {
    return {
      label: "Result",
      value: `+${fmt(bet.actualPayout || bet.potentialPayout)} VND`,
      cls: "text-sb-win",
    };
  }

  if (bet.status === "Lost") {
    return {
      label: "Result",
      value: `-${fmt(bet.amount)} VND`,
      cls: "text-sb-lose",
    };
  }

  if (bet.status === "Refunded") {
    return {
      label: "Refund",
      value: `+${fmt(bet.amount)} VND`,
      cls: "text-sb-info",
    };
  }

  return null;
};

const matchesBetFilter = (bet, filter) => {
  if (filter === "all") return true;
  if (filter === "unpaid") return bet.status === "Pending";
  if (filter === "paid") return bet.status === "Won" || bet.status === "Lost";
  if (filter === "cancelled") return bet.status === "Cancelled";
  if (filter === "refunded") return bet.status === "Refunded";
  return true;
};

function BetStatusBadge({ status }) {
  const cfg = BET_STATUS[status] || BET_STATUS.Pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function BetHistoryPage() {
  const [bets, setBets] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await betService.getBetHistory();
      setBets(res.data || []);
    } catch (e) {
      setError(e.message || "Unable to load betting history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredBets = bets.filter((bet) => matchesBetFilter(bet, filter));

  return (
    <AdminLayout title="Bet History">
      <SbPageHeader
        eyebrow="Spectator"
        title="Bet History"
        icon={History}
        stats={[`${filteredBets.length} shown`, `${bets.length} bets`]}
      />

      <div className="p-6 space-y-5">
        {error && <SbAlert tone="error">{error}</SbAlert>}
        {loading ? <SbSpinner /> : (
          <div className="rounded-2xl bg-sb-s1 border border-sb-border overflow-hidden">
            <div className="p-5 border-b border-sb-border space-y-4 bg-sb-s2/30">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Trophy size={14} className="text-sb-gold-2" />
                  <h3 className="font-bold text-sm text-sb-tx">Betting History</h3>
                </div>
                <span className="text-xs text-sb-tx-3">{filteredBets.length} shown</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {BET_FILTERS.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setFilter(item.key)}
                    className={`px-3 h-8 rounded-full border text-xs font-bold transition-all whitespace-nowrap ${
                      filter === item.key
                        ? "bg-sb-gold text-[#0B0F14] border-sb-gold shadow-[0_0_18px_rgba(212,175,55,.22)]"
                        : "bg-[#101722] border-sb-border text-sb-tx-3 hover:text-sb-tx hover:border-sb-border-2"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            {filteredBets.length === 0 ? (
              <SbEmpty icon="BET" title={bets.length === 0 ? "No betting history yet" : "No matching bets"} hint={bets.length === 0 ? "Placed bets will appear here with race, horse, odds, payout, and status" : "Choose another filter to view more bet tickets"} />
            ) : (
              <div className="divide-y divide-sb-border">
                {filteredBets.map((bet, i) => {
                  const result = getBetResult(bet);
                  return (
                  <div key={bet.betId || i} className="px-5 py-4 hover:bg-sb-s2 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sb-tx text-sm font-black">{bet.raceName || `Race #${bet.raceId}`}</p>
                          <BetStatusBadge status={bet.status} />
                        </div>
                        <p className="text-sb-tx-2 text-sm mt-1">
                          {bet.horseName || `Entry #${bet.entryId}`}
                          {bet.jockeyName ? <span className="text-sb-tx-3"> | {bet.jockeyName}</span> : null}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-sb-tx-3">
                          <span>{bet.betTypeLabel || bet.betType}{bet.targetPosition ? ` - Position ${bet.targetPosition}` : ""}</span>
                          <span>Amount: <b className="text-sb-tx tabular-nums">{fmt(bet.amount)} VND</b></span>
                          <span>Odds: <b className="text-sb-gold-2 tabular-nums">{bet.odds ?? "-"}x</b></span>
                          <span>Potential: <b className="text-sb-tx tabular-nums">{fmt(bet.potentialPayout)} VND</b></span>
                          {result && <span>{result.label}: <b className={`${result.cls} tabular-nums`}>{result.value}</b></span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {bet.createdAt && <p className="text-sb-tx-3 text-xs">{new Date(bet.createdAt).toLocaleString("vi-VN")}</p>}
                        {bet.settledAt && <p className="text-sb-tx-3 text-xs mt-1">Settled: {new Date(bet.settledAt).toLocaleString("vi-VN")}</p>}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
