import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy, MapPin, Calendar, RefreshCw, AlertCircle, ChevronRight, Eye,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { tournamentService } from "../../services/tournament";

// Read-only cho Admin: BTC (Organizer) tu tao va quan ly giai. Admin chi xem de giam sat.
const STATUS_CONFIG = {
  Draft:     { label: "Draft",             cls: "bg-sb-s2 text-sb-tx-2 border-sb-border",              strip: "from-gray-400/20 to-gray-400/5" },
  PendingApproval: { label: "Pending Approval", cls: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30", strip: "from-yellow-400/20 to-yellow-400/5" },
  Open:      { label: "Registration Open",  cls: "bg-sb-info/10 text-sb-info border-sb-info/30",         strip: "from-blue-400/20 to-blue-400/5" },
  Ongoing:   { label: "Ongoing",            cls: "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd",     strip: "from-amber-400/20 to-amber-400/5" },
  Finished:  { label: "Finished",           cls: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd", strip: "from-green-400/20 to-green-400/5" },
  Cancelled: { label: "Cancelled",          cls: "bg-sb-lose/10 text-sb-lose border-sb-lose/30",         strip: "from-red-400/20 to-red-400/5" },
};

const formatVND = (n) =>
  n ? new Intl.NumberFormat("en-US").format(n) + " VND" : null;

export default function TournamentManagementPage() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchAll = async () => {
    setIsLoading(true); setErrorMsg("");
    try {
      const res = await tournamentService.getAll();
      setTournaments(res.data || []);
    } catch (err) {
      setErrorMsg(err.message || "Unable to load tournaments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  return (
    <AdminLayout title="Tournament Overview">

      <div className="page-header">
        <div className="absolute right-0 top-0 w-72 h-full bg-gradient-to-l from-[#D4AF37]/[0.04] to-transparent pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                <Trophy size={14} className="text-[#D4AF37]" />
              </div>
              <span className="text-[10px] font-bold text-sb-tx-3 uppercase tracking-widest">Admin</span>
            </div>
            <h1 className="text-2xl font-black text-sb-tx leading-tight">Tournament Overview</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="stat-pill"><span className="text-sb-tx font-bold">{tournaments.length}</span> tournaments</span>
              {tournaments.filter(t => t.status === "Ongoing").length > 0 && (
                <span className="stat-pill text-yellow-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot inline-block" />
                  {tournaments.filter(t => t.status === "Ongoing").length} ongoing
                </span>
              )}
            </div>
          </div>
          <button onClick={fetchAll} disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-sb-s2 border border-sb-border rounded-xl text-sb-tx-3 hover:text-sb-tx text-sm transition-all shrink-0">
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Ghi chu: giai dau do Organizer (BTC) quan ly - Admin chi xem giam sat */}
        <div className="mb-5 flex items-center gap-2 p-3.5 rounded-xl bg-sb-info/10 border border-sb-info/30 text-sb-info text-sm">
          <Eye size={15} className="shrink-0" />
          <span>View-only. Tournaments are created and managed by the Organizer. Admin oversees for monitoring purposes.</span>
        </div>

        {errorMsg && (
          <div className="mb-5 flex items-center gap-2 p-4 rounded-xl bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm">
            <AlertCircle size={14} className="shrink-0 text-sb-lose" /> {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 bg-sb-s2 animate-pulse rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-sb-gold-soft border border-amber-100 flex items-center justify-center mb-4">
              <Trophy size={32} className="text-amber-300" />
            </div>
            <p className="text-sb-tx font-semibold mb-1">No tournaments yet</p>
            <p className="text-sb-tx-3 text-sm">Tournaments created by the Organizer will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tournaments.map((t, idx) => {
              const s = STATUS_CONFIG[t.status] || STATUS_CONFIG.Draft;
              return (
                <div
                  key={t.tournamentId}
                  className="group relative bg-sb-s1 border border-sb-border rounded-xl overflow-hidden shadow-sm hover:shadow-md flex flex-col animate-fade-in-up transition-shadow"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className={`h-0.5 w-full bg-gradient-to-r ${s.strip}`} />

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${s.cls}`}>
                        {t.status === "Ongoing" && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                        {s.label}
                      </span>
                    </div>

                    <h3 className="text-sb-tx font-bold text-base mb-3 leading-tight flex-1">
                      {t.tournamentName}
                    </h3>

                    <div className="space-y-1.5 mb-4">
                      {t.location && (
                        <div className="flex items-center gap-2 text-sb-tx-3 text-xs">
                          <MapPin size={11} className="shrink-0 text-sb-tx-3" />
                          <span className="truncate">{t.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sb-tx-3 text-xs">
                        <Calendar size={11} className="shrink-0 text-sb-tx-3" />
                        <span>{t.startDate?.slice(0, 10)} to {t.endDate?.slice(0, 10)}</span>
                      </div>
                      {t.prizeFund > 0 && (
                        <div className="flex items-center gap-2 text-sb-gold-2 text-xs font-bold">
                          <Trophy size={11} className="shrink-0" />
                          {formatVND(t.prizeFund)}
                        </div>
                      )}
                    </div>

                    <button onClick={() => navigate(`/admin/tournaments/${t.tournamentId}`)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-sb-border text-sb-tx-3 hover:text-sb-info hover:border-blue-300 hover:bg-sb-info/10 text-xs transition-all mt-auto">
                      View Details <ChevronRight size={12} />
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
