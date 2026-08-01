import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, History, Loader2, ReceiptText, Trophy, XCircle } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { betService } from "../../services/bet";

const FILTERS = ["All", "Pending", "Won", "Lost", "Cancelled", "Refunded"];

const STATUS = {
  Pending: { label: "Pending", cls: "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd", icon: Clock3 },
  Won: { label: "Won", cls: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd", icon: CheckCircle2 },
  Lost: { label: "Lost", cls: "bg-sb-lose/10 text-sb-lose border-sb-lose/30", icon: XCircle },
  Cancelled: { label: "Cancelled", cls: "bg-sb-s2 text-sb-tx-2 border-sb-border", icon: XCircle },
  Refunded: { label: "Refunded", cls: "bg-sb-info/10 text-sb-info border-sb-info/30", icon: CheckCircle2 },
};

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");

function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.Pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${cfg.cls}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

function typeLabel(type, targetPosition) {
  if (type === "WIN") return "Win";
  if (type === "EXACT_POSITION" || type === "EXACT") return `Exact Position ${targetPosition || ""}`.trim();
  if (type === "VIOLATION") return "Violation";
  return type || "Bet";
}

function SingleBetCard({ bet }) {
  return (
    <div className="rounded-2xl border border-sb-border bg-sb-s1 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-sb-tx">{bet.raceName || `Race #${bet.raceId}`}</h3>
            <StatusBadge status={bet.status} />
            <span className="rounded-full border border-sb-border bg-sb-s2 px-2 py-0.5 text-[10px] font-bold text-sb-tx-3">Single</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-sb-tx">{bet.horseName || `Entry #${bet.entryId}`}</p>
          <p className="text-xs text-sb-tx-3">
            {typeLabel(bet.betType, bet.targetPosition)} | Jockey {bet.jockeyName || "N/A"} | Odds {bet.odds}x
          </p>
          {bet.createdAt && <p className="mt-1 text-xs text-sb-tx-3">{new Date(bet.createdAt).toLocaleString("vi-VN")}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-sb-lose tabular-nums">-{fmt(bet.amount)} VND</p>
          <p className="text-xs text-sb-tx-3">Potential {fmt(bet.potentialPayout)} VND</p>
          {bet.status === "Won" && <p className="text-xs font-black text-sb-win">+{fmt(bet.actualPayout || bet.payout)} VND</p>}
        </div>
      </div>
    </div>
  );
}

function ParlayCard({ ticket }) {
  return (
    <div className="rounded-2xl border border-sb-border bg-sb-s1 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-sb-tx">{ticket.raceName || `Race #${ticket.raceId}`}</h3>
            <StatusBadge status={ticket.status} />
            <span className="rounded-full border border-sb-emerald-bd bg-sb-emerald-soft px-2 py-0.5 text-[10px] font-bold text-sb-emerald-ink">Parlay</span>
          </div>
          {ticket.createdAt && <p className="mt-1 text-xs text-sb-tx-3">{new Date(ticket.createdAt).toLocaleString("vi-VN")}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-sb-lose tabular-nums">-{fmt(ticket.amount)} VND</p>
          <p className="text-xs text-sb-tx-3">Odds {Number(ticket.odds || 0).toFixed(2)}x</p>
          <p className="text-xs text-sb-tx-3">Potential {fmt(ticket.potentialPayout)} VND</p>
          {ticket.status === "Won" && <p className="text-xs font-black text-sb-win">+{fmt(ticket.actualPayout)} VND</p>}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
        {(ticket.selections || []).map((selection, index) => (
          <div key={selection.selectionId || index} className="rounded-xl border border-sb-border bg-sb-s2 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-sb-tx">{selection.horseName || `Entry #${selection.entryId}`}</p>
                <p className="text-xs text-sb-tx-3">{typeLabel(selection.betType, selection.targetPosition)} | {selection.odds}x</p>
              </div>
              {selection.resolved && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${selection.won ? "bg-sb-emerald-soft text-sb-emerald-ink" : "bg-sb-lose/10 text-sb-lose"}`}>
                  {selection.won ? "Won" : "Lost"}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BettingHistoryPage() {
  const [singleBets, setSingleBets] = useState([]);
  const [parlayTickets, setParlayTickets] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await betService.getBetHistory();
      const data = res.data || {};
      if (Array.isArray(data)) {
        setSingleBets(data);
        setParlayTickets([]);
      } else {
        setSingleBets(data.singleBets || []);
        setParlayTickets(data.parlayTickets || []);
      }
    } catch (e) {
      setError(e.message || "Unable to load betting history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredSingle = useMemo(
    () => singleBets.filter((bet) => filter === "All" || bet.status === filter),
    [singleBets, filter]
  );
  const filteredParlay = useMemo(
    () => parlayTickets.filter((ticket) => filter === "All" || ticket.status === filter),
    [parlayTickets, filter]
  );
  const totalItems = filteredSingle.length + filteredParlay.length;

  return (
    <AdminLayout title="Betting History">
      <div className="p-6 space-y-5">
        <section className="rounded-2xl border border-sb-border bg-sb-s1 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-sb-emerald-soft border border-sb-emerald-bd flex items-center justify-center">
                  <History size={15} className="text-sb-emerald-ink" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-sb-tx-3">Spectator</span>
              </div>
              <h1 className="text-2xl font-black text-sb-tx">Betting History</h1>
              <p className="text-sm text-sb-tx-3 mt-1">Single bets and parlay tickets are separate from wallet transaction history.</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`h-9 rounded-xl border px-3 text-xs font-bold ${
                    filter === item
                      ? "bg-sb-emerald-soft border-sb-emerald-bd text-sb-emerald-ink"
                      : "bg-sb-s2 border-sb-border text-sb-tx-3 hover:text-sb-tx"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-sb-lose/30 bg-sb-lose/10 p-3 text-sm text-sb-lose">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-14"><Loader2 size={28} className="animate-spin text-sb-gold-2" /></div>
        ) : totalItems === 0 ? (
          <div className="rounded-2xl border border-sb-border bg-sb-s1 py-16 text-center">
            <Trophy size={28} className="mx-auto mb-3 text-sb-tx-3" />
            <p className="text-sb-tx font-bold">No betting tickets found</p>
            <p className="text-sm text-sb-tx-3 mt-1">Try another status filter or place a new bet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSingle.map((bet) => <SingleBetCard key={`single-${bet.betId}`} bet={bet} />)}
            {filteredParlay.map((ticket) => <ParlayCard key={`ticket-${ticket.ticketId}`} ticket={ticket} />)}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
