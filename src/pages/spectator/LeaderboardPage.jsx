import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, Crown, Medal, RefreshCw, Star, Trophy } from "lucide-react";
import { leaderboardService } from "../../services/leaderboard";
import { SbAlert, SbEmpty, SbSpinner } from "../../components/sb/Feedback";
import { SbPageHeader, SbTable, SbTabs, SbTr } from "../../components/sb/Data";

const TABS = [
  { id: "jockey", label: "Top Jockeys" },
  { id: "horse", label: "Top Horses" },
];

const PODIUM = [
  {
    sourceIndex: 1,
    rank: 2,
    label: "Silver",
    icon: Medal,
    height: "sm:min-h-[210px]",
    shell: "border-slate-400/35 bg-slate-400/10",
    accent: "text-slate-200",
  },
  {
    sourceIndex: 0,
    rank: 1,
    label: "Gold",
    icon: Crown,
    height: "sm:min-h-[250px]",
    shell: "border-sb-gold-bd bg-sb-gold-soft shadow-[0_18px_60px_rgba(212,175,55,0.16)]",
    accent: "text-sb-gold-2",
  },
  {
    sourceIndex: 2,
    rank: 3,
    label: "Bronze",
    icon: Award,
    height: "sm:min-h-[190px]",
    shell: "border-amber-700/40 bg-amber-700/10",
    accent: "text-amber-300",
  },
];

const nameOf = (item) => item?.name ?? item?.jockeyName ?? item?.horseName ?? "Unknown";
const pointsOf = (item) => item?.points ?? item?.totalPoints ?? 0;
const rankOf = (item, index) => item?.rank ?? index + 1;

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("jockey");
  const [jockeys, setJockeys] = useState([]);
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [jockeyResponse, horseResponse] = await Promise.all([
        leaderboardService.getGlobalJockeyLeaderboard(),
        leaderboardService.getGlobalHorseLeaderboard(),
      ]);
      setJockeys(jockeyResponse.data || []);
      setHorses(horseResponse.data || []);
    } catch (err) {
      setError(err.message || "Unable to load leaderboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const data = activeTab === "jockey" ? jockeys : horses;
  const title = activeTab === "jockey" ? "Jockey Leaderboard" : "Horse Leaderboard";
  const podiumItems = useMemo(
    () => PODIUM.map((slot) => ({ ...slot, item: data[slot.sourceIndex] })).filter((slot) => slot.item),
    [data]
  );

  return (
    <>
      <SbPageHeader
        eyebrow="System-wide rankings"
        title="Leaderboard"
        icon={Trophy}
        stats={[`${data.length} ranked ${activeTab === "jockey" ? "jockeys" : "horses"}`]}
        actions={
          <button
            onClick={load}
            disabled={loading}
            className="flex h-10 items-center gap-2 rounded-xl border border-sb-border bg-sb-s2 px-3 text-sm text-sb-tx-2 transition-colors hover:text-sb-tx disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      <div className="max-w-6xl space-y-5 p-6">
        <SbTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {error && <SbAlert tone="error">{error}</SbAlert>}

        {loading ? (
          <SbSpinner />
        ) : data.length === 0 ? (
          <SbEmpty icon={<Trophy size={28} />} title="No leaderboard data yet" hint="Rankings will appear after race results are published." />
        ) : (
          <>
            <section className="rounded-2xl border border-sb-border bg-sb-s1/70 p-4 sm:p-6">
              <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-sb-gold-2">{title}</p>
                  <h2 className="text-xl font-black text-sb-tx">Podium Top 3</h2>
                </div>
                <p className="text-sm text-sb-tx-3">Gold is centered and highlighted for quick demo scanning.</p>
              </div>

              <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
                {podiumItems.map(({ item, rank, label, icon: Icon, height, shell, accent }, index) => (
                  <article
                    key={`${rank}-${item.entityId ?? nameOf(item)}`}
                    className={`relative overflow-hidden rounded-2xl border p-5 text-center ${height} ${shell}`}
                  >
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-current/30 bg-black/20">
                      <Icon size={28} className={accent} />
                    </div>
                    <div className={`mx-auto mb-3 inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-current/30 px-3 text-sm font-black ${accent}`}>
                      #{rank}
                    </div>
                    <p className="line-clamp-2 text-lg font-black text-sb-tx">{nameOf(item)}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-sb-tx-3">{label} rank</p>
                    <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                      <MiniStat label="Wins" value={item.totalWins ?? 0} tone="text-sb-emerald-ink" />
                      <MiniStat label="Top 3" value={item.totalPodiums ?? 0} tone="text-sb-tx-2" />
                      <MiniStat label="Points" value={pointsOf(item)} tone="text-sb-gold-2" />
                    </div>
                    {index === 1 && <Star className="absolute right-4 top-4 text-sb-gold-2/60" size={18} />}
                  </article>
                ))}
              </div>
            </section>

            <SbTable
              head={[
                { label: "Rank" },
                { label: activeTab === "jockey" ? "Jockey" : "Horse" },
                { label: "Wins", align: "center" },
                { label: "Top 3", align: "center" },
                { label: "Points", align: "center" },
                { label: "Races", align: "center" },
              ]}
            >
              {data.map((item, index) => (
                <SbTr key={item.entityId ?? `${nameOf(item)}-${index}`}>
                  <td className="w-20 px-5 py-3">
                    <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-sm font-black ${
                      index === 0
                        ? "border-sb-gold-bd bg-sb-gold-soft text-sb-gold-2"
                        : index === 1
                          ? "border-slate-400/30 bg-slate-400/10 text-slate-200"
                          : index === 2
                            ? "border-amber-700/30 bg-amber-700/10 text-amber-300"
                            : "border-sb-border bg-sb-s2 text-sb-tx-3"
                    }`}>
                      {rankOf(item, index)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-sb-tx">{nameOf(item)}</p>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-sm font-bold tabular-nums text-sb-emerald-ink">{item.totalWins ?? 0}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-sm tabular-nums text-sb-tx-2">{item.totalPodiums ?? 0}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-sm font-bold tabular-nums text-sb-gold-2">{pointsOf(item)}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-sm tabular-nums text-sb-tx-3">{item.totalRaces ?? 0}</span>
                  </td>
                </SbTr>
              ))}
            </SbTable>
          </>
        )}
      </div>
    </>
  );
}

function MiniStat({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-sb-border bg-black/15 px-2 py-2">
      <p className={`text-sm font-black tabular-nums ${tone}`}>{value}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-sb-tx-3">{label}</p>
    </div>
  );
}
