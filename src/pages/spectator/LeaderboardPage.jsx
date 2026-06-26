import { useState, useEffect, useCallback } from "react";
import { Trophy, RefreshCw, Loader2, AlertCircle, BarChart2 } from "lucide-react";
import { leaderboardService } from "../../services/leaderboard";

const TABS = [
  { id: "jockey", label: "Nài ngựa", emoji: "🏇" },
  { id: "horse",  label: "Ngựa đua", emoji: "🐴" },
];

const PODIUM = [
  { pos: 0, icon: "🥇", bg: "from-amber-50 to-amber-50/50",  border: "border-amber-300", text: "text-amber-700" },
  { pos: 1, icon: "🥈", bg: "from-gray-50 to-gray-50/50",    border: "border-gray-300",  text: "text-gray-700" },
  { pos: 2, icon: "🥉", bg: "from-orange-50 to-orange-50/50",border: "border-orange-300",text: "text-orange-700" },
];

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
  const nameKey = activeTab === "jockey" ? "jockeyName" : "horseName";

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Trophy size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bảng xếp hạng</h1>
            <p className="text-gray-500 text-sm">Top nài ngựa và ngựa đua xuất sắc nhất hệ thống</p>
          </div>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200 w-fit mb-6">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === t.id
                ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            <span>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Trophy size={48} className="mb-4 opacity-30" />
          <p className="text-base font-semibold text-gray-500">Chưa có dữ liệu xếp hạng</p>
          <p className="text-sm mt-1 text-gray-400">Dữ liệu sẽ xuất hiện sau khi có kết quả đua</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Podium Top 3 */}
          {data.length >= 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PODIUM.map(({ pos, icon, bg, border, text }) => {
                const item = data[pos];
                if (!item) return null;
                return (
                  <div key={pos} className={`bg-gradient-to-br ${bg} border ${border} rounded-xl p-5 text-center animate-fade-in-up shadow-sm`}
                    style={{ animationDelay: `${pos * 80}ms` }}>
                    <div className="text-4xl mb-2">{icon}</div>
                    <p className={`text-base font-black ${text}`}>{item[nameKey] || item.name || `Hạng ${pos + 1}`}</p>
                    {item.ownerName && <p className="text-gray-500 text-xs mt-1">🏠 {item.ownerName}</p>}
                    <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
                      {item.totalWins !== undefined && (
                        <span className="text-xs text-gray-500"><span className="font-bold text-gray-800">{item.totalWins}</span> thắng</span>
                      )}
                      {item.totalPoints !== undefined && (
                        <span className="text-xs text-gray-500"><span className="font-bold text-amber-600">{item.totalPoints}</span> điểm</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full ranking table */}
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest w-14">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    {activeTab === "jockey" ? "Nài ngựa" : "Ngựa đua"}
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Chiến thắng</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Điểm</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Số cuộc</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr key={idx}
                    className={`border-b border-gray-100 transition-colors hover:bg-blue-50/40 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}>
                    <td className="px-4 py-3">
                      {idx < 3 ? (
                        <span className="text-xl">{["🥇","🥈","🥉"][idx]}</span>
                      ) : (
                        <span className="text-gray-500 font-bold text-sm">{idx + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 font-semibold text-sm">{item[nameKey] || item.name || "—"}</p>
                      {item.ownerName && <p className="text-gray-500 text-xs mt-0.5">Chủ: {item.ownerName}</p>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-amber-600 font-bold text-sm">{item.totalWins ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-700 text-sm">{item.totalPoints ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-500 text-sm">{item.totalRaces ?? "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
