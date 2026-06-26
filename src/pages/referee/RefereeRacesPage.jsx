import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flag, AlertCircle, RefreshCw, Eye, Calendar,
  Clock, Zap, CheckCircle2, ClipboardList,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { spectatorService } from "../../services/spectator";

const STATUS_CONFIG = {
  Scheduled:        { label: "Sắp diễn ra",  color: "bg-blue-500/20 text-blue-300 border-blue-500/40 badge-glow-blue",       borderCls: "border-l-blue-glow",   icon: Clock,        iconCls: "text-blue-400 bg-blue-500/10"    },
  RegistrationOpen: { label: "Mở đăng ký",   color: "bg-purple-500/20 text-purple-300 border-purple-500/40",                 borderCls: "border-l-purple-glow", icon: Calendar,     iconCls: "text-purple-400 bg-purple-500/10" },
  Ongoing:          { label: "Đang diễn ra", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 badge-glow-yellow", borderCls: "border-l-gold-glow",   icon: Zap,          iconCls: "text-[#D4AF37] bg-[#D4AF37]/10"  },
  Finished:         { label: "Đã kết thúc",  color: "bg-green-500/20 text-green-300 border-green-500/40 badge-glow-green",   borderCls: "border-l-green-glow",  icon: CheckCircle2, iconCls: "text-green-400 bg-green-500/10"   },
  Cancelled:        { label: "Đã huỷ",       color: "bg-red-500/20 text-red-300 border-red-500/40",                          borderCls: "border-l-red-glow",    icon: Flag,         iconCls: "text-red-400 bg-red-500/10"       },
};

export default function RefereeRacesPage() {
  const navigate = useNavigate();
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchRaces = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await spectatorService.getRaces();
      setRaces(res.data || []);
    } catch (e) {
      setError(e.message || "Không thể tải vòng đua");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRaces(); }, [fetchRaces]);

  const filtered = filterStatus === "all" ? races : races.filter((r) => r.status === filterStatus);

  const counts = {
    Scheduled:        races.filter((r) => r.status === "Scheduled").length,
    RegistrationOpen: races.filter((r) => r.status === "RegistrationOpen").length,
    Ongoing:          races.filter((r) => r.status === "Ongoing").length,
    Finished:         races.filter((r) => r.status === "Finished").length,
  };

  return (
    <AdminLayout title="Vòng đua của tôi">

      {/* ── Page Header Banner ── */}
      <div className="page-header">
        <div className="absolute right-0 top-0 w-72 h-full bg-gradient-to-l from-yellow-500/[0.04] to-transparent pointer-events-none" />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-6xl opacity-[0.08] select-none pointer-events-none animate-float">⚖️</div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <ClipboardList size={14} className="text-yellow-400" />
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trọng tài</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Vòng đua của tôi</h1>
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
        {/* ── Filter ── */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all",              label: "Tất cả", count: races.length },
            { key: "Scheduled",        count: counts.Scheduled },
            { key: "RegistrationOpen", count: counts.RegistrationOpen },
            { key: "Ongoing",          count: counts.Ongoing },
            { key: "Finished",         count: counts.Finished },
          ].map(({ key, label, count }) => {
            const cfg = STATUS_CONFIG[key];
            const isActive = filterStatus === key;
            return (
              <button key={key} onClick={() => setFilterStatus(key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive ? "bg-[#D4AF37] text-[#0A0E1A] shadow-[0_0_12px_rgba(212,175,55,0.3)]"
                    : "bg-white/[0.03] border border-gray-800/60 text-gray-400 hover:text-white"
                }`}>
                {label || cfg?.label || key}
                {count > 0 && <span className="text-[10px] font-bold bg-black/20 px-1.5 py-0.5 rounded-full">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-300 text-sm">
            <AlertCircle size={15} className="shrink-0" /> {error}
          </div>
        )}

        {/* ── List ── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-24 shimmer rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 flex items-center justify-center mb-4 animate-float">
              <Flag size={24} className="text-yellow-500/30" />
            </div>
            <p className="text-white font-semibold mb-1">Không có vòng đua nào</p>
            <p className="text-gray-500 text-sm">Bạn chưa được phân công vào vòng đua nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((race, idx) => {
              const cfg = STATUS_CONFIG[race.status] || { label: race.status, color: "bg-gray-500/20 text-gray-400 border-gray-500/40", borderCls: "border-l-gray-glow", icon: Flag, iconCls: "text-gray-400 bg-white/5" };
              const StatusIcon = cfg.icon;
              const isLive = race.status === "Ongoing";

              return (
                <div
                  key={race.raceId}
                  className={`group relative bg-[#0d1117] border border-gray-800/60 rounded-xl overflow-hidden card-hover ${cfg.borderCls} animate-fade-in-up`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Status icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.06] ${cfg.iconCls}`}>
                      {isLive
                        ? <span className="w-3 h-3 rounded-full bg-yellow-400 live-dot" />
                        : <StatusIcon size={17} />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                        <h3 className="text-white font-bold text-base">{race.raceName}</h3>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${cfg.color}`}>
                          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot" />}
                          {cfg.label}
                        </span>
                        {race.refereeRole && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/25 font-semibold">
                            {race.refereeRole}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {race.startTime && (
                          <span className="flex items-center gap-1 text-gray-500 text-xs">
                            <Calendar size={10} /> {new Date(race.startTime).toLocaleString("vi-VN")}
                          </span>
                        )}
                        {race.distance && <span className="stat-pill">📏 {race.distance}m</span>}
                      </div>
                    </div>

                    {/* Action */}
                    <button onClick={() => navigate(`/referee/races/${race.raceId}`)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${
                        isLive
                          ? "bg-[#D4AF37] text-[#0A0E1A] btn-gold-glow"
                          : "bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] hover:bg-[#D4AF37]/20"
                      }`}>
                      <Eye size={14} /> {isLive ? "Nhập liệu ngay" : "Vào nhập liệu"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
