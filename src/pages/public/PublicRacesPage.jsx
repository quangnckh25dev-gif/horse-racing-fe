import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Calendar, Clock, Zap, CheckCircle2, XCircle,
  Trophy, Users, TrendingUp, Star, LogIn, ChevronRight,
} from "lucide-react";
import { spectatorService } from "../../services/spectator";
import { useLenis } from "../../hooks/useLenis";

/* ── Scroll reveal helper component ───────────────────────── */
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
  return (
    <div ref={ref} className={`scroll-reveal ${delay} ${className}`}>
      {children}
    </div>
  );
}

/* ── Status config ─────────────────────────────────────────── */
const STATUS = {
  Scheduled:        { label: "Sắp diễn ra",  cls: "bg-blue-100 text-blue-700 border-blue-200",    bar: "bg-blue-400",   borderCls: "border-l-blue-glow",   icon: Clock },
  RegistrationOpen: { label: "Mở đăng ký",   cls: "bg-purple-100 text-purple-700 border-purple-200", bar: "bg-purple-400", borderCls: "border-l-purple-glow", icon: Calendar },
  Ongoing:          { label: "Đang diễn ra", cls: "bg-amber-100 text-amber-700 border-amber-200",  bar: "bg-amber-400",  borderCls: "border-l-gold-glow",   icon: Zap, live: true },
  Finished:         { label: "Đã kết thúc",  cls: "bg-green-100 text-green-700 border-green-200",  bar: "bg-green-400",  borderCls: "border-l-green-glow",  icon: CheckCircle2 },
  Cancelled:        { label: "Đã huỷ",       cls: "bg-red-100 text-red-600 border-red-200",        bar: "bg-red-400",    borderCls: "border-l-red-glow",    icon: XCircle },
};

/* ── Race card ─────────────────────────────────────────────── */
function RaceCard({ race, index }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("revealed"); io.disconnect(); } },
      { threshold: 0.06, rootMargin: "0px 0px -30px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cfg = STATUS[race.status] || STATUS.Scheduled;
  const Icon = cfg.icon;
  const delayMap = ["", "sr-delay-1", "sr-delay-2", "sr-delay-3"];
  const delay = delayMap[index % 3] || "";

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })
    : "—";
  const fmtTime = (d) => d
    ? new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${delay} bg-white rounded-2xl border border-gray-100 ${cfg.borderCls} card-hover overflow-hidden`}
      style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.06)" }}
    >
      {/* Color bar */}
      <div className={`h-1 w-full ${cfg.bar} opacity-60`} />

      <div className="p-5">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-900 font-bold text-sm leading-snug line-clamp-2">
              {race.raceName || race.name || "Vòng đua"}
            </h3>
            {race.tournamentName && (
              <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1 truncate">
                <Trophy size={10} className="shrink-0" /> {race.tournamentName}
              </p>
            )}
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
            {cfg.live && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 live-dot" />}
            <Icon size={9} />
            {cfg.label}
          </span>
        </div>

        {/* Info */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar size={11} className="text-gray-400 shrink-0" />
            {fmtDate(race.startTime || race.raceDate)}
            {fmtTime(race.startTime || race.raceDate) && (
              <span className="text-gray-400">· {fmtTime(race.startTime || race.raceDate)}</span>
            )}
          </div>
          {race.distance && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <TrendingUp size={11} className="text-gray-400 shrink-0" />
              Cự ly {race.distance}m
            </div>
          )}
          {race.totalEntries !== undefined && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users size={11} className="text-gray-400 shrink-0" />
              {race.totalEntries} ngựa tham gia
            </div>
          )}
        </div>

        {/* Prize */}
        {race.prizePool && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-2">
            <Star size={11} className="text-[#D4AF37] shrink-0" />
            <span className="text-xs font-semibold text-amber-700">
              {typeof race.prizePool === "number"
                ? `${race.prizePool.toLocaleString("vi-VN")} VNĐ`
                : race.prizePool}
            </span>
          </div>
        )}

        {/* CTA */}
        <Link
          to="/login"
          className={`flex items-center justify-center gap-1.5 w-full h-9 rounded-xl text-xs font-bold transition-all ${
            race.status === "Ongoing"
              ? "btn-gold"
              : race.status === "Finished"
              ? "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
              : "btn-gold"
          }`}
        >
          {race.status === "Finished" ? (
            "Xem kết quả"
          ) : race.status === "Ongoing" ? (
            <><Zap size={12} /> Đặt cược LIVE</>
          ) : (
            <><LogIn size={12} /> Đặt cược</>
          )}
        </Link>
      </div>
    </div>
  );
}

/* ── Skeleton card ─────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.04)" }}>
      <div className="h-1 rounded-full shimmer mb-5" />
      <div className="h-4 w-3/4 rounded-lg shimmer mb-2" />
      <div className="h-3 w-1/2 rounded-lg shimmer mb-4" />
      <div className="h-3 w-full rounded-lg shimmer mb-2" />
      <div className="h-3 w-2/3 rounded-lg shimmer mb-4" />
      <div className="h-9 rounded-xl shimmer" />
    </div>
  );
}

/* ── Filter tabs ────────────────────────────────────────────── */
const FILTERS = [
  { key: "all",              label: "Tất cả" },
  { key: "Ongoing",          label: "Đang diễn ra" },
  { key: "RegistrationOpen", label: "Mở đăng ký" },
  { key: "Scheduled",        label: "Sắp diễn ra" },
  { key: "Finished",         label: "Kết thúc" },
];

/* ── Page ───────────────────────────────────────────────────── */
export default function PublicRacesPage() {
  useLenis();

  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    spectatorService.getRaces()
      .then((res) => setRaces(res.data || []))
      .catch(() => setRaces([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? races : races.filter((r) => r.status === filter);
  const counts = {
    Ongoing: races.filter((r) => r.status === "Ongoing").length,
    upcoming: races.filter((r) => ["Scheduled", "RegistrationOpen"].includes(r.status)).length,
    Finished: races.filter((r) => r.status === "Finished").length,
  };

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #FDFCF7 0%, #FAF8F0 60%, #F5F0E0 100%)", minHeight: 440 }}
      >
        {/* Grain / noise texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035] mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "180px 180px",
          }}
        />

        {/* Horse image — right-side decoration */}
        <div className="absolute right-0 top-0 h-full w-[55%] hidden lg:block pointer-events-none" style={{ opacity: 0.18 }}>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/bg-horse.png')",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0.9) 100%)",
              maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0.9) 100%)",
            }}
          />
        </div>

        <div className="absolute inset-0 bg-dot-grid opacity-50 pointer-events-none" />
        <div className="absolute right-0 top-0 w-[600px] h-[500px] bg-amber-300/[0.07] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -left-32 bottom-0 w-96 h-96 bg-purple-300/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 flex flex-col items-start">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700 mb-7 animate-bounce-in">
            {counts.Ongoing > 0
              ? <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 live-dot" /> {counts.Ongoing} cuộc đua đang diễn ra</>
              : <><Calendar size={11} /> Lịch thi đấu đua ngựa Việt Nam</>
            }
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-gray-900 mb-5 animate-fade-in-up leading-[1.1]">
            Đua Ngựa
            <br />
            <span className="text-gold-gradient">Việt Nam</span>
          </h1>
          <p className="text-gray-500 text-lg mb-9 animate-fade-in-up stagger-2 leading-relaxed max-w-lg">
            Theo dõi lịch thi đấu real-time, kết quả và đặt cược trực tuyến — không cần đăng nhập để xem.
          </p>

          <div className="flex items-center gap-3 animate-fade-in-up stagger-3">
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-gold font-bold text-sm">
              Tham gia ngay <ChevronRight size={15} />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50 text-sm font-semibold text-gray-700 transition-all">
              Đăng nhập
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────── */}
      <div className="bg-white border-y border-gray-100" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {[
              { label: "Đang diễn ra", value: counts.Ongoing,  bg: "bg-amber-50",  text: "text-amber-600" },
              { label: "Sắp diễn ra",  value: counts.upcoming,  bg: "bg-blue-50",   text: "text-blue-600" },
              { label: "Đã kết thúc",  value: counts.Finished, bg: "bg-green-50",  text: "text-green-600" },
            ].map((s) => (
              <div key={s.label} className="px-6 py-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <span className={`text-xl font-black ${s.text}`}>{loading ? "—" : s.value}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                  <p className="text-[10px] text-gray-300">cuộc đua</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Race list ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          {FILTERS.map((f) => {
            const count = f.key === "all" ? races.length : races.filter((r) => r.status === f.key).length;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  filter === f.key
                    ? "bg-[#D4AF37] text-[#111] shadow-[0_0_16px_rgba(212,175,55,0.35)]"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-amber-200 hover:text-amber-700 hover:bg-amber-50"
                }`}
              >
                {f.label}
                {filter !== f.key && <span className="ml-1.5 text-xs opacity-60">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Trophy size={44} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Không có cuộc đua nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((race, i) => (
              <RaceCard key={race.raceId || i} race={race} index={i} />
            ))}
          </div>
        )}

        {/* Login CTA */}
        {!loading && races.length > 0 && (
          <Reveal className="mt-14 text-center">
            <div
              className="inline-block px-10 py-7 rounded-2xl bg-white border border-amber-100"
              style={{ boxShadow: "0 4px 24px rgba(212,175,55,0.1)" }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy size={18} className="text-[#D4AF37]" />
                <p className="text-gray-800 font-bold text-sm">Sẵn sàng đặt cược?</p>
              </div>
              <p className="text-gray-400 text-xs mb-5">Đăng nhập để theo dõi và đặt cược real-time</p>
              <div className="flex items-center justify-center gap-3">
                <Link to="/login" className="px-5 py-2.5 rounded-xl btn-gold text-sm font-bold">
                  Đăng nhập ngay
                </Link>
                <Link to="/register" className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-amber-200 hover:bg-amber-50 transition-all">
                  Tạo tài khoản
                </Link>
              </div>
            </div>
          </Reveal>
        )}
      </section>
    </>
  );
}
