import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Trophy, Users, XCircle } from "lucide-react";
import { spectatorService } from "../../services/spectator";
import { raceResultService } from "../../services/raceResult";

const DEFAULT_ROUNDS = [
  { roundOrder: 1, roundName: "Qualify" },
  { roundOrder: 2, roundName: "Semi Final" },
  { roundOrder: 3, roundName: "Final" },
];

const STATUS_STYLE = {
  Qualified: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd",
  Eliminated: "bg-sb-lose/10 text-sb-lose border-sb-lose/30",
  Finalist: "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd",
};

const normalize = (value) => String(value || "").trim().toLowerCase();

const sortByOrder = (items) =>
  [...items].sort((a, b) => Number(a.roundOrder || 99) - Number(b.roundOrder || 99));

function roundLabel(round) {
  const byOrder = DEFAULT_ROUNDS.find((item) => Number(item.roundOrder) === Number(round?.roundOrder));
  return byOrder?.roundName || round?.roundName || "Round";
}

function getRaceDate(race) {
  const value = race?.raceDate || race?.startTime;
  return value ? String(value).slice(0, 16).replace("T", " ") : "";
}

function raceStatusLabel(race) {
  const status = race?.status || "Draft";
  const roundOrder = Number(race?.roundOrder || 0);
  if (roundOrder > 1 && status === "RegistrationOpen") {
    return "Ready for Race";
  }
  if (status === "RegistrationOpen") return "Registration Open";
  return status;
}

function getResultForEntry(entry, results) {
  return results.find((result) => Number(result.entryId) === Number(entry.entryId));
}

function getEntryView(entry, results) {
  const result = getResultForEntry(entry, results);
  const roundStatus = entry.roundStatus || (result?.finishPosition ? "Qualified" : "");
  return {
    ...entry,
    result,
    position: result?.finishPosition ?? result?.position ?? null,
    finalTime: result?.finalTime,
    dnf: Boolean(result?.dnf),
    dq: Boolean(result?.dq),
    isEliminated: normalize(roundStatus) === "eliminated",
    isQualified: ["qualified", "finalist"].includes(normalize(roundStatus)),
    roundStatus,
  };
}

function HorseRow({ item, finalRound }) {
  const style = item.isEliminated
    ? STATUS_STYLE.Eliminated
    : item.isQualified
      ? STATUS_STYLE[item.roundStatus] || STATUS_STYLE.Qualified
      : "bg-sb-s2 text-sb-tx-3 border-sb-border";

  return (
    <div className="rounded-lg border border-sb-border bg-[#0d1117] p-2.5">
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 shrink-0 rounded-full border flex items-center justify-center text-xs font-black ${
          item.position === 1 ? "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd" : "bg-sb-s2 text-sb-tx-3 border-sb-border"
        }`}>
          {item.position || "-"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-sb-tx">{item.horseName || `Horse #${item.horseId}`}</p>
          <p className="truncate text-[11px] text-sb-tx-3">
            {item.jockeyName ? `Jockey: ${item.jockeyName}` : "No jockey"}
            {item.finalTime ? ` - ${item.finalTime}` : ""}
          </p>
        </div>
        {item.roundStatus && (
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${style}`}>
            {finalRound && item.roundStatus === "Finalist" ? "Final" : item.roundStatus}
          </span>
        )}
      </div>
      {item.isEliminated && item.eliminationReason && (
        <p className="mt-1.5 text-[11px] text-sb-lose">{item.eliminationReason}</p>
      )}
      {(item.dq || item.dnf) && (
        <p className="mt-1.5 text-[11px] font-semibold text-sb-lose">
          {item.dq ? "Disqualified" : "Did not finish"}
        </p>
      )}
    </div>
  );
}

function RaceCard({ race, entries = [], results = [], loading }) {
  const finalRound = Number(race.roundOrder || 0) === 3 || normalize(race.roundName) === "final";
  const views = entries
    .map((entry) => getEntryView(entry, results))
    .sort((a, b) => {
      const ap = a.position ?? 999;
      const bp = b.position ?? 999;
      if (ap !== bp) return ap - bp;
      if (a.isEliminated !== b.isEliminated) return a.isEliminated ? 1 : -1;
      return Number(a.entryId || 0) - Number(b.entryId || 0);
    });
  const qualified = views.filter((entry) => entry.isQualified && !entry.isEliminated).length;
  const eliminated = views.filter((entry) => entry.isEliminated).length;

  return (
    <div className="rounded-xl border border-sb-border bg-sb-s2 p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-sb-tx">{race.raceName || "Race"}</p>
          <p className="text-xs text-sb-tx-3">{getRaceDate(race) || "No race date"}</p>
        </div>
        <span className="rounded-full border border-sb-border bg-[#0d1117] px-2 py-0.5 text-[10px] font-bold text-sb-tx-3">
          {raceStatusLabel(race)}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-sb-tx-3">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : views.length === 0 ? (
        <div className="rounded-lg border border-dashed border-sb-border p-4 text-center text-xs text-sb-tx-3">
          No horses in this race yet.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-sb-border bg-[#0d1117] p-2">
              <p className="text-base font-black text-sb-tx">{views.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-sb-tx-3">Horses</p>
            </div>
            <div className="rounded-lg border border-sb-emerald-bd bg-sb-emerald-soft p-2">
              <p className="text-base font-black text-sb-emerald-ink">{qualified}</p>
              <p className="text-[10px] uppercase tracking-wider text-sb-emerald-ink">Qualified</p>
            </div>
            <div className="rounded-lg border border-sb-lose/30 bg-sb-lose/10 p-2">
              <p className="text-base font-black text-sb-lose">{eliminated}</p>
              <p className="text-[10px] uppercase tracking-wider text-sb-lose">Eliminated</p>
            </div>
          </div>
          {views.map((entry) => (
            <HorseRow key={entry.entryId} item={entry} finalRound={finalRound} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TournamentBracket({ tournament, rounds = [], races = [], compact = false }) {
  const [raceData, setRaceData] = useState({});

  const orderedRounds = useMemo(() => {
    const source = rounds.length ? rounds : DEFAULT_ROUNDS;
    return sortByOrder(source);
  }, [rounds]);

  useEffect(() => {
    let alive = true;
    const raceIds = races.map((race) => race.raceId).filter(Boolean);
    if (raceIds.length === 0) {
      setRaceData({});
      return undefined;
    }

    setRaceData((prev) => {
      const next = { ...prev };
      raceIds.forEach((id) => {
        if (!next[id]) next[id] = { loading: true, entries: [], results: [] };
      });
      return next;
    });

    Promise.all(
      raceIds.map(async (raceId) => {
        try {
          const [entriesRes, resultsRes] = await Promise.all([
            spectatorService.getRaceEntries(raceId).catch(() => ({ data: [] })),
            raceResultService.getResults(raceId).catch(() => ({ data: [] })),
          ]);
          return [raceId, { loading: false, entries: entriesRes.data || [], results: resultsRes.data || [] }];
        } catch {
          return [raceId, { loading: false, entries: [], results: [] }];
        }
      })
    ).then((pairs) => {
      if (!alive) return;
      setRaceData((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
    });

    return () => { alive = false; };
  }, [races]);

  const totalHorses = Object.values(raceData).reduce((sum, data) => sum + (data.entries?.length || 0), 0);
  const totalEliminated = Object.values(raceData).reduce(
    (sum, data) => sum + (data.entries || []).filter((entry) => normalize(entry.roundStatus) === "eliminated").length,
    0
  );

  return (
    <section className={`rounded-2xl border border-sb-border bg-sb-s1 ${compact ? "p-3" : "p-5"}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-[#D4AF37]" />
            <h3 className="text-sm font-black text-sb-tx">Tournament Progress</h3>
          </div>
          <p className="mt-1 text-xs text-sb-tx-3">
            {tournament?.tournamentName || "Tournament"} - Qualify to Semi Final to Final
          </p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-sb-border bg-sb-s2 px-2.5 py-1 text-xs text-sb-tx-3">
            <Users size={12} /> {totalHorses} horses
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-sb-lose/30 bg-sb-lose/10 px-2.5 py-1 text-xs text-sb-lose">
            <XCircle size={12} /> {totalEliminated} eliminated
          </span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {orderedRounds.map((round) => {
          const roundRaces = races
            .filter((race) => String(race.roundId || "") === String(round.roundId || ""))
            .map((race) => ({ ...race, roundOrder: round.roundOrder, roundName: roundLabel(round) }));
          return (
            <div key={round.roundId || round.roundOrder} className="rounded-xl border border-sb-border bg-[#0d1117] p-3">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-sb-gold-bd bg-sb-gold-soft text-xs font-black text-sb-gold-2">
                  {round.roundOrder}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-sb-tx">{roundLabel(round)}</p>
                  <p className="text-[11px] text-sb-tx-3">
                    {Number(round.roundOrder) === 3 ? "Final ranking" : "Bottom 1/4 eliminated after publish"}
                  </p>
                </div>
              </div>
              {roundRaces.length === 0 ? (
                <div className="rounded-xl border border-dashed border-sb-border p-5 text-center">
                  <CheckCircle2 size={18} className="mx-auto mb-2 text-sb-tx-3" />
                  <p className="text-xs text-sb-tx-3">No race assigned to this round.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {roundRaces.map((race) => (
                    <RaceCard
                      key={race.raceId}
                      race={race}
                      entries={raceData[race.raceId]?.entries}
                      results={raceData[race.raceId]?.results}
                      loading={raceData[race.raceId]?.loading}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
