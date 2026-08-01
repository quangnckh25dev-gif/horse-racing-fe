import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flag, AlertCircle, RefreshCw, Eye, Calendar,
  Zap, CheckCircle2, ClipboardList, ShieldCheck,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { spectatorService } from "../../services/spectator";

const STATUS_CONFIG = {
  RegistrationOpen: { label: "Registration Open", color: "bg-purple-500/20 text-purple-300 border-purple-500/40", borderCls: "border-l-purple-glow", icon: Calendar, iconCls: "text-purple-400 bg-purple-500/10" },
  Ongoing: { label: "Ongoing", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 badge-glow-yellow", borderCls: "border-l-gold-glow", icon: Zap, iconCls: "text-[#D4AF37] bg-[#D4AF37]/10" },
  Finished: { label: "Finished", color: "bg-green-500/20 text-green-300 border-green-500/40 badge-glow-green", borderCls: "border-l-green-glow", icon: CheckCircle2, iconCls: "text-green-400 bg-green-500/10" },
  Cancelled: { label: "Cancelled", color: "bg-red-500/20 text-red-300 border-red-500/40", borderCls: "border-l-red-glow", icon: Flag, iconCls: "text-red-400 bg-red-500/10" },
};

const FILTERS = [
  { key: "RegistrationOpen", label: "Registration Open" },
  { key: "Ongoing", label: "Ongoing" },
  { key: "Finished", label: "Finished" },
  { key: "Cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
];

function getAction(race) {
  if (race.status === "RegistrationOpen") {
    return { label: "Pre-Race Check", path: `/referee/races/${race.raceId}/pre-race-check`, icon: ShieldCheck, primary: true };
  }
  if (race.status === "Ongoing") {
    return { label: "Race Control", path: `/referee/races/${race.raceId}`, icon: Zap, primary: true };
  }
  return { label: "View Race", path: `/referee/races/${race.raceId}`, icon: Eye, primary: false };
}

export default function RefereeRacesPage() {
  const navigate = useNavigate();
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("RegistrationOpen");

  const fetchRaces = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await spectatorService.getAssignedRaces(filterStatus);
      const assigned = (res.data || []).filter((race) => race.status !== "Draft" && race.status !== "Scheduled");
      setRaces(assigned);
    } catch (e) {
      setError(e.message || "Unable to load races");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchRaces(); }, [fetchRaces]);

  const counts = races.reduce((acc, race) => {
    acc[race.status] = (acc[race.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <AdminLayout title="My Races">
      <div className="page-header">
        <div className="absolute right-0 top-0 w-72 h-full bg-gradient-to-l from-yellow-500/[0.04] to-transparent pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <ClipboardList size={14} className="text-yellow-400" />
              </div>
              <span className="text-[10px] font-bold text-sb-tx-3 uppercase tracking-widest">Referee</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">My Races</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="stat-pill"><span className="text-white font-bold">{races.length}</span> assigned races</span>
              {(counts.Ongoing || 0) > 0 && (
                <span className="stat-pill text-yellow-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot inline-block" /> {counts.Ongoing} LIVE
                </span>
              )}
              {(counts.RegistrationOpen || 0) > 0 && <span className="stat-pill text-purple-300">{counts.RegistrationOpen} pre-race</span>}
            </div>
          </div>
          <button onClick={fetchRaces}
            className="flex items-center gap-2 px-3 py-2 bg-sb-s2 border border-sb-border rounded-xl text-sb-tx-3 hover:text-sb-tx text-sm transition-all shrink-0">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(({ key, label }) => {
            const isActive = filterStatus === key;
            return (
              <button key={key} onClick={() => setFilterStatus(key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive ? "bg-[#D4AF37] text-[#0A0E1A] shadow-[0_0_12px_rgba(212,175,55,0.3)]"
                    : "bg-sb-s1/[0.03] border border-sb-border text-sb-tx-3 hover:text-sb-tx"
                }`}>
                {label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-300 text-sm">
            <AlertCircle size={15} className="shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-24 shimmer rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />)}
          </div>
        ) : races.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 flex items-center justify-center mb-4 animate-float">
              <Flag size={24} className="text-yellow-500/30" />
            </div>
            <p className="text-white font-semibold mb-1">No races</p>
            <p className="text-sb-tx-3 text-sm">
              {filterStatus === "RegistrationOpen"
                ? "No assigned race is waiting for pre-race check."
                : "No assigned races match this filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {races.map((race, idx) => {
              const cfg = STATUS_CONFIG[race.status] || { label: race.status, color: "bg-gray-500/20 text-sb-tx-3 border-gray-500/40", borderCls: "border-l-gray-glow", icon: Flag, iconCls: "text-sb-tx-3 bg-sb-s1/5" };
              const StatusIcon = cfg.icon;
              const action = getAction(race);
              const ActionIcon = action.icon;

              return (
                <div key={race.raceId}
                  className={`group relative bg-[#0d1117] border border-sb-border rounded-xl overflow-hidden card-hover ${cfg.borderCls} animate-fade-in-up`}
                  style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.06] ${cfg.iconCls}`}>
                      {race.status === "Ongoing" ? <span className="w-3 h-3 rounded-full bg-yellow-400 live-dot" /> : <StatusIcon size={17} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                        <h3 className="text-white font-bold text-base">{race.raceName}</h3>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${cfg.color}`}>
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
                          <span className="flex items-center gap-1 text-sb-tx-3 text-xs">
                            <Calendar size={10} /> {new Date(race.startTime).toLocaleString("vi-VN")}
                          </span>
                        )}
                        {race.distance && <span className="stat-pill">{race.distance}m</span>}
                      </div>
                    </div>
                    <button onClick={() => navigate(action.path)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${
                        action.primary
                          ? "bg-[#D4AF37] text-[#0A0E1A] btn-gold-glow"
                          : "bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] hover:bg-[#D4AF37]/20"
                      }`}>
                      <ActionIcon size={14} /> {action.label}
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
