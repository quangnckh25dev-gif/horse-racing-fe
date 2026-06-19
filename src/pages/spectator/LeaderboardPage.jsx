import { useState, useEffect, useCallback } from "react";
import { Trophy, Users, RefreshCw, Loader2, AlertCircle, BarChart2 } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { leaderboardService } from "../../services/leaderboard";

const TABS = [
  { id: "jockey", label: "Nài ngựa", emoji: "🏇" },
  { id: "horse",  label: "Ngựa đua", emoji: "🐴" },
];

const PODIUM = [
  { pos: 0, icon: "🥇", bg: "from-[#D4AF37]/20 to-[#D4AF37]/5", border: "border-[#D4AF37]/40", text: "text-[#D4AF37] neon-gold" },
  { pos: 1, icon: "🥈", bg: "from-gray-400/15 to-gray-400/5",   border: "border-gray-400/30",   text: "text-gray-300" },
  { pos: 2, icon: "🥉", bg: "from-amber-700/15 to-amber-700/5", border: "border-amber-700/30",  text: "text-amber-500" },
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
    <AdminLayout title="Bảng xếp hạng">
      <div className="p-6 max-w-4xl mx-auto">

        {/* ── Page Header ── */}
        <div className="page-header mb-6">
          <div className="absolute right-0 top-0 w-72 h-full bg-gradient-to-l from-[#D4AF37]/[0.04] to-transparent pointer-events-none" />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-6xl opacity-[0.08] select-none pointer-events-none animate-float">🏆</div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                <BarChart2 size={14} className="text-[#D4AF37]" />
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Xếp hạng toàn cầu</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Bảng xếp hạng</h1>
            <p className="text-gray-500 text-sm mt-1">Top nài ngựa và ngựa đua xuất sắc nhất hệ thống</p>
          </div>
        </div>

        {/* ── Tabs + Refresh ── */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex bg-[#111827] rounded-xl p-1 border border-gray-800/60">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === t.id
                    ? "bg-[#D4AF37] text-[#0A0E1A] shadow-[0_0_14px_rgba(212,175,55,0.25)]"
                    : "text-gray-400 hover:text-white"
                }`}>
                <span>{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all text-sm">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-red-950/50 border border-red-900 text-red-200 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <Trophy size={48} className="mb-4 opacity-20" />
            <p className="text-base font-semibold text-gray-400">Chưa có dữ liệu xếp hạng</p>
            <p className="text-sm mt-1">Dữ liệu sẽ xuất hiện sau khi có kết quả đua</p>
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
                    <div key={pos} className={`bg-gradient-to-br ${bg} border ${border} rounded-xl p-5 text-center animate-fade-in-up`}
                      style={{ animationDelay: `${pos * 80}ms` }}>
                      <div className="text-4xl mb-2">{icon}</div>
                      <p className={`text-base font-black ${text}`}>{item[nameKey] || item.name || `Hạng ${pos + 1}`}</p>
                      {item.ownerName && <p className="text-gray-500 text-xs mt-1">🏠 {item.ownerName}</p>}
                      <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
                        {item.totalWins !== undefined && (
                          <span className="text-xs text-gray-400"><span className="font-bold text-white">{item.totalWins}</span> thắng</span>
                        )}
                        {item.totalPoints !== undefined && (
                          <span className="text-xs text-gray-400"><span className="font-bold text-[#D4AF37]">{item.totalPoints}</span> điểm</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full ranking table */}
            <div className="rounded-xl border border-gray-800/60 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#111827] border-b border-gray-800/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest w-14">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                      {activeTab === "jockey" ? "Nài ngựa" : "Ngựa đua"}
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Chiến thắng</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Điểm</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Số cuộc</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, idx) => (
                    <tr key={idx}
                      className={`border-b border-gray-800/40 transition-colors hover:bg-[#111827]/60 ${
                        idx % 2 === 0 ? "bg-[#0A0E1A]/60" : "bg-[#0d1220]/60"
                      }`}>
                      <td className="px-4 py-3">
                        {idx < 3 ? (
                          <span className="text-xl">{["🥇","🥈","🥉"][idx]}</span>
                        ) : (
                          <span className="text-gray-500 font-bold text-sm">{idx + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white font-semibold text-sm">{item[nameKey] || item.name || "—"}</p>
                        {item.ownerName && <p className="text-gray-500 text-xs mt-0.5">Chủ: {item.ownerName}</p>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[#D4AF37] font-bold text-sm">{item.totalWins ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-gray-300 text-sm">{item.totalPoints ?? "—"}</span>
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
    </AdminLayout>
  );
}
