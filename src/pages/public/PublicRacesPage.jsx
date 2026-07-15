import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar, Clock, Zap, CheckCircle2, XCircle, Trophy, Users,
  TrendingUp, Star, ChevronRight, AlertCircle, Loader2,
} from "lucide-react";
import { spectatorService } from "../../services/spectator";
import { leaderboardService } from "../../services/leaderboard";
import { useLenis } from "../../hooks/useLenis";
import { useAuth } from "../../context/AuthContext";
import { SbCard } from "@/components/sb/Card";
import { SbButton } from "@/components/sb/Button";
import { SbBadge } from "@/components/sb/Badge";

/* ── Scroll reveal ── */
function Reveal({ children, className = "", delay = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("revealed"); io.disconnect(); } },
      { threshold: 0.06, rootMargin: "0px 0px -36px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`scroll-reveal ${delay} ${className}`}>{children}</div>;
}

/* ── Status config ── */
const STATUS = {
  Scheduled:        { label: "Sắp diễn ra",  variant: "sched", bar: "bg-sb-info",    live: false, icon: Clock },
  RegistrationOpen: { label: "Mở đăng ký",   variant: "open",  bar: "bg-sb-emerald", live: false, icon: Calendar },
  Ongoing:          { label: "Đang diễn ra", variant: "live",  bar: "bg-sb-live",    live: true,  icon: Zap },
  Finished:         { label: "Đã kết thúc",  variant: "fin",   bar: "bg-sb-tx-3",    live: false, icon: CheckCircle2 },
  Cancelled:        { label: "Đã huỷ",       variant: "lose",  bar: "bg-sb-lose",    live: false, icon: XCircle },
};

/* ── Race card ── */
function RaceCard({ race, index }) {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [noPermMsg, setNoPermMsg] = useState(null);

  const handleBetClick = () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (role === "Spectator") { navigate("/spectator/betting"); return; }
    setNoPermMsg("Bạn không có quyền đặt cược");
    setTimeout(() => setNoPermMsg(null), 3000);
  };
  const handleResultClick = () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (role === "Spectator") { navigate("/spectator/schedule"); return; }
    setNoPermMsg("Bạn không có quyền xem kết quả");
    setTimeout(() => setNoPermMsg(null), 3000);
  };

  const cfg = STATUS[race.status] || STATUS.Scheduled;
  const Icon = cfg.icon;
  const delayMap = ["", "sr-delay-1", "sr-delay-2"];
  const delay = delayMap[index % 3] || "";

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" }) : "—";
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <Reveal delay={delay}>
      <SbCard className="overflow-hidden transition hover:-translate-y-0.5 hover:border-sb-border-2">
        <div className={`h-1 w-full ${cfg.bar} opacity-70`} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sb-tx font-extrabold text-sm leading-snug line-clamp-2">
                {race.raceName || race.name || "Vòng đua"}
              </h3>
              {race.tournamentName && (
                <p className="text-[11px] text-sb-tx-3 mt-1 flex items-center gap-1 truncate">
                  <Trophy size={10} className="shrink-0" /> {race.tournamentName}
                </p>
              )}
            </div>
            <SbBadge variant={cfg.variant} live={cfg.live} className="shrink-0">
              <Icon size={9} /> {cfg.label}
            </SbBadge>
          </div>

          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-xs text-sb-tx-2">
              <Calendar size={11} className="text-sb-tx-3 shrink-0" />
              {fmtDate(race.startTime || race.raceDate)}
              {fmtTime(race.startTime || race.raceDate) && (
                <span className="text-sb-tx-3">· {fmtTime(race.startTime || race.raceDate)}</span>
              )}
            </div>
            {race.distance && (
              <div className="flex items-center gap-2 text-xs text-sb-tx-2">
                <TrendingUp size={11} className="text-sb-tx-3 shrink-0" /> Cự ly {race.distance}m
              </div>
            )}
            {race.totalEntries !== undefined && (
              <div className="flex items-center gap-2 text-xs text-sb-tx-2">
                <Users size={11} className="text-sb-tx-3 shrink-0" /> {race.totalEntries} ngựa tham gia
              </div>
            )}
          </div>

          {race.prizePool && (
            <div className="mb-4 px-3 py-2 rounded-xl bg-sb-gold-soft border border-sb-gold-bd flex items-center gap-2">
              <Star size={11} className="text-sb-gold-2 shrink-0" />
              <span className="text-xs font-bold text-sb-gold-2">
                {typeof race.prizePool === "number" ? `${race.prizePool.toLocaleString("vi-VN")} ₫` : race.prizePool}
              </span>
            </div>
          )}

          {noPermMsg && (
            <div className="mb-2 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-xs">
              <AlertCircle size={12} className="shrink-0" /> {noPermMsg}
            </div>
          )}

          <SbButton
            variant={race.status === "Finished" ? "ghost" : "bet"}
            size="sm"
            className="w-full"
            onClick={race.status === "Finished" ? handleResultClick : handleBetClick}
          >
            {race.status === "Finished" ? "Xem kết quả"
              : race.status === "Ongoing" ? <><Zap size={12} /> Đặt cược LIVE</>
              : "Đặt cược"}
          </SbButton>
        </div>
      </SbCard>
    </Reveal>
  );
}

/* ── Skeleton ── */
function SkeletonCard() {
  return (
    <SbCard className="p-5">
      <div className="h-4 w-3/4 rounded-lg bg-sb-s3 animate-pulse mb-3" />
      <div className="h-3 w-1/2 rounded-lg bg-sb-s3 animate-pulse mb-4" />
      <div className="h-3 w-full rounded-lg bg-sb-s3 animate-pulse mb-2" />
      <div className="h-3 w-2/3 rounded-lg bg-sb-s3 animate-pulse mb-4" />
      <div className="h-9 rounded-xl bg-sb-s3 animate-pulse" />
    </SbCard>
  );
}

const FILTERS = [
  { key: "all",              label: "Tất cả" },
  { key: "Ongoing",          label: "Đang diễn ra" },
  { key: "RegistrationOpen", label: "Mở đăng ký" },
  { key: "Scheduled",        label: "Sắp diễn ra" },
  { key: "Finished",         label: "Kết thúc" },
];

/* ── Page ── */
export default function PublicRacesPage() {
  useLenis();
  const { isAuthenticated } = useAuth();

  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const [lbTab, setLbTab] = useState("jockey");
  const [jockeys, setJockeys] = useState([]);
  const [horses, setHorses] = useState([]);
  const [lbLoading, setLbLoading] = useState(true);
  const [lbError, setLbError] = useState("");

  useEffect(() => {
    spectatorService.getRaces()
      .then((res) => setRaces(res.data || []))
      .catch(() => setRaces([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    Promise.all([
      leaderboardService.getGlobalJockeyLeaderboard(),
      leaderboardService.getGlobalHorseLeaderboard(),
    ])
      .then(([jRes, hRes]) => { setJockeys(jRes.data || []); setHorses(hRes.data || []); })
      .catch((e) => setLbError(e.message || "Không thể tải bảng xếp hạng"))
      .finally(() => setLbLoading(false));
  }, []);

  const filtered = filter === "all" ? races : races.filter((r) => r.status === filter);
  const counts = {
    Ongoing: races.filter((r) => r.status === "Ongoing").length,
    upcoming: races.filter((r) => ["Scheduled", "RegistrationOpen"].includes(r.status)).length,
    Finished: races.filter((r) => r.status === "Finished").length,
  };
  const lbData = lbTab === "jockey" ? jockeys : horses;
  const nameKey = lbTab === "jockey" ? "jockeyName" : "horseName";

  return (
    <>
      {/* ── Hero (dark) ── */}
      <section
        className="relative overflow-hidden border-b border-sb-border"
        style={{
          background:
            "radial-gradient(900px 380px at 80% -10%, rgba(16,185,129,.14), transparent 60%)," +
            "radial-gradient(700px 340px at 8% 110%, rgba(244,183,64,.08), transparent 60%), #0B0F14",
        }}
      >
        <div
          className="absolute right-0 top-0 h-full w-[55%] hidden lg:block pointer-events-none opacity-[0.14]"
          style={{
            backgroundImage: "url('/bg-horse.png')",
            backgroundSize: "cover", backgroundPosition: "center",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,.7) 40%, #000 100%)",
            maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,.7) 40%, #000 100%)",
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sb-emerald-soft border border-sb-emerald-bd text-xs font-bold text-sb-emerald-ink mb-6">
            {counts.Ongoing > 0
              ? <><span className="w-1.5 h-1.5 rounded-full bg-sb-live live-dot" /> {counts.Ongoing} cuộc đua đang diễn ra</>
              : <><Calendar size={11} /> Lịch thi đấu đua ngựa Việt Nam</>}
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-sb-tx mb-5 leading-[1.05]">
            Đua Ngựa<br />
            <span className="bg-gradient-to-r from-sb-gold-2 to-sb-gold bg-clip-text text-transparent">Việt Nam</span>
          </h1>
          <p className="text-sb-tx-2 text-lg mb-8 max-w-lg leading-relaxed">
            Theo dõi lịch thi đấu real-time, kết quả và đặt cược trực tuyến — không cần đăng nhập để xem.
          </p>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard"><SbButton variant="bet">Vào Dashboard</SbButton></Link>
            ) : (
              <>
                <Link to="/register"><SbButton variant="bet">Tham gia ngay <ChevronRight size={15} /></SbButton></Link>
                <Link to="/login"><SbButton variant="ghost">Đăng nhập</SbButton></Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className="bg-sb-s1 border-b border-sb-border">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 divide-x divide-sb-border">
          {[
            { label: "Đang diễn ra", value: counts.Ongoing,  cls: "bg-sb-live/10 text-sb-live" },
            { label: "Sắp diễn ra",  value: counts.upcoming, cls: "bg-sb-info/10 text-sb-info" },
            { label: "Đã kết thúc",  value: counts.Finished, cls: "bg-sb-emerald-soft text-sb-emerald-ink" },
          ].map((s) => (
            <div key={s.label} className="px-6 py-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.cls}`}>
                <span className="text-xl font-black tabular-nums">{loading ? "—" : s.value}</span>
              </div>
              <div>
                <p className="text-xs text-sb-tx-2 font-semibold">{s.label}</p>
                <p className="text-[10px] text-sb-tx-3">cuộc đua</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Race list ── */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          {FILTERS.map((f) => {
            const count = f.key === "all" ? races.length : races.filter((r) => r.status === f.key).length;
            const active = filter === f.key;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition ${
                  active
                    ? "bg-sb-emerald text-[#04241B] shadow-[0_4px_16px_rgba(16,185,129,.3)]"
                    : "bg-sb-s1 border border-sb-border text-sb-tx-2 hover:border-sb-emerald hover:text-sb-emerald"
                }`}>
                {f.label}{!active && <span className="ml-1.5 text-xs opacity-60">{count}</span>}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Trophy size={44} className="text-sb-tx-3 mx-auto mb-4 opacity-40" />
            <p className="text-sb-tx-3 text-sm">Không có cuộc đua nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((race, i) => <RaceCard key={race.raceId || i} race={race} index={i} />)}
          </div>
        )}
      </section>

      {/* ── Leaderboard ── */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <Reveal>
          <SbCard>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-sb-border flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sb-gold-soft border border-sb-gold-bd flex items-center justify-center">
                  <Trophy size={16} className="text-sb-gold-2" />
                </div>
                <div>
                  <h2 className="text-sb-tx font-extrabold text-sm">Bảng xếp hạng</h2>
                  <p className="text-sb-tx-3 text-[11px]">Top nài ngựa và ngựa đua xuất sắc nhất</p>
                </div>
              </div>
              <div className="flex bg-sb-s2 rounded-xl p-1 border border-sb-border">
                {[{ id: "jockey", label: "🏇 Nài ngựa" }, { id: "horse", label: "🐴 Ngựa đua" }].map((t) => (
                  <button key={t.id} onClick={() => setLbTab(t.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                      lbTab === t.id ? "bg-sb-emerald-soft text-sb-emerald-ink" : "text-sb-tx-2 hover:text-sb-tx"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {lbLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-sb-emerald" />
              </div>
            ) : lbError ? (
              <div className="flex items-center gap-2 p-4 m-4 rounded-xl bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm">
                <AlertCircle size={14} /> {lbError}
              </div>
            ) : lbData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-sb-tx-3">
                <Trophy size={36} className="mb-3 opacity-30" />
                <p className="text-sm font-semibold text-sb-tx-2">Chưa có dữ liệu xếp hạng</p>
                <p className="text-xs mt-1">Dữ liệu sẽ xuất hiện sau khi có kết quả đua</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-sb-s2 border-b border-sb-border">
                      <th className="text-left px-5 py-3 text-[10px] font-extrabold text-sb-tx-3 uppercase tracking-widest w-12">#</th>
                      <th className="text-left px-5 py-3 text-[10px] font-extrabold text-sb-tx-3 uppercase tracking-widest">
                        {lbTab === "jockey" ? "Nài ngựa" : "Ngựa đua"}
                      </th>
                      <th className="text-center px-5 py-3 text-[10px] font-extrabold text-sb-tx-3 uppercase tracking-widest">Thắng</th>
                      <th className="text-center px-5 py-3 text-[10px] font-extrabold text-sb-tx-3 uppercase tracking-widest">Điểm</th>
                      <th className="text-center px-5 py-3 text-[10px] font-extrabold text-sb-tx-3 uppercase tracking-widest">Số cuộc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lbData.slice(0, 10).map((item, idx) => (
                      <tr key={idx} className="border-b border-sb-border hover:bg-white/5 transition">
                        <td className="px-5 py-3">
                          {idx < 3
                            ? <span className="text-lg">{["🥇", "🥈", "🥉"][idx]}</span>
                            : <span className="text-sb-tx-3 font-bold tabular-nums">{idx + 1}</span>}
                        </td>
                        <td className="px-5 py-3">
                          {/* BE trả { name, points } — giữ fallback tên cũ cho chắc */}
                          <p className="text-sb-tx font-semibold">{item.name || item[nameKey] || "—"}</p>
                          {item.ownerName && <p className="text-sb-tx-3 text-xs">🏠 {item.ownerName}</p>}
                        </td>
                        <td className="px-5 py-3 text-center"><span className="text-sb-emerald-ink font-bold tabular-nums">{item.totalWins ?? "—"}</span></td>
                        <td className="px-5 py-3 text-center"><span className="text-sb-gold-2 font-bold tabular-nums">{item.points ?? item.totalPoints ?? "—"}</span></td>
                        <td className="px-5 py-3 text-center"><span className="text-sb-tx-2 tabular-nums">{item.totalRaces ?? "—"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SbCard>
        </Reveal>
      </section>
    </>
  );
}
