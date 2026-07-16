import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, AlertCircle, Loader2, RefreshCw,
  Star, Trophy, Eye, Clock, Search,
  Zap, CheckCircle2, XCircle, X, Users,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import RaceReplay from "../../components/sb/RaceReplay";
import { spectatorService } from "../../services/spectator";

const STATUS_CONFIG = {
  Scheduled:        {
    label: "Sắp diễn ra",  shortLabel: "SẮP",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/40 badge-glow-blue",
    borderCls: "border-l-blue-glow",
    cardBg: "from-blue-500/[0.06] to-transparent",
    icon: Clock, iconCls: "text-blue-400 bg-blue-500/10",
  },
  RegistrationOpen: {
    label: "Mở đăng ký",   shortLabel: "REG",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    borderCls: "border-l-purple-glow",
    cardBg: "from-purple-500/[0.06] to-transparent",
    icon: Calendar, iconCls: "text-purple-400 bg-purple-500/10",
  },
  Ongoing: {
    label: "Đang diễn ra", shortLabel: "LIVE",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 badge-glow-yellow",
    borderCls: "border-l-gold-glow",
    cardBg: "from-yellow-500/[0.07] to-transparent",
    icon: Zap, iconCls: "text-[#D4AF37] bg-[#D4AF37]/10",
  },
  Finished:   {
    label: "Đã kết thúc",  shortLabel: "KT",
    color: "bg-green-500/20 text-green-300 border-green-500/40 badge-glow-green",
    borderCls: "border-l-green-glow",
    cardBg: "from-green-500/[0.05] to-transparent",
    icon: CheckCircle2, iconCls: "text-green-400 bg-green-500/10",
  },
  Cancelled:  {
    label: "Đã huỷ",       shortLabel: "HUỶ",
    color: "bg-red-500/20 text-red-300 border-red-500/40",
    borderCls: "border-l-red-glow",
    cardBg: "from-red-500/[0.04] to-transparent",
    icon: XCircle, iconCls: "text-red-400 bg-red-500/10",
  },
};

const FILTER_TABS = [
  { key: "all",              label: "Tất cả",       icon: null },
  { key: "Scheduled",        label: "Sắp diễn ra",  icon: Clock },
  { key: "RegistrationOpen", label: "Mở đăng ký",   icon: Calendar },
  { key: "Ongoing",          label: "Đang diễn ra", icon: Zap },
  { key: "Finished",         label: "Đã kết thúc",  icon: CheckCircle2 },
];

export default function RaceSchedulePage() {
  const navigate = useNavigate();
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(null);
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);

  const openResults = useCallback(async (race) => {
    setShowResults(race);
    setResultsLoading(true);
    setResults([]);
    try {
      const res = await spectatorService.getRaceResults(race.raceId);
      // BE trả finishPosition (finalTime = finishTime + penaltyTime); DQ/DNF về cuối
      const norm = (r) => ({ ...r, position: r.finishPosition ?? r.position });
      setResults((res.data || []).map(norm).sort((a, b) => (a.position || 99) - (b.position || 99)));
    } catch {
      setResults([]);
    } finally {
      setResultsLoading(false);
    }
  }, []);

  const fetchRaces = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await spectatorService.getRaces();
      setRaces(res.data || []);
    } catch (e) {
      setError(e.message || "Không thể tải lịch thi đấu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRaces(); }, [fetchRaces]);

  const filtered = races.filter((r) => {
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchSearch = !search || r.raceName?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    all:              races.length,
    Scheduled:        races.filter((r) => r.status === "Scheduled").length,
    RegistrationOpen: races.filter((r) => r.status === "RegistrationOpen").length,
    Ongoing:          races.filter((r) => r.status === "Ongoing").length,
    Finished:         races.filter((r) => r.status === "Finished").length,
    Cancelled:        races.filter((r) => r.status === "Cancelled").length,
  };

  return (
    <AdminLayout title="Lịch thi đấu">

      {/* ── Page Header Banner ── */}
      <div className="page-header">
        <div className="absolute right-0 top-0 w-72 h-full bg-gradient-to-l from-[#D4AF37]/[0.04] to-transparent pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                <Calendar size={14} className="text-[#D4AF37]" />
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Khán giả</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Lịch thi đấu</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="stat-pill"><span className="text-white font-bold">{races.length}</span> vòng đua</span>
              {counts.Ongoing > 0 && (
                <span className="stat-pill text-yellow-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot inline-block" /> {counts.Ongoing} ĐANG LIVE
                </span>
              )}
              {(counts.Scheduled + counts.RegistrationOpen) > 0 && <span className="stat-pill text-blue-400">{counts.Scheduled + counts.RegistrationOpen} sắp tới</span>}
            </div>
          </div>
          <button onClick={fetchRaces}
            className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-gray-700/60 rounded-xl text-gray-400 hover:text-white text-sm transition-all shrink-0">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* ── Mini stat strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { key: "Scheduled",        label: "Sắp diễn ra",  num: counts.Scheduled,        cls: "text-blue-400",    border: "border-blue-500/20",    bg: "bg-blue-500/5",    icon: Clock },
            { key: "RegistrationOpen", label: "Mở đăng ký",   num: counts.RegistrationOpen, cls: "text-purple-400",  border: "border-purple-500/20",  bg: "bg-purple-500/5",  icon: Calendar },
            { key: "Ongoing",          label: "Đang diễn ra", num: counts.Ongoing,          cls: "text-[#D4AF37] neon-gold", border: "border-[#D4AF37]/25", bg: "bg-[#D4AF37]/5", icon: Zap },
            { key: "Finished",         label: "Đã kết thúc",  num: counts.Finished,         cls: "text-green-400",   border: "border-green-500/20",   bg: "bg-green-500/5",   icon: CheckCircle2 },
            { key: "Cancelled",        label: "Đã huỷ",       num: counts.Cancelled,        cls: "text-red-400",     border: "border-red-500/20",     bg: "bg-red-500/5",     icon: XCircle },
          ].map(({ key, label, num, cls, border, bg, icon: Icon }) => (
            <button key={key} onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left card-hover ${
                filterStatus === key ? `${border} ${bg}` : "border-gray-800/60 bg-[#0d1117]/80 hover:border-gray-700"
              }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg} ${border} border`}>
                <Icon size={14} className={cls} />
              </div>
              <div>
                <p className={`text-xl font-black leading-none ${cls}`}>{num}</p>
                <p className="text-gray-600 text-[10px] mt-0.5 uppercase tracking-wider">{label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Search & Filter ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm vòng đua..."
              className="w-full bg-[#0d1117] border border-gray-800/60 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#D4AF37]/40 transition-all" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTER_TABS.map(({ key, label, icon: TabIcon }) => (
              <button key={key} onClick={() => setFilterStatus(key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === key
                    ? "bg-[#D4AF37] text-[#0A0E1A] shadow-[0_0_12px_rgba(212,175,55,0.3)]"
                    : "bg-white/[0.03] border border-gray-800/60 text-gray-400 hover:text-white"
                }`}>
                {TabIcon && <TabIcon size={11} />} {label}
                {counts[key] > 0 && <span className="text-[10px] font-bold bg-black/20 px-1.5 py-0.5 rounded-full">{counts[key]}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-300 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* ── Race list ── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 shimmer rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/10 flex items-center justify-center mb-4 animate-float">
              <Calendar size={24} className="text-[#D4AF37]/30" />
            </div>
            <p className="text-white font-semibold mb-1">Không tìm thấy vòng đua nào</p>
            <p className="text-gray-500 text-sm">{search ? `Không có kết quả cho "${search}"` : "Chưa có vòng đua nào"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((race, idx) => {
              const cfg = STATUS_CONFIG[race.status] || STATUS_CONFIG.Cancelled;
              const StatusIcon = cfg.icon;
              const isLive = race.status === "Ongoing";

              return (
                <div
                  key={race.raceId}
                  className={`group relative bg-[#0d1117] border border-gray-800/60 rounded-xl overflow-hidden card-hover ${cfg.borderCls} animate-fade-in-up`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Subtle bg gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${cfg.cardBg} pointer-events-none`} />

                  <div className="relative p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Status icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconCls} border border-white/[0.06]`}>
                      {isLive
                        ? <span className="w-3 h-3 rounded-full bg-yellow-400 live-dot" />
                        : <StatusIcon size={17} />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                        <h3 className="text-white font-bold text-base leading-tight">{race.raceName}</h3>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${cfg.color}`}>
                          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot" />}
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {race.startTime && (
                          <span className="flex items-center gap-1 text-gray-500 text-xs">
                            <Calendar size={10} /> {new Date(race.startTime).toLocaleString("vi-VN")}
                          </span>
                        )}
                        {race.distance && <span className="stat-pill">📏 {race.distance}m</span>}
                        {race.prizePool && (
                          <span className="text-xs font-bold text-[#D4AF37] neon-gold">
                            💰 {Number(race.prizePool).toLocaleString("vi-VN")} VNĐ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {(race.status === "Scheduled" || race.status === "RegistrationOpen") && (
                        <button onClick={() => navigate("/spectator/betting")}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/20 rounded-xl text-xs font-semibold transition-all">
                          <Star size={11} /> Đặt cược
                        </button>
                      )}
                      {race.status === "Ongoing" && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-xl text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot" /> ĐANG LIVE
                        </span>
                      )}
                      {race.status === "Finished" && (
                        <button onClick={() => openResults(race)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/15 border border-green-600/30 text-green-300 hover:bg-green-600/25 rounded-xl text-xs font-semibold transition-all">
                          <Trophy size={11} /> Kết quả
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* ── Results Modal ── */}
      {showResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div className="bg-[#0d1117] border border-gray-800/60 rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in max-h-[85vh] flex flex-col">
            <div className="h-0.5 w-full rounded-t-2xl bg-gradient-to-r from-green-400 to-transparent" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60 shrink-0">
              <div>
                <h3 className="text-white font-bold">{showResults.raceName}</h3>
                <p className="text-gray-500 text-xs mt-0.5">Kết quả chính thức</p>
              </div>
              <div className="flex items-center gap-2">
                {results.length > 0 && (
                  <button onClick={() => setReplayOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sb-emerald text-white text-xs font-bold hover:opacity-90 transition-opacity">
                    ▶ Xem lại đường đua
                  </button>
                )}
                <button onClick={() => setShowResults(null)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              {resultsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="animate-spin text-[#D4AF37]" size={28} />
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Trophy size={28} className="text-gray-600 mb-3" />
                  <p className="text-gray-400 text-sm">Kết quả chưa được công bố</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Podium top 3 */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { pos: 1, icon: "🥇", cls: "text-[#D4AF37] neon-gold", border: "border-[#D4AF37]/30", bg: "from-[#D4AF37]/15 to-[#D4AF37]/5" },
                      { pos: 2, icon: "🥈", cls: "text-gray-300",            border: "border-gray-400/30",   bg: "from-gray-400/15 to-gray-400/5" },
                      { pos: 3, icon: "🥉", cls: "text-amber-500",           border: "border-amber-700/30",  bg: "from-amber-700/15 to-amber-700/5" },
                    ].map(({ pos, icon, cls, border, bg }) => {
                      const r = results.find((x) => x.position === pos);
                      if (!r) return null;
                      return (
                        <div key={pos} className={`bg-gradient-to-br ${bg} border ${border} rounded-xl p-3 text-center`}>
                          <div className="text-2xl mb-1">{icon}</div>
                          <p className={`text-sm font-bold leading-tight ${cls}`}>{r.horseName || `#${r.horseId}`}</p>
                          <p className="text-gray-500 text-[10px] mt-0.5">🏇 {r.jockeyName || "—"}</p>
                          {r.finishTime && <p className="text-gray-400 text-[10px]">⏱ {r.finishTime}</p>}
                        </div>
                      );
                    })}
                  </div>
                  {/* Full list */}
                  {results.map((r) => (
                    <div key={r.resultId || r.entryId}
                      className="flex items-center gap-3 bg-white/[0.02] border border-gray-800/60 rounded-xl p-3.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 border ${
                        r.position === 1 ? "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30" :
                        r.position === 2 ? "bg-gray-400/20 text-gray-300 border-gray-400/30" :
                        r.position === 3 ? "bg-amber-700/20 text-amber-500 border-amber-700/30" :
                        "bg-white/[0.03] text-gray-500 border-gray-700/40"
                      }`}>{r.position ?? "—"}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm">{r.horseName || `Ngựa #${r.horseId}`}</p>
                        <p className="text-gray-500 text-xs">🏇 {r.jockeyName || "—"}{r.finishTime ? ` · ⏱ ${r.finishTime}` : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {replayOpen && showResults && (
        <RaceReplay
          raceName={showResults.raceName}
          results={results}
          onClose={() => setReplayOpen(false)}
        />
      )}
    </AdminLayout>
  );
}
