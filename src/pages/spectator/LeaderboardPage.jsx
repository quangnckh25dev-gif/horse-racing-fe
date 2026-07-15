import { useState, useEffect, useCallback } from "react";
import { Trophy, RefreshCw } from "lucide-react";
import { leaderboardService } from "../../services/leaderboard";
import { SbAlert, SbSpinner, SbEmpty } from "../../components/sb/Feedback";
import { SbTabs, SbTable, SbTr, SbPageHeader } from "../../components/sb/Data";

const TABS = [
  { id: "jockey", label: "Nài ngựa", emoji: "🏇" },
  { id: "horse",  label: "Ngựa đua", emoji: "🐴" },
];

const PODIUM = [
  { pos: 0, icon: "🥇", cls: "bg-sb-gold-soft border-sb-gold-bd",    text: "text-sb-gold-2" },
  { pos: 1, icon: "🥈", cls: "bg-sb-s2 border-sb-border-2",          text: "text-sb-tx" },
  { pos: 2, icon: "🥉", cls: "bg-sb-emerald-soft border-sb-emerald-bd", text: "text-sb-emerald-ink" },
];

// BE trả { rank, entityId, name, totalRaces, totalWins, totalPodiums, totalPrize, points }
const nameOf   = (it) => it.name ?? it.jockeyName ?? it.horseName ?? "—";
const pointsOf = (it) => it.points ?? it.totalPoints;

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
      const [jRes, hRes] = await Promise.all([
        leaderboardService.getGlobalJockeyLeaderboard(),
        leaderboardService.getGlobalHorseLeaderboard(),
      ]);
      setJockeys(jRes.data || []);
      setHorses(hRes.data || []);
    } catch (e) {
      setError(e.message || "Không thể tải bảng xếp hạng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const data = activeTab === "jockey" ? jockeys : horses;

  return (
    <>
      <SbPageHeader
        eyebrow="Toàn hệ thống"
        title="Bảng xếp hạng"
        icon={Trophy}
        stats={[`${data.length} ${activeTab === "jockey" ? "nài ngựa" : "ngựa đua"}`]}
        actions={
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-3 h-10 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx-2 hover:text-sb-tx text-sm transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Làm mới
          </button>
        }
      />

      <div className="p-6 space-y-5 max-w-4xl">
        <SbTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {error && <SbAlert tone="error">{error}</SbAlert>}

        {loading ? (
          <SbSpinner />
        ) : data.length === 0 ? (
          <SbEmpty icon="🏆" title="Chưa có dữ liệu xếp hạng"
            hint="Dữ liệu sẽ xuất hiện sau khi có kết quả đua được công bố" />
        ) : (
          <>
            {/* Top 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PODIUM.map(({ pos, icon, cls, text }) => {
                const item = data[pos];
                if (!item) return null;
                return (
                  <div key={pos} className={`rounded-2xl border p-5 text-center ${cls}`}>
                    <div className="text-4xl mb-2">{icon}</div>
                    <p className={`text-base font-black ${text}`}>{nameOf(item)}</p>
                    <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs text-sb-tx-3">
                        <span className="font-bold text-sb-tx tabular-nums">{item.totalWins ?? 0}</span> thắng
                      </span>
                      <span className="text-xs text-sb-tx-3">
                        <span className="font-bold text-sb-gold-2 tabular-nums">{pointsOf(item) ?? 0}</span> điểm
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bảng đầy đủ */}
            <SbTable
              head={[
                { label: "#" },
                { label: activeTab === "jockey" ? "Nài ngựa" : "Ngựa đua" },
                { label: "Thắng", align: "center" },
                { label: "Top 3", align: "center" },
                { label: "Điểm", align: "center" },
                { label: "Số cuộc", align: "center" },
              ]}
            >
              {data.map((item, idx) => (
                <SbTr key={item.entityId ?? idx}>
                  <td className="px-5 py-3 w-14">
                    {idx < 3
                      ? <span className="text-xl">{["🥇", "🥈", "🥉"][idx]}</span>
                      : <span className="text-sb-tx-3 font-bold text-sm tabular-nums">{item.rank ?? idx + 1}</span>}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sb-tx font-semibold text-sm">{nameOf(item)}</p>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-sb-emerald-ink font-bold text-sm tabular-nums">{item.totalWins ?? 0}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-sb-tx-2 text-sm tabular-nums">{item.totalPodiums ?? 0}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-sb-gold-2 font-bold text-sm tabular-nums">{pointsOf(item) ?? 0}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-sb-tx-3 text-sm tabular-nums">{item.totalRaces ?? 0}</span>
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
