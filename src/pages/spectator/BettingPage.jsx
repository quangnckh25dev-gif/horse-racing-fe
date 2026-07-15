import { useState, useEffect, useCallback } from "react";
import {
  Trophy, Clock, Zap, CheckCircle2, XCircle,
  Loader2, AlertCircle, ChevronDown, ChevronUp,
  DollarSign, History, Flag, X, Calendar,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import RaceReplay from "../../components/sb/RaceReplay";
import { spectatorService } from "../../services/spectator";
import { betService } from "../../services/bet";

const STATUS_CONFIG = {
  Scheduled:        { label: "Sắp diễn ra",  color: "bg-blue-500/20 text-blue-300 border-blue-500/40",       icon: Clock,        iconCls: "text-blue-400 bg-blue-500/10"    },
  RegistrationOpen: { label: "Mở đăng ký",   color: "bg-purple-500/20 text-purple-300 border-purple-500/40", icon: Calendar,     iconCls: "text-purple-400 bg-purple-500/10" },
  Ongoing:          { label: "Đang diễn ra", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", icon: Zap,          iconCls: "text-[#D4AF37] bg-[#D4AF37]/10"  },
  Finished:         { label: "Đã kết thúc",  color: "bg-green-500/20 text-green-300 border-green-500/40",    icon: CheckCircle2, iconCls: "text-green-400 bg-green-500/10"   },
  Cancelled:        { label: "Đã huỷ",       color: "bg-red-500/20 text-red-300 border-red-500/40",          icon: XCircle,      iconCls: "text-red-400 bg-red-500/10"       },
};

const BET_STATUS = {
  Pending:   { label: "Chờ kết quả", cls: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" },
  Won:       { label: "Thắng",       cls: "bg-green-500/20 text-green-300 border-green-500/40" },
  Lost:      { label: "Thua",        cls: "bg-red-500/20 text-red-300 border-red-500/40" },
  Cancelled: { label: "Hoàn tiền",   cls: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
};

// Races that accept bets (open or live)
const BET_STATUSES = ["Scheduled", "RegistrationOpen", "Ongoing"];

// Thứ tự hiển thị 4 loại cược (BE trả betType: WIN | PLACE | SHOW | EXACT)
const BET_TYPE_ORDER = ["WIN", "PLACE", "SHOW", "EXACT"];
const BET_TYPE_FALLBACK = {
  WIN:   "Về nhất",
  PLACE: "Vào top 2",
  SHOW:  "Vào top 3",
  EXACT: "Đúng hạng",
};

// BE trả 1 dòng cho mỗi (ngựa × loại cược × hạng đích) → cần key gộp cả 3
const optKey = (o) => `${o.entryId}-${o.betType}-${o.targetPosition ?? 0}`;

function RaceBetPanel({ race, onBetPlaced }) {
  const [options, setOptions]     = useState([]);
  const [myBets, setMyBets]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [betType, setBetType]     = useState("WIN");
  const [selected, setSelected]   = useState(null);
  const [amount, setAmount]       = useState("");
  const [placing, setPlacing]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [optRes, betRes] = await Promise.all([
          betService.getBetOptions(race.raceId),
          betService.getMyBetByRace(race.raceId),
        ]);
        if (!alive) return;
        setOptions(optRes.data || []);
        setMyBets(betRes.data || []);
      } catch {
        // silence — may not have bet yet or no options
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [race.raceId]);

  const handlePlace = async () => {
    if (!selected) { setError("Vui lòng chọn một kèo cược"); return; }
    const amt = Number(amount);
    if (!amt || amt < 10_000) { setError("Số tiền đặt cược tối thiểu 10,000 VNĐ"); return; }
    setPlacing(true); setError(""); setSuccess("");
    try {
      // BE tự tính odds — FE chỉ gửi kèo + số tiền
      await betService.placeBet(race.raceId, {
        entryId: selected.entryId,
        betType: selected.betType,
        targetPosition: selected.targetPosition ?? null,
        amount: amt,
      });
      setSuccess(`Đặt cược thành công! ${amt.toLocaleString("vi-VN")} VNĐ · ${selected.betTypeLabel || BET_TYPE_FALLBACK[selected.betType]} · ${selected.horseName || `#${selected.entryId}`}`);
      setSelected(null); setAmount("");
      const betRes = await betService.getMyBetByRace(race.raceId);
      setMyBets(betRes.data || []);
      onBetPlaced?.();
    } catch (e) {
      setError(e.message || "Đặt cược thất bại. Kiểm tra số dư ví.");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  // Các loại cược thực sự có kèo, sắp theo thứ tự chuẩn
  const availableTypes = BET_TYPE_ORDER.filter((t) => options.some((o) => o.betType === t));
  const activeType = availableTypes.includes(betType) ? betType : availableTypes[0];
  const shown = options.filter((o) => o.betType === activeType);

  return (
    <div className="p-5 border-t border-white/[0.06] space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-red-300 text-xs">
          <AlertCircle size={13} className="shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-950/30 border border-green-900/50 rounded-xl text-green-300 text-xs">
          <CheckCircle2 size={13} className="shrink-0" /> {success}
        </div>
      )}

      {/* Cược đã đặt — được đặt bao nhiêu vé tuỳ ý, miễn đủ tiền */}
      {myBets.length > 0 && (
        <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-4 space-y-2">
          <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">
            Vé cược của bạn ({myBets.length})
          </p>
          {myBets.map((bet) => (
            <div key={bet.betId} className="flex items-center justify-between flex-wrap gap-2 border-t border-[#D4AF37]/10 pt-2 first:border-0 first:pt-0">
              <div>
                <p className="text-white font-semibold text-sm">
                  {bet.horseName || `Ngựa #${bet.entryId}`}
                  <span className="ml-2 text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2 py-0.5 rounded-full">
                    {bet.betTypeLabel || BET_TYPE_FALLBACK[bet.betType] || bet.betType}
                    {bet.targetPosition ? ` · hạng ${bet.targetPosition}` : ""}
                  </span>
                </p>
                <p className="text-gray-500 text-xs">
                  {Number(bet.amount).toLocaleString("vi-VN")} VNĐ · Tỉ lệ {bet.odds ?? "—"}x
                  {bet.potentialPayout != null && ` · Thắng ${Number(bet.potentialPayout).toLocaleString("vi-VN")} VNĐ`}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${(BET_STATUS[bet.status] || BET_STATUS.Pending).cls}`}>
                {(BET_STATUS[bet.status] || BET_STATUS.Pending).label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Bet options */}
      {options.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">Chưa có lựa chọn cược cho vòng đua này</p>
      ) : (
        <>
          {/* Loại cược — kèo càng khó trúng, tỉ lệ ăn càng cao */}
          <div className="flex flex-wrap gap-1.5">
            {availableTypes.map((t) => {
              const label = options.find((o) => o.betType === t)?.betTypeLabel || BET_TYPE_FALLBACK[t] || t;
              return (
                <button
                  key={t}
                  onClick={() => { setBetType(t); setSelected(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    activeType === t
                      ? "bg-[#D4AF37] text-[#0A0E1A] border-[#D4AF37]"
                      : "bg-white/[0.02] text-gray-400 border-gray-800 hover:border-gray-600"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {shown.map((opt) => {
              const isOn = selected && optKey(selected) === optKey(opt);
              return (
                <button
                  key={optKey(opt)}
                  onClick={() => setSelected(opt)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    isOn ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-gray-800 bg-white/[0.02] hover:border-gray-600"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                    isOn ? "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40" : "bg-white/[0.04] text-gray-400 border-gray-700"
                  }`}>
                    {opt.laneNumber ?? "—"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${isOn ? "text-[#D4AF37]" : "text-white"}`}>
                      {opt.horseName || `Entry #${opt.entryId}`}
                    </p>
                    <p className="text-gray-500 text-xs truncate">
                      {opt.targetPosition ? `🎯 Về đúng hạng ${opt.targetPosition}` : opt.jockeyName ? `🏇 ${opt.jockeyName}` : ""}
                    </p>
                  </div>
                  {opt.odds != null && (
                    <span className="font-data text-xs font-bold text-[#D4AF37] shrink-0">{opt.odds}x</span>
                  )}
                </button>
              );
            })}
          </div>

          {selected && (
            <>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Số tiền cược (VNĐ)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 h-10 rounded-xl bg-[#0A0E1A]/80 border border-gray-700 text-white text-sm px-3 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] placeholder:text-gray-600"
                />
                <button
                  onClick={handlePlace}
                  disabled={placing || !amount}
                  className="px-5 h-10 rounded-xl bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold text-sm disabled:opacity-50 flex items-center gap-2 transition-colors shrink-0"
                >
                  {placing ? <Loader2 size={13} className="animate-spin" /> : <DollarSign size={13} />}
                  Đặt cược
                </button>
              </div>
              {amount && (
                <p className="text-gray-500 text-xs">
                  Tiềm năng thắng:{" "}
                  <span className="text-green-400 font-bold">
                    {(Number(amount) * (selected.odds ?? 1)).toLocaleString("vi-VN")} VNĐ
                  </span>
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function BettingPage() {
  const [tab, setTab]             = useState("races");
  const [races, setRaces]         = useState([]);
  const [racesLoading, setRacesLoading] = useState(true);
  const [expanded, setExpanded]   = useState(null);
  const [history, setHistory]     = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [error, setError]         = useState("");
  const [replay, setReplay]       = useState(null); // { raceName, results } cho màn Xem lại

  // Mở màn xem kết quả + replay cho trận đã cược
  const openReplay = async (bet) => {
    setReplay({ raceName: bet.raceName || `Race #${bet.raceId}`, results: null });
    try {
      const res = await spectatorService.getRaceResults(bet.raceId);
      const norm = (res.data || []).map((r) => ({ ...r, position: r.finishPosition ?? r.position }))
        .sort((a, b) => (a.position || 99) - (b.position || 99));
      setReplay({ raceName: bet.raceName || `Race #${bet.raceId}`, results: norm });
    } catch {
      setReplay({ raceName: bet.raceName || `Race #${bet.raceId}`, results: [] });
    }
  };

  const fetchRaces = useCallback(async () => {
    setRacesLoading(true); setError("");
    try {
      const res = await spectatorService.getRaces();
      const all = res.data || [];
      setRaces(all.filter((r) => BET_STATUSES.includes(r.status)));
    } catch (e) {
      setError(e.message || "Không thể tải danh sách vòng đua");
    } finally {
      setRacesLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const res = await betService.getBetHistory();
      setHistory(res.data || []);
    } catch (e) {
      setError(e.message || "Không thể tải lịch sử cược");
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => { fetchRaces(); }, [fetchRaces]);

  useEffect(() => {
    if (tab === "history") fetchHistory();
  }, [tab, fetchHistory]);

  const toggleRace = (raceId) =>
    setExpanded((prev) => (prev === raceId ? null : raceId));

  return (
    <AdminLayout title="Đặt cược">
      {/* Page Header */}
      <div className="page-header">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-[0.07] pointer-events-none select-none">🏆</div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
              <Trophy size={14} className="text-[#D4AF37]" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Khán giả</span>
          </div>
          <h1 className="text-2xl font-black text-white leading-tight">Đặt cược</h1>
          <p className="text-gray-500 text-sm mt-1">Chọn vòng đua và đặt cược yêu thích của bạn</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-300 text-sm">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: "races",   label: "Vòng đua", icon: Flag },
            { key: "history", label: "Lịch sử cược", icon: History },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === key
                  ? "bg-[#D4AF37] text-[#0A0E1A] shadow-[0_0_12px_rgba(212,175,55,0.3)]"
                  : "bg-white/[0.03] border border-gray-800/60 text-gray-400 hover:text-white"
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Races tab */}
        {tab === "races" && (
          <>
            {racesLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 shimmer rounded-xl" style={{ animationDelay: `${i * 60}ms` }} />
                ))}
              </div>
            ) : races.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/10 flex items-center justify-center mb-4 animate-float">
                  <Trophy size={24} className="text-[#D4AF37]/30" />
                </div>
                <p className="text-white font-semibold mb-1">Không có vòng đua nào đang mở cược</p>
                <p className="text-gray-500 text-sm">Chỉ vòng đua "Sắp diễn ra" hoặc "Đang diễn ra" mới có thể đặt cược</p>
              </div>
            ) : (
              <div className="space-y-3">
                {races.map((race, idx) => {
                  const cfg = STATUS_CONFIG[race.status] || STATUS_CONFIG.Cancelled;
                  const StatusIcon = cfg.icon;
                  const isOpen = expanded === race.raceId;

                  return (
                    <div
                      key={race.raceId}
                      className="glass-card rounded-2xl overflow-hidden animate-fade-in-up"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      {/* Race header row */}
                      <button
                        onClick={() => toggleRace(race.raceId)}
                        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.06] ${cfg.iconCls}`}>
                          <StatusIcon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-bold text-sm">{race.raceName}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {race.startTime && (
                              <span className="text-gray-500 text-xs flex items-center gap-1">
                                <Clock size={10} /> {new Date(race.startTime).toLocaleString("vi-VN")}
                              </span>
                            )}
                            {race.distance && (
                              <span className="text-gray-600 text-xs">📏 {race.distance}m</span>
                            )}
                            {race.prizePool && (
                              <span className="text-[#D4AF37] text-xs font-bold">
                                💰 {Number(race.prizePool).toLocaleString("vi-VN")} VNĐ
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                            isOpen
                              ? "bg-[#D4AF37] text-[#0A0E1A] border-[#D4AF37]"
                              : "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/20"
                          }`}>
                            {isOpen ? "Đóng" : "Đặt cược"}
                          </span>
                          {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                        </div>
                      </button>

                      {/* Bet panel (expanded) */}
                      {isOpen && (
                        <RaceBetPanel
                          race={race}
                          onBetPlaced={() => fetchHistory()}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* History tab */}
        {tab === "history" && (
          <>
            {histLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-[#D4AF37]" size={28} />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/10 flex items-center justify-center mb-4 animate-float">
                  <History size={24} className="text-[#D4AF37]/30" />
                </div>
                <p className="text-white font-semibold mb-1">Chưa có lịch sử cược</p>
                <p className="text-gray-500 text-sm">Đặt cược vào vòng đua để bắt đầu</p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 p-5 border-b border-white/[0.06]">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <History size={12} className="text-blue-400" />
                  </div>
                  <h3 className="font-bold text-sm text-white">Lịch sử cược</h3>
                  <span className="ml-auto text-xs text-gray-500">{history.length} lượt</span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {history.map((bet, i) => {
                    const st = BET_STATUS[bet.status] || BET_STATUS.Pending;
                    return (
                      <div key={bet.betId || i} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white text-sm font-semibold">{bet.raceName || `Race #${bet.raceId}`}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                          </div>
                          <p className="text-gray-500 text-xs mt-0.5">
                            🐴 {bet.horseName || `Entry #${bet.entryId}`}
                            {bet.odds != null ? ` · ${bet.odds}x` : ""}
                          </p>
                          {bet.createdAt && (
                            <p className="text-gray-600 text-xs mt-0.5">{new Date(bet.createdAt).toLocaleString("vi-VN")}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-data text-sm font-bold text-red-400">
                            -{Number(bet.amount).toLocaleString("vi-VN")} VNĐ
                          </p>
                          {bet.status === "Won" && bet.payout != null && (
                            <p className="font-data text-xs text-green-400 font-bold">
                              +{Number(bet.payout).toLocaleString("vi-VN")} VNĐ
                            </p>
                          )}
                        </div>
                        {/* Xem lại trận đã cược + kết quả */}
                        <button onClick={() => openReplay(bet)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sb-emerald text-white text-xs font-bold hover:opacity-90 transition-opacity shrink-0">
                          ▶ Xem kết quả
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {replay && (
        <RaceReplay
          raceName={replay.raceName}
          results={replay.results || []}
          onClose={() => setReplay(null)}
        />
      )}
    </AdminLayout>
  );
}
