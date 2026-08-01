import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  Award,
  BadgeCheck,
  Banknote,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Flag,
  Gauge,
  HeartPulse,
  History,
  Home,
  Loader2,
  Mail,
  MessageSquareWarning,
  PawPrint,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { dashboardService } from "../../services/dashboard";

const ROLE_META = {
  Admin: {
    label: "Admin Dashboard",
    subtitle: "Review accounts, deposits, complaints, and platform health.",
    accent: "text-sky-300 bg-sky-500/10 border-sky-500/30",
    icon: ShieldCheck,
    primaryPath: "/admin/users/pending",
    primaryLabel: "Review Accounts",
  },
  Organizer: {
    label: "Organizer Dashboard",
    subtitle: "Manage tournament operations, race registrations, entries, and result approval.",
    accent: "text-amber-300 bg-amber-500/10 border-amber-500/30",
    icon: Flag,
    primaryPath: "/organizer/races",
    primaryLabel: "Manage Races",
  },
  Referee: {
    label: "Referee Dashboard",
    subtitle: "See assigned races, pre-race checks, violations, minutes, and result work.",
    accent: "text-violet-300 bg-violet-500/10 border-violet-500/30",
    icon: ClipboardCheck,
    primaryPath: "/referee/races",
    primaryLabel: "Open My Races",
  },
  HorseOwner: {
    label: "Horse Owner Dashboard",
    subtitle: "Track your horses, race registrations, jockey invitations, and wallet.",
    accent: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    icon: PawPrint,
    primaryPath: "/owner/horses",
    primaryLabel: "Manage Horses",
  },
  Jockey: {
    label: "Jockey Dashboard",
    subtitle: "Review invitations, upcoming rides, earnings, and racing performance.",
    accent: "text-orange-300 bg-orange-500/10 border-orange-500/30",
    icon: Award,
    primaryPath: "/jockey/invitations",
    primaryLabel: "Review Invitations",
  },
  Spectator: {
    label: "Spectator Dashboard",
    subtitle: "Follow open races, wallet balance, betting tickets, and leaderboards.",
    accent: "text-sb-gold-2 bg-sb-gold-soft border-sb-gold-bd",
    icon: Trophy,
    primaryPath: "/spectator/betting",
    primaryLabel: "Start Betting",
  },
};

const METRIC_ICONS = [
  Users,
  UserCheck,
  Wallet,
  MessageSquareWarning,
  Calendar,
  ClipboardCheck,
  Trophy,
  Banknote,
  PawPrint,
  Mail,
  Gauge,
  CheckCircle2,
];

const SECTION_ICONS = {
  pendingAccounts: Users,
  recentDeposits: Wallet,
  systemStatus: Gauge,
  upcomingRaces: Calendar,
  entryApprovals: ClipboardCheck,
  assignedRaces: Flag,
  preRaceChecks: ClipboardCheck,
  violationOptions: AlertCircle,
  myHorses: PawPrint,
  raceRegistrations: Trophy,
  jockeyInvitations: Mail,
  pendingInvitations: Mail,
  upcomingRides: Flag,
  featuredRaces: Calendar,
  recentBets: ReceiptText,
  leaderboardPreview: Trophy,
};

const SECTION_TITLES = {
  pendingAccounts: "Pending Accounts",
  recentDeposits: "Recent Deposits",
  systemStatus: "System Status",
  upcomingRaces: "Upcoming Races",
  entryApprovals: "Entry Approvals",
  assignedRaces: "My Assigned Races",
  preRaceChecks: "Pre-Race Checks",
  violationOptions: "Violation Options",
  myHorses: "My Horses",
  raceRegistrations: "Race Registrations",
  jockeyInvitations: "Jockey Invitations",
  pendingInvitations: "Pending Invitations",
  upcomingRides: "Upcoming Rides",
  featuredRaces: "Featured Races",
  recentBets: "Recent Bets",
  leaderboardPreview: "Leaderboard Preview",
};

const STATUS_STYLE = {
  Active: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd",
  Approved: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd",
  Accepted: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd",
  Healthy: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd",
  RegistrationOpen: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd",
  Ongoing: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  Draft: "bg-sb-s2 text-sb-tx-3 border-sb-border",
  Pending: "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd",
  Finished: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  Rejected: "bg-sb-lose/10 text-sb-lose border-sb-lose/30",
  Declined: "bg-sb-lose/10 text-sb-lose border-sb-lose/30",
  Cancelled: "bg-sb-lose/10 text-sb-lose border-sb-lose/30",
  Injured: "bg-sb-lose/10 text-sb-lose border-sb-lose/30",
  Inactive: "bg-sb-s2 text-sb-tx-3 border-sb-border",
};

const NAV_BY_SECTION = {
  pendingAccounts: "/admin/users/pending",
  recentDeposits: "/admin/deposit-requests",
  upcomingRaces: "/organizer/races",
  entryApprovals: "/organizer/races",
  assignedRaces: "/referee/races",
  preRaceChecks: "/referee/races",
  myHorses: "/owner/horses",
  raceRegistrations: "/owner/race-registration",
  jockeyInvitations: "/owner/invitations",
  pendingInvitations: "/jockey/invitations",
  upcomingRides: "/jockey/invitations",
  featuredRaces: "/spectator/schedule",
  recentBets: "/spectator/betting/history",
  leaderboardPreview: "/leaderboard",
};

const LIST_SECTIONS_BY_ROLE = {
  Admin: ["pendingAccounts", "recentDeposits", "systemStatus"],
  Organizer: ["upcomingRaces", "entryApprovals"],
  Referee: ["assignedRaces", "preRaceChecks", "violationOptions"],
  HorseOwner: ["myHorses", "raceRegistrations", "jockeyInvitations"],
  Jockey: ["pendingInvitations", "upcomingRides"],
  Spectator: ["featuredRaces", "recentBets", "leaderboardPreview"],
};

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "0 VND";
  return `${Number(value || 0).toLocaleString("en-US")} VND`;
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "0";
  if (typeof value === "number") return Number.isInteger(value) ? value.toLocaleString("en-US") : value.toFixed(2);
  if (typeof value === "object") return JSON.stringify(value);
  if (/^\d+(\.\d+)?$/.test(String(value))) return Number(value).toLocaleString("en-US");
  return value;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function statusLabel(value) {
  if (!value) return "";
  if (value === "RegistrationOpen") return "Registration Open";
  return String(value).replace(/([a-z])([A-Z])/g, "$1 $2");
}

function normalizeRole(role, dataRole) {
  if (role === "HorseOwner" || dataRole === "HorseOwner") return "HorseOwner";
  return dataRole || role || "Spectator";
}

function pickTitle(item) {
  return item.raceName
    || item.horseName
    || item.fullName
    || item.username
    || item.jockeyName
    || item.ownerName
    || item.label
    || item.type
    || item.kind
    || "Dashboard item";
}

function pickSubtitle(item) {
  const parts = [
    item.email,
    item.role,
    item.ownerName,
    item.jockeyName,
    item.paymentMethod,
    item.transferCode,
    item.trackLength ? `${item.trackLength}m` : null,
    item.raceDate ? formatDate(item.raceDate) : null,
    item.createdAt ? formatDate(item.createdAt) : null,
    item.registeredAt ? formatDate(item.registeredAt) : null,
    item.invitedAt ? formatDate(item.invitedAt) : null,
  ].filter(Boolean);
  return parts.join(" / ");
}

function pickRightValue(item) {
  if (item.balance !== undefined) return formatMoney(item.balance);
  if (item.amount !== undefined) return formatMoney(item.amount);
  if (item.dealAmount !== undefined) return formatMoney(item.dealAmount);
  if (item.penalty !== undefined) return `${item.penalty}s`;
  if (item.entries !== undefined && item.maxParticipants !== undefined) return `${item.entries}/${item.maxParticipants}`;
  if (item.odds !== undefined) return `${Number(item.odds || 0).toFixed(2)}x`;
  return item.status || item.healthStatus || item.entryStatus || item.raceStatus || "";
}

function getStatus(item) {
  return item.status || item.healthStatus || item.entryStatus || item.raceStatus;
}

function MetricCard({ metric, index, roleMeta }) {
  const Icon = METRIC_ICONS[index % METRIC_ICONS.length];
  const looksLikeMoney = /wallet|earning|deposit|amount|balance/i.test(metric.label || "");
  return (
    <div className="rounded-xl border border-sb-border bg-sb-s1 p-4 min-h-[112px]">
      <div className="flex items-start justify-between gap-3">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${roleMeta.accent}`}>
          <Icon size={18} />
        </div>
        <p className="text-right font-display text-2xl font-black text-sb-tx tabular-nums">
          {looksLikeMoney ? formatMoney(metric.value) : formatValue(metric.value)}
        </p>
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-widest text-sb-tx-3">{metric.label}</p>
      {metric.helper && <p className="mt-1 text-xs text-sb-tx-3">{metric.helper}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, path }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-sb-s2 border border-sb-border flex items-center justify-center text-sb-emerald-ink">
          <Icon size={15} />
        </div>
        <h2 className="font-display text-base font-bold text-sb-tx">{title}</h2>
      </div>
      {path && (
        <button onClick={() => navigate(path)} className="inline-flex items-center gap-1 text-xs text-sb-tx-3 hover:text-sb-tx transition-colors">
          View all <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

function DataRow({ item }) {
  const status = getStatus(item);
  const right = pickRightValue(item);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-sb-border bg-sb-s2/60 px-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-sb-tx">{pickTitle(item)}</p>
        <p className="mt-0.5 truncate text-xs text-sb-tx-3">{pickSubtitle(item) || "No extra details"}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {right && !status && <span className="text-xs font-black text-sb-gold-2 tabular-nums">{right}</span>}
        {status && (
          <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${STATUS_STYLE[status] || "bg-sb-s2 text-sb-tx-3 border-sb-border"}`}>
            {statusLabel(status)}
          </span>
        )}
      </div>
    </div>
  );
}

function DataSection({ name, data }) {
  const Icon = SECTION_ICONS[name] || Activity;
  const items = data?.[name];
  const rows = Array.isArray(items) ? items : [];

  if (name === "leaderboardPreview") {
    const jockeys = data?.leaderboardPreview?.jockeys || [];
    const horses = data?.leaderboardPreview?.horses || [];
    return (
      <section className="rounded-2xl border border-sb-border bg-sb-s1 p-5 space-y-4">
        <SectionHeader icon={Icon} title={SECTION_TITLES[name]} path={NAV_BY_SECTION[name]} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <MiniLeaderboard title="Top Jockeys" items={jockeys} />
          <MiniLeaderboard title="Top Horses" items={horses} />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-sb-border bg-sb-s1 p-5 space-y-4">
      <SectionHeader icon={Icon} title={SECTION_TITLES[name] || name} path={NAV_BY_SECTION[name]} />
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sb-border bg-sb-s2/40 py-8 text-center text-sm text-sb-tx-3">
          No data available.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.slice(0, 6).map((item, index) => <DataRow key={`${name}-${index}`} item={item} />)}
        </div>
      )}
    </section>
  );
}

function MiniLeaderboard({ title, items }) {
  return (
    <div className="rounded-xl border border-sb-border bg-sb-s2/50 p-3">
      <p className="mb-2 text-xs font-black uppercase tracking-widest text-sb-tx-3">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-sb-tx-3">Leaderboard appears after published results.</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 4).map((item, index) => (
            <div key={item.entityId || item.id || index} className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-sb-gold-bd bg-sb-gold-soft text-xs font-black text-sb-gold-2">
                {item.rank || index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-sb-tx">{item.name || item.jockeyName || item.horseName || "Competitor"}</span>
              <span className="text-xs font-bold text-sb-emerald-ink">{item.points || item.totalPoints || 0}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WalletPanel({ wallet }) {
  if (!wallet) return null;
  return (
    <section className="rounded-2xl border border-sb-border bg-sb-s1 p-5 space-y-4">
      <SectionHeader icon={Wallet} title="Wallet" path="/spectator/wallet" />
      <div className="rounded-xl border border-sb-gold-bd bg-sb-gold-soft p-4">
        <p className="text-xs font-black uppercase tracking-widest text-sb-gold-2">Available Balance</p>
        <p className="mt-1 font-display text-3xl font-black text-sb-tx">{formatMoney(wallet.balance)}</p>
      </div>
      {(wallet.recentTransactions || []).length > 0 && (
        <div className="space-y-2">
          {wallet.recentTransactions.slice(0, 4).map((transaction) => (
            <DataRow key={transaction.transactionId} item={{ ...transaction, status: transaction.transactionType }} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await dashboardService.getDashboard();
      setDashboard(response.data || null);
    } catch (err) {
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const resolvedRole = normalizeRole(role, dashboard?.role);
  const roleMeta = ROLE_META[resolvedRole] || ROLE_META.Spectator;
  const RoleIcon = roleMeta.icon;
  const metrics = dashboard?.metrics || [];
  const sections = LIST_SECTIONS_BY_ROLE[resolvedRole] || LIST_SECTIONS_BY_ROLE.Spectator;

  const heroName = useMemo(() => user?.fullName || user?.username || "Racing Member", [user]);

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

        <section className="relative overflow-hidden rounded-2xl border border-sb-border bg-sb-s1 min-h-[236px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,183,64,0.16),transparent_34%),linear-gradient(135deg,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${roleMeta.accent}`}>
                    <RoleIcon size={13} /> {roleMeta.label}
                  </span>
                  <span className="rounded-full border border-sb-border bg-sb-s2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-sb-tx-3">
                    Horse Racing Season 2026
                  </span>
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-black text-sb-tx leading-tight">
                  Welcome back, {heroName}
                </h1>
                <p className="mt-2 text-sm md:text-base text-sb-tx-2">
                  {roleMeta.subtitle}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate(roleMeta.primaryPath)} className="btn-gold inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold">
                  {roleMeta.primaryLabel} <ChevronRight size={15} />
                </button>
                <button onClick={loadDashboard} disabled={loading} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-sb-s2 hover:bg-sb-s3 border border-sb-border text-sb-tx-2 text-sm font-semibold transition-all">
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {[...Array(4)].map((_, index) => <div key={index} className="h-28 shimmer rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {metrics.map((metric, index) => (
              <MetricCard key={`${metric.label}-${index}`} metric={metric} index={index} roleMeta={roleMeta} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 space-y-5">
            {sections.slice(0, 2).map((section) => (
              <DataSection key={section} name={section} data={dashboard || {}} />
            ))}
          </div>
          <div className="space-y-5">
            <WalletPanel wallet={dashboard?.wallet} />
            {sections.slice(2).map((section) => (
              <DataSection key={section} name={section} data={dashboard || {}} />
            ))}
            <section className="rounded-2xl border border-sb-border bg-sb-s1 p-5">
              <SectionHeader icon={Bell} title="Dashboard Notes" />
              <p className="mt-3 text-sm text-sb-tx-3">
                Dashboard data is scoped to your role and current account permissions.
              </p>
            </section>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
