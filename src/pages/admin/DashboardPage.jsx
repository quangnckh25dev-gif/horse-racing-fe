import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Award,
  BarChart2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Flag,
  Home,
  Loader2,
  Mail,
  PawPrint,
  ReceiptText,
  RefreshCw,
  Settings,
  Trophy,
  User,
  UserCheck,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { adminService } from "../../services/admin";
import { dashboardService } from "../../services/dashboard";
import { leaderboardService } from "../../services/leaderboard";
import { notificationService } from "../../services/notification";
import { spectatorService } from "../../services/spectator";
import { walletService } from "../../services/wallet";
import { betService } from "../../services/bet";

const ROLE_LABELS = {
  Admin: "Administrator",
  Organizer: "Organizer",
  HorseOwner: "Horse Owner",
  Jockey: "Jockey",
  Referee: "Referee",
  Spectator: "Spectator",
};

const ROLE_ACTIONS = {
  Admin: [
    { label: "Approve Accounts", icon: UserCheck, path: "/admin/users/pending" },
    { label: "User Management", icon: Users, path: "/admin/users" },
    { label: "Approve Tournaments", icon: Trophy, path: "/admin/tournaments" },
    { label: "Approve Deposits", icon: Wallet, path: "/admin/deposit-requests" },
    { label: "System Logs", icon: FileText, path: "/admin/audit-logs" },
    { label: "System Configurations", icon: Settings, path: "/admin/configs" },
  ],
  Organizer: [
    { label: "Race Management", icon: Flag, path: "/organizer/races" },
    { label: "Approve Results", icon: Award, path: "/organizer/results" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  HorseOwner: [
    { label: "My Horses", icon: PawPrint, path: "/owner/horses" },
    { label: "Race Registration", icon: Trophy, path: "/owner/race-registration" },
    { label: "Jockey Invitations", icon: Mail, path: "/owner/invitations" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  Jockey: [
    { label: "Race Invitations", icon: Mail, path: "/jockey/invitations" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  Referee: [
    { label: "My Assigned Races", icon: Flag, path: "/referee/races" },
    { label: "Race Result Entry", icon: CheckCircle2, path: "/referee/races" },
    { label: "Violations", icon: AlertCircle, path: "/referee/races" },
    { label: "Race Minutes", icon: FileText, path: "/referee/races" },
    { label: "Profile", icon: User, path: "/profile" },
  ],
  Spectator: [
    { label: "Race Schedule", icon: Calendar, path: "/spectator/schedule" },
    { label: "Betting", icon: DollarSign, path: "/spectator/betting" },
    { label: "Wallet", icon: Wallet, path: "/spectator/wallet" },
    { label: "Leaderboard", icon: BarChart2, path: "/leaderboard" },
  ],
};

const STATUS_LABELS = {
  Scheduled: "Upcoming",
  RegistrationOpen: "Registration Open",
  Ongoing: "Ongoing",
  Finished: "Finished",
  Cancelled: "Cancelled",
};

const STATUS_CLASSES = {
  Scheduled: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  RegistrationOpen: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  Ongoing: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  Finished: "bg-sb-s2 text-sb-tx-2 border-sb-border",
  Cancelled: "bg-red-500/10 text-red-300 border-red-500/30",
};

const ACTION_STYLE = [
  "text-sb-info bg-sb-info/10 border-sb-info/30 hover:border-blue-400",
  "text-sb-gold-2 bg-sb-gold-soft border-sb-gold-bd hover:border-amber-400",
  "text-sb-emerald-ink bg-sb-emerald-soft border-sb-emerald-bd hover:border-green-400",
  "text-purple-300 bg-purple-500/10 border-purple-500/30 hover:border-purple-400",
  "text-orange-300 bg-orange-500/10 border-orange-500/30 hover:border-orange-400",
  "text-pink-300 bg-pink-500/10 border-pink-500/30 hover:border-pink-400",
];

const VIEW_ALL_PATH_BY_ROLE = {
  Admin: "/admin/tournaments",
  Organizer: "/organizer/races",
  HorseOwner: "/owner/race-registration",
  Jockey: "/jockey/invitations",
  Referee: "/referee/races",
  Spectator: "/spectator/schedule",
};

const getArray = (payload, keys) => {
  for (const key of keys) {
    const value = payload?.[key];
    if (Array.isArray(value)) return value;
  }
  if (Array.isArray(payload)) return payload;
  return [];
};

const raceTime = (race) => race?.raceDate || race?.startTime || race?.scheduledAt || race?.dateTime;
const racePrize = (race) => race?.prizePool ?? race?.prizeFund ?? race?.prizeFirst;
const nameOf = (item, fallback) => item?.name || item?.jockeyName || item?.horseName || fallback;
const pointsOf = (item) => item?.points ?? item?.totalPoints ?? 0;

function formatDate(value) {
  if (!value) return "Date pending";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value) {
  if (!value) return "";
  return `${Number(value).toLocaleString("en-US")} VND`;
}

function primaryCta(role) {
  return (ROLE_ACTIONS[role] || ROLE_ACTIONS.Spectator)[0] || { label: "View Races", path: "/spectator/schedule" };
}

function raceAction(role, race) {
  const raceId = race?.raceId || race?.id;
  if (role === "HorseOwner" && race?.status === "RegistrationOpen") {
    return { label: "Register", path: "/owner/race-registration" };
  }
  if (role === "Spectator" && ["Scheduled", "RegistrationOpen", "Ongoing"].includes(race?.status)) {
    return { label: "Betting", path: "/spectator/betting" };
  }
  if (role === "Referee") return { label: "Manage", path: raceId ? `/referee/races/${raceId}` : "/referee/races" };
  if (role === "Organizer") return { label: "Manage", path: raceId ? `/organizer/races/${raceId}` : "/organizer/races" };
  return { label: "View Races", path: role === "Admin" ? "/admin/tournaments" : "/spectator/schedule" };
}

function resolveActionPath(action, role, featuredRaces) {
  if (role !== "Referee") return action.path;
  if (action.path !== "/referee/races") return action.path;
  if (action.label === "My Assigned Races") return action.path;

  const firstAssignedRace = featuredRaces.find((race) => race?.raceId || race?.id);
  const raceId = firstAssignedRace?.raceId || firstAssignedRace?.id;
  return raceId ? `/referee/races/${raceId}` : action.path;
}

function SectionTitle({ icon: Icon, title, action, onAction }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-sb-s2 border border-sb-border flex items-center justify-center text-sb-emerald-ink">
          <Icon size={15} />
        </div>
        <h2 className="font-display text-base font-bold text-sb-tx">{title}</h2>
      </div>
      {action && (
        <button onClick={onAction} className="text-xs text-sb-tx-3 hover:text-sb-tx transition-colors">
          {action}
        </button>
      )}
    </div>
  );
}

function OverviewCard({ icon: Icon, label, value, hint, tone }) {
  return (
    <div className="rounded-xl border border-sb-border bg-sb-s1 p-4 min-h-[112px]">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>
          <Icon size={18} />
        </div>
        <span className="font-display text-3xl font-black text-sb-tx tabular-nums">{value}</span>
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-widest text-sb-tx-3">{label}</p>
      <p className="mt-1 text-xs text-sb-tx-3">{hint}</p>
    </div>
  );
}

function LeaderList({ title, items, fallback }) {
  return (
    <div className="rounded-xl border border-sb-border bg-sb-s1 p-4">
      <h3 className="text-sm font-bold text-sb-tx mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-sb-tx-3 leading-relaxed">{fallback}</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 3).map((item, index) => (
            <div key={item.entityId || item.id || `${title}-${index}`} className="flex items-center gap-3 rounded-lg bg-sb-s2/70 border border-sb-border px-3 py-2">
              <span className="w-6 h-6 rounded-lg bg-sb-gold-soft border border-sb-gold-bd text-sb-gold-2 text-xs font-black flex items-center justify-center">
                {item.rank || index + 1}
              </span>
              <span className="flex-1 min-w-0 text-sm font-medium text-sb-tx truncate">{nameOf(item, "Pending name")}</span>
              <span className="text-xs font-bold text-sb-emerald-ink tabular-nums">{pointsOf(item)} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SpectatorDashboard({ user }) {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [openRaces, setOpenRaces] = useState([]);
  const [recentBets, setRecentBets] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [jockeys, setJockeys] = useState([]);
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [walletRes, racesRes, historyRes, jockeyRes, horseRes] = await Promise.all([
        walletService.getMyWallet().catch(() => null),
        spectatorService.getRaces().catch(() => ({ data: [] })),
        betService.getBetHistory().catch(() => ({ data: { singleBets: [], parlayTickets: [] } })),
        leaderboardService.getGlobalJockeyLeaderboard().catch(() => ({ data: [] })),
        leaderboardService.getGlobalHorseLeaderboard().catch(() => ({ data: [] })),
      ]);
      const historyData = historyRes?.data || {};
      setWallet(walletRes?.data || null);
      setOpenRaces((racesRes.data || []).filter((race) => race.status === "RegistrationOpen").slice(0, 4));
      setRecentBets(Array.isArray(historyData) ? historyData.slice(0, 4) : (historyData.singleBets || []).slice(0, 4));
      setRecentTickets((historyData.parlayTickets || []).slice(0, 3));
      setJockeys(getArray(jockeyRes?.data, ["topJockeys", "jockeys", "items", "content", "data"]));
      setHorses(getArray(horseRes?.data, ["topHorses", "horses", "items", "content", "data"]));
    } catch (e) {
      setError(e.message || "Unable to load spectator dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalRecent = recentBets.length + recentTickets.length;

  return (
    <AdminLayout title="Dashboard">
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <section
          className="relative overflow-hidden rounded-2xl border border-sb-border bg-sb-s1 min-h-[260px] flex items-end"
          style={{
            backgroundImage: "linear-gradient(90deg, rgba(10,14,26,0.95), rgba(10,14,26,0.70), rgba(10,14,26,0.40)), url('/bg-horse.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="relative z-10 p-6 md:p-8 w-full">
            <span className="px-3 py-1 rounded-full bg-sb-gold-soft border border-sb-gold-bd text-sb-gold-2 text-[10px] font-black uppercase tracking-widest">
              Spectator
            </span>
            <div className="mt-4 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-black text-white leading-tight">
                  Welcome back, {user?.fullName || user?.username || "Spectator"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm md:text-base text-sb-tx-3">
                  Track your wallet, open betting races, recent tickets, and racing leaders in one customer dashboard.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate("/spectator/betting")} className="btn-gold inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold">
                  Start Betting <ChevronRight size={15} />
                </button>
                <button onClick={() => navigate("/spectator/wallet")} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-sb-s1/20 hover:bg-sb-s1/30 border border-white/20 text-white/85 text-sm font-semibold">
                  Wallet
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <OverviewCard icon={Wallet} label="Wallet balance" value={wallet ? formatMoney(wallet.balance).replace(" VND", "") : loading ? "..." : "0"} hint="Available for betting" tone="text-sb-gold-2 bg-sb-gold-soft" />
          <OverviewCard icon={DollarSign} label="Open betting races" value={openRaces.length} hint="Registration Open only" tone="text-sb-emerald-ink bg-sb-emerald-soft" />
          <OverviewCard icon={History} label="Recent tickets" value={totalRecent} hint="Single and parlay tickets" tone="text-sb-info bg-sb-info/10" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <section className="xl:col-span-2 rounded-2xl border border-sb-border bg-sb-s1 p-5 space-y-4">
            <SectionTitle icon={DollarSign} title="Open For Betting" action="Open betting" onAction={() => navigate("/spectator/betting")} />
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-sb-gold-2" /></div>
            ) : openRaces.length === 0 ? (
              <div className="py-10 text-center text-sm text-sb-tx-3">No races are open for betting right now.</div>
            ) : (
              <div className="divide-y divide-sb-border">
                {openRaces.map((race) => (
                  <div key={race.raceId} className="py-4 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-sb-tx">{race.raceName || "Race"}</h3>
                        <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd">
                          Registration Open
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-sb-tx-3">
                        <span>{formatDate(raceTime(race))}</span>
                        {race.location && <span>{race.location}</span>}
                        {racePrize(race) && <span className="font-bold text-sb-gold-2">{formatMoney(racePrize(race))}</span>}
                      </div>
                    </div>
                    <button onClick={() => navigate("/spectator/betting")}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sb-gold text-sb-bg text-xs font-black">
                      Bet Now <ChevronRight size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-sb-border bg-sb-s1 p-5 space-y-4">
            <SectionTitle icon={Trophy} title="Leaderboard Preview" action="Open leaderboard" onAction={() => navigate("/leaderboard")} />
            <LeaderList title="Top Jockeys" items={jockeys} fallback="Leaderboard data will appear after results are published." />
            <LeaderList title="Top Horses" items={horses} fallback="Leaderboard data will appear after results are published." />
          </section>
        </div>

        <section className="rounded-2xl border border-sb-border bg-sb-s1 p-5 space-y-4">
          <SectionTitle icon={ReceiptText} title="Recent Betting Tickets" action="View history" onAction={() => navigate("/spectator/betting/history")} />
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-sb-gold-2" /></div>
          ) : totalRecent === 0 ? (
            <div className="py-8 text-center text-sm text-sb-tx-3">Your recent betting tickets will appear here.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {recentBets.map((bet) => (
                <div key={`bet-${bet.betId}`} className="rounded-xl border border-sb-border bg-sb-s2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-sb-tx">{bet.raceName || `Race #${bet.raceId}`}</p>
                      <p className="text-xs text-sb-tx-3">{bet.horseName || `Entry #${bet.entryId}`} | {bet.betTypeLabel || bet.betType} | {bet.odds}x</p>
                    </div>
                    <span className="text-xs font-black text-sb-gold-2">{formatMoney(bet.amount)}</span>
                  </div>
                </div>
              ))}
              {recentTickets.map((ticket) => (
                <div key={`ticket-${ticket.ticketId}`} className="rounded-xl border border-sb-border bg-sb-s2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-sb-tx">{ticket.raceName || `Race #${ticket.raceId}`}</p>
                      <p className="text-xs text-sb-tx-3">Parlay | {ticket.selections?.length || 0} selections | {Number(ticket.odds || 0).toFixed(2)}x</p>
                    </div>
                    <span className="text-xs font-black text-sb-emerald-ink">{formatMoney(ticket.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-sb-border bg-sb-s1 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-sb-tx">Customer Support</h2>
            <p className="mt-1 text-sm text-sb-tx-3">Need help with deposits, betting tickets, or wallet history?</p>
          </div>
          <button onClick={() => navigate("/spectator/wallet")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sb-s2 border border-sb-border px-4 h-10 text-sm font-bold text-sb-tx-2 hover:text-sb-tx">
            Open Support
          </button>
        </section>
      </div>
    </AdminLayout>
  );
}

export default function DashboardPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [races, setRaces] = useState([]);
  const [summary, setSummary] = useState(null);
  const [jockeys, setJockeys] = useState([]);
  const [horses, setHorses] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const shared = await dashboardService.getSharedDashboard().catch(() => null);
      const sharedData = shared?.data || null;
      const shouldUseAssignedRaces = role === "Referee";
      const [racesRes, jockeyRes, horseRes, adminRes, unreadRes] = await Promise.all([
        shouldUseAssignedRaces
          ? spectatorService.getAssignedRaces()
          : sharedData
            ? Promise.resolve({ data: sharedData.featuredRaces })
            : spectatorService.getRaces(),
        sharedData ? Promise.resolve({ data: sharedData.topJockeys }) : leaderboardService.getGlobalJockeyLeaderboard(),
        sharedData ? Promise.resolve({ data: sharedData.topHorses }) : leaderboardService.getGlobalHorseLeaderboard(),
        role === "Admin" ? adminService.getDashboardStats().catch(() => null) : Promise.resolve(null),
        notificationService.getUnreadCount().catch(() => null),
      ]);

      setRaces(getArray(racesRes?.data, ["races", "items", "content", "data"]));
      setSummary(sharedData);
      setJockeys(getArray(jockeyRes?.data, ["topJockeys", "jockeys", "items", "content", "data"]));
      setHorses(getArray(horseRes?.data, ["topHorses", "horses", "items", "content", "data"]));
      setAdminStats(adminRes?.data || null);
      const unreadValue = unreadRes?.data?.count ?? unreadRes?.data?.unreadCount ?? unreadRes?.data;
      setUnreadCount(typeof unreadValue === "number" ? unreadValue : 0);
    } catch (err) {
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (role !== "Spectator") loadDashboard();
  }, [loadDashboard, role]);

  const overview = useMemo(() => {
    if (summary && role !== "Referee") {
      return {
        upcoming: summary.upcomingRaces ?? 0,
        registrationOpen: summary.registrationOpenRaces ?? 0,
        ongoing: summary.ongoingRaces ?? 0,
        finished: summary.finishedRaces ?? 0,
      };
    }

    const count = (statuses) => races.filter((race) => statuses.includes(race.status)).length;
    return {
      upcoming: count(["Scheduled"]),
      registrationOpen: count(["RegistrationOpen"]),
      ongoing: count(["Ongoing"]),
      finished: count(["Finished"]),
    };
  }, [races, role, summary]);

  const featuredRaces = useMemo(() => {
    return [...races]
      .sort((a, b) => new Date(raceTime(a) || 0) - new Date(raceTime(b) || 0))
      .slice(0, 5);
  }, [races]);

  const cta = primaryCta(role);
  const actions = ROLE_ACTIONS[role] || [];
  const roleLabel = ROLE_LABELS[role] || role || "Member";
  const leaderboardEmpty = "Leaderboard data will appear after results are published.";

  if (role === "Spectator") {
    return <SpectatorDashboard user={user} />;
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm">
            <AlertCircle size={15} />
            {error}
            <button onClick={loadDashboard} className="ml-auto flex items-center gap-1.5 text-xs hover:text-red-300">
              <RefreshCw size={12} /> Try Again
            </button>
          </div>
        )}

        <section
          className="relative overflow-hidden rounded-2xl border border-sb-border bg-sb-s1 min-h-[260px] flex items-end"
          style={{
            backgroundImage: "linear-gradient(90deg, rgba(10,14,26,0.95), rgba(10,14,26,0.72), rgba(10,14,26,0.42)), url('/bg-horse.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="relative z-10 p-6 md:p-8 w-full">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-sb-emerald-soft border border-sb-emerald-bd text-sb-emerald-ink text-[10px] font-black uppercase tracking-widest">
                {roleLabel}
              </span>
              <span className="px-3 py-1 rounded-full bg-sb-s1/40 border border-white/15 text-white/75 text-[10px] font-bold uppercase tracking-widest">
                Horse Racing Season 2026
              </span>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-black text-white leading-tight">
                  Welcome, {user?.fullName || user?.username || "Racing Member"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm md:text-base text-sb-tx-3">
                  A shared racing command center for schedules, race status, leaders, notifications, and role work.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate(cta.path)}
                  className="btn-gold inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold"
                >
                  {cta.label} <ChevronRight size={15} />
                </button>
                <button
                  onClick={loadDashboard}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-sb-s1/20 hover:bg-sb-s1/30 border border-white/20 text-white/85 text-sm font-semibold transition-all"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 space-y-5">
            <section className="space-y-3">
              <SectionTitle icon={BarChart2} title="Race Overview" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <OverviewCard icon={Clock} label="Upcoming races" value={overview.upcoming} hint="Scheduled to run" tone="text-blue-300 bg-blue-500/10" />
                <OverviewCard icon={UserCheck} label="Registration open" value={overview.registrationOpen} hint="Accepting entries" tone="text-amber-300 bg-amber-500/10" />
                <OverviewCard icon={Zap} label="Ongoing races" value={overview.ongoing} hint="Live right now" tone="text-emerald-300 bg-emerald-500/10" />
                <OverviewCard icon={CheckCircle2} label="Finished races" value={overview.finished} hint="Results published" tone="text-sb-tx-2 bg-sb-s2" />
              </div>
            </section>

            <section className="rounded-2xl border border-sb-border bg-sb-s1 p-5 space-y-4">
              <SectionTitle
                icon={Flag}
                title={role === "Referee" ? "My Assigned Races" : "Featured Races"}
                action="View all"
                onAction={() => navigate(VIEW_ALL_PATH_BY_ROLE[role] || "/spectator/schedule")}
              />
              {loading ? (
                <div className="flex items-center justify-center py-10 text-sb-tx-3">
                  <Loader2 size={20} className="animate-spin mr-2" /> Loading races
                </div>
              ) : featuredRaces.length === 0 ? (
                <div className="py-10 text-center text-sb-tx-3 text-sm">No races available.</div>
              ) : (
                <div className="divide-y divide-sb-border">
                  {featuredRaces.map((race) => {
                    const action = raceAction(role, race);
                    const statusCls = STATUS_CLASSES[race.status] || STATUS_CLASSES.Scheduled;
                    return (
                      <div key={race.raceId || race.id || race.raceName} className="py-4 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-sb-tx truncate">{race.raceName || race.name || "Race"}</h3>
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusCls}`}>
                              {STATUS_LABELS[race.status] || race.status || "Scheduled"}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sb-tx-3">
                            <span className="inline-flex items-center gap-1"><Calendar size={11} /> {formatDate(raceTime(race))}</span>
                            {(race.trackLength || race.distance) && <span>{race.trackLength || race.distance}m track</span>}
                            {racePrize(race) && <span className="text-sb-gold-2 font-semibold">{formatMoney(racePrize(race))}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(action.path)}
                          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx-2 hover:text-sb-tx hover:border-sb-border-2 text-xs font-semibold transition-colors"
                        >
                          {action.label} <ChevronRight size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-2xl border border-sb-border bg-sb-s1 p-5 space-y-4">
              <SectionTitle icon={Trophy} title="Leaderboard Preview" action="Open leaderboard" onAction={() => navigate("/leaderboard")} />
              <LeaderList title="Top Jockeys" items={jockeys} fallback={leaderboardEmpty} />
              <LeaderList title="Top Horses" items={horses} fallback={leaderboardEmpty} />
            </section>

            <section className="rounded-2xl border border-sb-border bg-sb-s1 p-5 space-y-4">
              <SectionTitle icon={Home} title="Role Quick Actions" />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
                {actions.map((item, index) => {
                  const Icon = item.icon;
                  const style = ACTION_STYLE[index % ACTION_STYLE.length];
                  return (
                    <button
                      key={`${item.label}-${item.path}`}
                      onClick={() => navigate(resolveActionPath(item, role, featuredRaces))}
                      className={`group flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${style}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-current/10 flex items-center justify-center shrink-0">
                        <Icon size={15} />
                      </div>
                      <span className="flex-1 text-sm font-semibold text-sb-tx">{item.label}</span>
                      <ChevronRight size={13} className="text-sb-tx-3 group-hover:text-sb-tx" />
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-sb-border bg-sb-s1 p-5">
              <SectionTitle icon={Mail} title="Notifications" />
              <div className="mt-4 flex items-center justify-between rounded-xl bg-sb-s2 border border-sb-border p-4">
                <span className="text-sm text-sb-tx-2">Unread notifications</span>
                <span className="font-display text-2xl font-black text-sb-emerald-ink tabular-nums">{unreadCount}</span>
              </div>
              {role === "Admin" && adminStats && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-sb-s2 border border-sb-border p-3">
                    <p className="text-sb-tx-3">Pending approvals</p>
                    <p className="text-lg font-black text-sb-gold-2">{adminStats.pendingApprovals ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-sb-s2 border border-sb-border p-3">
                    <p className="text-sb-tx-3">Active users</p>
                    <p className="text-lg font-black text-sb-tx">{adminStats.totalActiveUsers ?? 0}</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
