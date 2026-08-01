import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle, Calendar, CheckCircle2, ChevronDown, ChevronUp, DollarSign,
  Flag, Loader2, Plus, ReceiptText, Trash2, Trophy, WalletCards,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { spectatorService } from "../../services/spectator";
import { betService } from "../../services/bet";

const BET_STATUSES = ["RegistrationOpen"];
const BET_TYPES = ["WIN", "EXACT_POSITION", "VIOLATION"];
const MIN_AMOUNT = 10000;

const BET_LABEL = {
  WIN: "Win",
  EXACT_POSITION: "Exact Position",
  VIOLATION: "Violation",
};

const STATUS_CONFIG = {
  RegistrationOpen: { label: "Registration Open", cls: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd" },
  Ongoing: { label: "Ongoing", cls: "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd" },
  Finished: { label: "Finished", cls: "bg-sb-s2 text-sb-tx-2 border-sb-border" },
  Cancelled: { label: "Cancelled", cls: "bg-sb-lose/10 text-sb-lose border-sb-lose/30" },
};

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");
const optKey = (o) => `${o.entryId}-${o.betType}-${o.targetPosition ?? 0}`;
const normalizeType = (type) => (type === "EXACT" ? "EXACT_POSITION" : type);
const optionLabel = (option) => {
  const type = normalizeType(option?.betType);
  if (type === "EXACT_POSITION") return `Exact Position ${option?.targetPosition}`;
  return option?.betTypeLabel || BET_LABEL[type] || type || "Bet";
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.RegistrationOpen;
  return <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${cfg.cls}`}>{cfg.label}</span>;
}

function RaceBetPanel({ race, onPlaced }) {
  const [options, setOptions] = useState([]);
  const [myBets, setMyBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [parlayAmount, setParlayAmount] = useState("");
  const [parlay, setParlay] = useState([]);
  const [busy, setBusy] = useState(false);
  const [ticketBusy, setTicketBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [optRes, betRes] = await Promise.all([
        betService.getBetOptions(race.raceId),
        betService.getMyBetByRace(race.raceId).catch(() => ({ data: [] })),
      ]);
      const cleanOptions = (optRes.data || [])
        .map((option) => ({ ...option, betType: normalizeType(option.betType) }))
        .filter((option) => BET_TYPES.includes(option.betType));
      setOptions(cleanOptions);
      setMyBets(betRes.data || []);
    } catch (e) {
      setError(e.message || "Unable to load betting options.");
    } finally {
      setLoading(false);
    }
  }, [race.raceId]);

  useEffect(() => { load(); }, [load]);

  const horses = useMemo(() => {
    const seen = new Set();
    return options.filter((option) => {
      if (seen.has(option.entryId)) return false;
      seen.add(option.entryId);
      return true;
    });
  }, [options]);

  const optionsByHorse = useMemo(() => {
    const grouped = new Map();
    for (const option of options) {
      const current = grouped.get(option.entryId) || [];
      current.push(option);
      grouped.set(option.entryId, current);
    }
    return grouped;
  }, [options]);

  const selectedAmount = Number(amount);
  const singlePayout = selected && selectedAmount > 0
    ? selectedAmount * Number(selected.odds || 1)
    : 0;
  const parlayOdds = parlay.reduce((total, option) => total * Number(option.odds || 1), 1);
  const parlayPayout = Number(parlayAmount) > 0 ? Number(parlayAmount) * parlayOdds : 0;

  const placeSingleBet = async () => {
    if (!selected) {
      setError("Please select a betting option.");
      return;
    }
    if (!selectedAmount || selectedAmount < MIN_AMOUNT) {
      setError(`Minimum bet amount is ${fmt(MIN_AMOUNT)} VND.`);
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await betService.placeBet(race.raceId, {
        entryId: selected.entryId,
        betType: selected.betType,
        targetPosition: selected.targetPosition ?? null,
        amount: selectedAmount,
      });
      setSuccess(`Single bet placed. Potential payout ${fmt(singlePayout)} VND.`);
      setSelected(null);
      setAmount("");
      await load();
      onPlaced?.();
    } catch (e) {
      setError(e.message || "Bet failed. Please check your wallet balance.");
    } finally {
      setBusy(false);
    }
  };

  const addToParlay = (option) => {
    setError("");
    const normalized = { ...option, betType: normalizeType(option.betType) };
    if (parlay.some((item) => optKey(item) === optKey(normalized))) {
      setError("This selection is already in the parlay ticket.");
      return;
    }
    setParlay((prev) => [...prev, normalized]);
  };

  const submitParlay = async () => {
    const amt = Number(parlayAmount);
    if (parlay.length < 2) {
      setError("A parlay ticket requires at least two selections.");
      return;
    }
    if (!amt || amt < MIN_AMOUNT) {
      setError(`Minimum parlay amount is ${fmt(MIN_AMOUNT)} VND.`);
      return;
    }
    setTicketBusy(true);
    setError("");
    setSuccess("");
    try {
      await betService.placeParlayTicket(race.raceId, {
        amount: amt,
        selections: parlay.map((option) => ({
          entryId: option.entryId,
          betType: option.betType,
          targetPosition: option.targetPosition ?? null,
        })),
      });
      setSuccess(`Parlay ticket placed. Potential payout ${fmt(parlayPayout)} VND.`);
      setParlay([]);
      setParlayAmount("");
      onPlaced?.();
    } catch (e) {
      setError(e.message || "Parlay ticket failed. Please check your wallet balance.");
    } finally {
      setTicketBusy(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-10"><Loader2 size={22} className="animate-spin text-sb-gold-2" /></div>;
  }

  return (
    <div className="border-t border-sb-border p-5 space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-sb-lose/30 bg-sb-lose/10 p-3 text-sm text-sb-lose">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-sb-emerald-bd bg-sb-emerald-soft p-3 text-sm text-sb-emerald-ink">
          <CheckCircle2 size={14} /> {success}
        </div>
      )}

      {myBets.length > 0 && (
        <section className="rounded-xl border border-sb-border bg-sb-s2/50 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-sb-gold-2">
            <ReceiptText size={14} /> Recent bets in this race
          </div>
          <div className="space-y-2">
            {myBets.slice(0, 4).map((bet) => (
              <div key={bet.betId} className="flex items-center justify-between gap-3 rounded-lg bg-sb-s1 border border-sb-border px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-sb-tx">{bet.horseName || `Entry #${bet.entryId}`}</p>
                  <p className="text-xs text-sb-tx-3">{bet.betTypeLabel || BET_LABEL[bet.betType] || bet.betType} | Odds {bet.odds}x</p>
                </div>
                <span className="shrink-0 text-xs font-bold text-sb-gold-2">{fmt(bet.amount)} VND</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {options.length === 0 ? (
        <div className="py-8 text-center text-sm text-sb-tx-3">No betting options available for this race.</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
          <section className="space-y-4">
            {horses.map((horse) => (
              <div key={horse.entryId} className="rounded-xl border border-sb-border bg-sb-s1 overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-sb-border px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-sb-tx">{horse.horseName || `Entry #${horse.entryId}`}</p>
                    <p className="text-xs text-sb-tx-3">
                      Lane {horse.laneNumber ?? "-"}{horse.jockeyName ? ` | Jockey ${horse.jockeyName}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-sb-tx-3">Rank {horse.horseRank ?? "N/A"}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
                  {(optionsByHorse.get(horse.entryId) || []).map((option) => {
                    const active = selected && optKey(selected) === optKey(option);
                    return (
                      <div key={optKey(option)} className={`rounded-xl border p-3 transition-colors ${active ? "border-sb-gold-bd bg-sb-gold-soft" : "border-sb-border bg-sb-s2/60"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className={`text-sm font-bold ${active ? "text-sb-gold-2" : "text-sb-tx"}`}>{optionLabel(option)}</p>
                            <p className="mt-1 text-xs text-sb-tx-3">Odds <span className="font-bold text-sb-gold-2">{option.odds}x</span></p>
                          </div>
                          <button
                            onClick={() => setSelected(option)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${active ? "bg-sb-gold text-sb-bg" : "bg-sb-emerald text-white"}`}
                          >
                            Select
                          </button>
                        </div>
                        <button
                          onClick={() => addToParlay(option)}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-sb-tx-3 hover:text-sb-tx"
                        >
                          <Plus size={12} /> Add to parlay
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          <aside className="space-y-4">
            <section className="rounded-xl border border-sb-border bg-sb-s1 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <WalletCards size={15} className="text-sb-gold-2" />
                <h3 className="text-sm font-black text-sb-tx">Single Bet</h3>
              </div>
              {selected ? (
                <div className="rounded-xl border border-sb-border bg-sb-s2 p-3">
                  <p className="text-sm font-bold text-sb-tx">{selected.horseName || `Entry #${selected.entryId}`}</p>
                  <p className="text-xs text-sb-tx-3">{optionLabel(selected)} | Odds {selected.odds}x</p>
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-sb-border bg-sb-s2/50 p-3 text-xs text-sb-tx-3">Select one option to place a single bet.</p>
              )}
              <input
                type="number"
                min={MIN_AMOUNT}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className="w-full h-11 rounded-xl bg-sb-s2 border border-sb-border px-3 text-sm text-sb-tx outline-none focus:border-sb-gold-bd"
              />
              <div className="rounded-xl border border-sb-border bg-sb-s2 p-3 text-xs text-sb-tx-3">
                Potential payout: <span className="font-black text-sb-win">{fmt(singlePayout)} VND</span>
              </div>
              <button
                onClick={placeSingleBet}
                disabled={busy || !selected || selectedAmount < MIN_AMOUNT}
                className="w-full h-11 rounded-xl bg-sb-gold text-sb-bg text-sm font-black disabled:opacity-50"
              >
                {busy ? <Loader2 size={16} className="mx-auto animate-spin" /> : "Place Single Bet"}
              </button>
            </section>

            <section className="rounded-xl border border-sb-border bg-sb-s1 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ReceiptText size={15} className="text-sb-emerald-ink" />
                <h3 className="text-sm font-black text-sb-tx">Parlay Ticket</h3>
              </div>
              {parlay.length === 0 ? (
                <p className="rounded-xl border border-dashed border-sb-border bg-sb-s2/50 p-3 text-xs text-sb-tx-3">Add at least two selections from this race.</p>
              ) : (
                <div className="space-y-2">
                  {parlay.map((option) => (
                    <div key={optKey(option)} className="flex items-start gap-2 rounded-xl border border-sb-border bg-sb-s2 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-sb-tx">{option.horseName || `Entry #${option.entryId}`}</p>
                        <p className="text-xs text-sb-tx-3">{optionLabel(option)} | {option.odds}x</p>
                      </div>
                      <button onClick={() => setParlay((prev) => prev.filter((item) => optKey(item) !== optKey(option)))}
                        className="p-1.5 rounded-lg text-sb-tx-3 hover:text-sb-lose hover:bg-sb-lose/10">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="number"
                min={MIN_AMOUNT}
                value={parlayAmount}
                onChange={(e) => setParlayAmount(e.target.value)}
                placeholder="Ticket amount"
                className="w-full h-11 rounded-xl bg-sb-s2 border border-sb-border px-3 text-sm text-sb-tx outline-none focus:border-sb-emerald-bd"
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-sb-border bg-sb-s2 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sb-tx-3">Total odds</p>
                  <p className="text-lg font-black text-sb-gold-2 tabular-nums">{parlay.length ? parlayOdds.toFixed(2) : "0.00"}x</p>
                </div>
                <div className="rounded-xl border border-sb-border bg-sb-s2 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sb-tx-3">Potential</p>
                  <p className="text-lg font-black text-sb-win tabular-nums">{fmt(parlayPayout)}</p>
                </div>
              </div>
              <button
                onClick={submitParlay}
                disabled={ticketBusy || parlay.length < 2 || Number(parlayAmount) < MIN_AMOUNT}
                className="w-full h-11 rounded-xl bg-sb-emerald text-white text-sm font-black disabled:opacity-50"
              >
                {ticketBusy ? <Loader2 size={16} className="mx-auto animate-spin" /> : "Submit Parlay Ticket"}
              </button>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

export default function BettingPage() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState("");

  const loadRaces = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await spectatorService.getRaces();
      setRaces((res.data || []).filter((race) => BET_STATUSES.includes(race.status)));
    } catch (e) {
      setError(e.message || "Unable to load race list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRaces(); }, [loadRaces]);

  return (
    <AdminLayout title="Betting">
      <div className="p-6 space-y-5">
        <section className="rounded-2xl border border-sb-border bg-sb-s1 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-sb-gold-soft border border-sb-gold-bd flex items-center justify-center">
                  <Trophy size={15} className="text-sb-gold-2" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-sb-tx-3">Spectator</span>
              </div>
              <h1 className="text-2xl font-black text-sb-tx">Betting</h1>
              <p className="text-sm text-sb-tx-3 mt-1">Place single bets or build a parlay ticket from races open for betting.</p>
            </div>
            <button onClick={loadRaces} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-sb-s2 border border-sb-border px-4 h-10 text-sm font-bold text-sb-tx-2 hover:text-sb-tx disabled:opacity-50">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Flag size={15} />} Refresh
            </button>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-sb-lose/30 bg-sb-lose/10 p-3 text-sm text-sb-lose">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-14"><Loader2 size={28} className="animate-spin text-sb-gold-2" /></div>
        ) : races.length === 0 ? (
          <div className="rounded-2xl border border-sb-border bg-sb-s1 py-16 text-center">
            <Trophy size={28} className="mx-auto mb-3 text-sb-tx-3" />
            <p className="text-sb-tx font-bold">No races are open for betting</p>
            <p className="text-sm text-sb-tx-3 mt-1">Only Registration Open races accept bets.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {races.map((race) => {
              const open = expanded === race.raceId;
              return (
                <section key={race.raceId} className="rounded-2xl border border-sb-border bg-sb-s1 overflow-hidden">
                  <button onClick={() => setExpanded(open ? null : race.raceId)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-sb-s2/60">
                    <div className="w-10 h-10 rounded-xl bg-sb-emerald-soft border border-sb-emerald-bd flex items-center justify-center text-sb-emerald-ink shrink-0">
                      <Flag size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-black text-sb-tx truncate">{race.raceName || "Race"}</h2>
                        <StatusBadge status={race.status} />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-sb-tx-3">
                        {(race.startTime || race.raceDate) && <span className="inline-flex items-center gap-1"><Calendar size={11} /> {new Date(race.startTime || race.raceDate).toLocaleString("vi-VN")}</span>}
                        {race.location && <span>{race.location}</span>}
                        {race.prizePool && <span className="font-bold text-sb-gold-2">{fmt(race.prizePool)} VND prize</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-xl bg-sb-gold-soft border border-sb-gold-bd px-3 py-1.5 text-xs font-black text-sb-gold-2">
                        {open ? "Close" : "Bet Now"}
                      </span>
                      {open ? <ChevronUp size={15} className="text-sb-tx-3" /> : <ChevronDown size={15} className="text-sb-tx-3" />}
                    </div>
                  </button>
                  {open && <RaceBetPanel race={race} onPlaced={() => {}} />}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
