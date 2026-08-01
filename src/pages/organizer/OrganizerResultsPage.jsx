import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  Eye,
  Flag,
  Globe,
  Loader2,
  RefreshCw,
  Trophy,
  XCircle,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { organizerService } from "../../services/organizer";
import { raceResultService } from "../../services/raceResult";

const FILTERS = ["Pending", "Approved", "Published", "Rejected"];

const STATUS_CONFIG = {
  Pending: {
    label: "Pending",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    icon: Clock,
    iconCls: "text-yellow-400 bg-yellow-500/10",
  },
  Approved: {
    label: "Approved",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    icon: CheckCircle2,
    iconCls: "text-blue-400 bg-blue-500/10",
  },
  Published: {
    label: "Published",
    color: "bg-green-500/20 text-green-300 border-green-500/40",
    icon: Globe,
    iconCls: "text-green-400 bg-green-500/10",
  },
  Rejected: {
    label: "Rejected",
    color: "bg-red-500/20 text-red-300 border-red-500/40",
    icon: XCircle,
    iconCls: "text-red-400 bg-red-500/10",
  },
};

function deriveResultStatus(results) {
  if (!results || results.length === 0) return "Pending";
  const statuses = results.map((item) => item.approvalStatus || "Pending");
  if (statuses.some((status) => status === "Published")) return "Published";
  if (statuses.some((status) => status === "Rejected")) return "Rejected";
  if (statuses.every((status) => status === "Approved")) return "Approved";
  return "Pending";
}

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function OrganizerResultsPage() {
  const navigate = useNavigate();
  const [races, setRaces] = useState([]);
  const [filter, setFilter] = useState("Pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRaces = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await organizerService.getRaces();
      const finishedRaces = (response.data || []).filter((race) => race.status === "Finished");

      const reviewItems = await Promise.all(
        finishedRaces.map(async (race) => {
          try {
            const resultResponse = await raceResultService.getResults(race.raceId);
            const results = resultResponse.data || [];
            return {
              ...race,
              resultStatus: deriveResultStatus(results),
              resultCount: results.length,
              topHorseName: results.find((item) => Number(item.finishPosition) === 1)?.horseName,
            };
          } catch {
            return {
              ...race,
              resultStatus: "Pending",
              resultCount: 0,
              topHorseName: "",
            };
          }
        })
      );

      setRaces(reviewItems);
    } catch (err) {
      setError(err.message || "Unable to load result review list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRaces();
  }, [fetchRaces]);

  const counts = useMemo(
    () => FILTERS.reduce((acc, status) => {
      acc[status] = races.filter((race) => race.resultStatus === status).length;
      return acc;
    }, {}),
    [races]
  );

  const visibleRaces = races.filter((race) => race.resultStatus === filter);

  return (
    <AdminLayout title="Result Reviews">
      <div className="page-header">
        <div className="absolute right-0 top-0 h-full w-72 bg-gradient-to-l from-[#D4AF37]/[0.05] to-transparent pointer-events-none" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/10">
                <Award size={14} className="text-[#D4AF37]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-sb-tx-3">Organizer Review</span>
            </div>
            <h1 className="text-2xl font-black leading-tight text-white">Result Reviews</h1>
            <p className="mt-1 text-sm text-sb-tx-3">Review referee handoffs, then approve, reject, or publish from the detail page.</p>
          </div>
          <button
            onClick={fetchRaces}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-sb-border bg-sb-s2 px-3 py-2 text-sm text-sb-tx-3 transition-all hover:text-sb-tx"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((status) => {
            const active = filter === status;
            const config = STATUS_CONFIG[status];
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                  active
                    ? `${config.color} shadow-[0_0_18px_rgba(212,175,55,0.08)]`
                    : "border-sb-border bg-[#0d1117] text-sb-tx-3 hover:text-white"
                }`}
              >
                {config.label}
                <span className="ml-2 rounded-full bg-black/20 px-2 py-0.5 text-xs">{counts[status] || 0}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-24 rounded-xl shimmer" />
            ))}
          </div>
        ) : visibleRaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/10 bg-[#D4AF37]/5">
              <Trophy size={24} className="text-[#D4AF37]/30" />
            </div>
            <p className="mb-1 font-semibold text-white">No {STATUS_CONFIG[filter].label.toLowerCase()} results</p>
            <p className="text-sm text-sb-tx-3">Results will appear here when the race reaches this review state.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleRaces.map((race, index) => {
              const config = STATUS_CONFIG[race.resultStatus] || STATUS_CONFIG.Pending;
              const StatusIcon = config.icon;
              return (
                <button
                  key={race.raceId}
                  onClick={() => navigate(`/organizer/results/${race.raceId}`)}
                  className="group w-full rounded-xl border border-sb-border bg-[#0d1117] p-5 text-left transition-all hover:border-[#D4AF37]/40 hover:bg-[#111827]"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] ${config.iconCls}`}>
                      <StatusIcon size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-bold text-white">{race.raceName}</h3>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-sb-tx-3">
                        <span className="flex items-center gap-1">
                          <Flag size={10} />
                          {formatDate(race.startTime)}
                        </span>
                        <span>{race.resultCount || 0} result entries</span>
                        {race.topHorseName && <span className="text-[#D4AF37]">Leader: {race.topHorseName}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-sb-border bg-sb-s1/[0.03] px-3 py-2 text-xs font-semibold text-sb-tx-3 transition-colors group-hover:text-white">
                      <Eye size={12} />
                      Open Detail
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
