import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Edit2, Trash2, Eye, AlertCircle, Loader2,
  RefreshCw, Flag, ChevronDown, X, Check,
  Clock, Zap, Trophy, Users, Calendar,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { organizerService } from "../../services/organizer";
import { tournamentService } from "../../services/tournament";
import { useAuth } from "../../context/AuthContext";

const STATUS_CONFIG = {
  Scheduled:        { label: "Sắp diễn ra",  color: "bg-blue-500/20 text-blue-300 border-blue-500/40 badge-glow-blue",       borderCls: "border-l-blue-glow",   icon: Clock,     iconCls: "text-blue-400",    glow: "hover:shadow-blue-500/10" },
  RegistrationOpen: { label: "Mở đăng ký",   color: "bg-purple-500/20 text-purple-300 border-purple-500/40",                 borderCls: "border-l-purple-glow", icon: Calendar,  iconCls: "text-purple-400",  glow: "hover:shadow-purple-500/10" },
  Ongoing:          { label: "Đang diễn ra", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 badge-glow-yellow", borderCls: "border-l-gold-glow",   icon: Zap,       iconCls: "text-[#D4AF37]",   glow: "hover:shadow-yellow-500/10" },
  Finished:         { label: "Đã kết thúc",  color: "bg-green-500/20 text-green-300 border-green-500/40 badge-glow-green",   borderCls: "border-l-green-glow",  icon: Trophy,    iconCls: "text-green-400",   glow: "hover:shadow-green-500/10" },
  Cancelled:        { label: "Đã huỷ",       color: "bg-red-500/20 text-red-300 border-red-500/40",                          borderCls: "border-l-red-glow",    icon: X,         iconCls: "text-red-400",     glow: "" },
};

const STATUS_TRANSITIONS = {
  Scheduled:        ["RegistrationOpen", "Cancelled"],
  RegistrationOpen: ["Ongoing", "Cancelled"],
  Ongoing:          ["Finished"],
  Finished:         [],
  Cancelled:        [],
};

const EMPTY_FORM = {
  tournamentId: "", roundId: "", raceName: "", startTime: "",
  distance: "1200", trackType: "Flat", maxEntries: "8",
  prizeFirst: "20000000", prizeSecond: "10000000", prizeThird: "5000000",
};

const EMPTY_TOURNAMENT = {
  tournamentName: "", location: "", startDate: "", endDate: "",
  budgetTotal: "50000000", maxHorses: "20", maxParticipants: "20",
};

const inputCls = "w-full bg-[#070B14] border border-sb-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.08)] transition-all";

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "bg-gray-500/20 text-sb-tx-3 border-gray-500/40" };
  const isLive = status === "Ongoing";
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${cfg.color}`}>
      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot shrink-0" />}
      {cfg.label}
    </span>
  );
}

function Modal({ title, accentColor = "#D4AF37", onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
      <div className="bg-[#0d1117] border border-sb-border rounded-2xl w-full max-w-lg shadow-2xl shadow-black/60 animate-scale-in">
        <div className="h-0.5 w-full rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
        <div className="flex items-center justify-between px-6 py-4 border-b border-sb-border">
          <h3 className="text-white font-bold">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-sb-tx-3 hover:text-sb-tx hover:bg-sb-s1/5 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const lbl = "block text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-1.5";

function RaceForm({ form, onChange, onSubmit, onCancel, loading, submitLabel,
  tournaments, rounds, onAddRound, roundBusy }) {
  const editing = submitLabel !== "Tạo vòng đua";
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!editing && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Giải đấu *</label>
            <select name="tournamentId" value={form.tournamentId} onChange={onChange} required className={inputCls}>
              <option value="">-- Chọn giải đấu --</option>
              {tournaments.map((t) => <option key={t.tournamentId} value={t.tournamentId}>{t.tournamentName}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Vòng *</label>
            <div className="flex gap-2">
              <select name="roundId" value={form.roundId} onChange={onChange} required disabled={!form.tournamentId} className={inputCls + " disabled:opacity-40"}>
                <option value="">{form.tournamentId ? "-- Chọn vòng --" : "Chọn giải trước"}</option>
                {rounds.map((r) => <option key={r.roundId} value={r.roundId}>{r.roundName}</option>)}
              </select>
              <button type="button" onClick={onAddRound} disabled={!form.tournamentId || roundBusy} title="Thêm vòng mới"
                className="px-3 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx-2 hover:text-sb-tx disabled:opacity-40 shrink-0">
                {roundBusy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={lbl}>Tên cuộc đua *</label>
          <input name="raceName" value={form.raceName} onChange={onChange} required className={inputCls} placeholder="VD: Vòng chung kết mùa hè" />
        </div>
        <div>
          <label className={lbl}>Thời gian đua *</label>
          <input name="startTime" type="datetime-local" value={form.startTime} onChange={onChange} required className={inputCls} />
          {!editing && (() => {
            const t = tournaments.find((x) => String(x.tournamentId) === String(form.tournamentId));
            return t?.startDate ? (
              <p className="text-sb-tx-3 text-[11px] mt-1">Phải trong khoảng giải: {String(t.startDate).slice(0, 10)} → {String(t.endDate).slice(0, 10)}</p>
            ) : null;
          })()}
        </div>
        <div>
          <label className={lbl}>Cự ly (m)</label>
          <input name="distance" type="number" value={form.distance} onChange={onChange} className={inputCls} placeholder="1200" />
        </div>
        <div>
          <label className={lbl}>Loại đường</label>
          <select name="trackType" value={form.trackType} onChange={onChange} className={inputCls}>
            <option value="Flat">Đường bằng (Flat)</option>
            <option value="Turf">Cỏ (Turf)</option>
            <option value="Dirt">Đất (Dirt)</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Số ngựa tối đa</label>
          <input name="maxEntries" type="number" value={form.maxEntries} onChange={onChange} className={inputCls} placeholder="8" />
        </div>
        <div>
          <label className={lbl}>Giải nhất (VNĐ)</label>
          <input name="prizeFirst" type="number" value={form.prizeFirst} onChange={onChange} className={inputCls} placeholder="20000000" />
        </div>
        <div>
          <label className={lbl}>Giải nhì</label>
          <input name="prizeSecond" type="number" value={form.prizeSecond} onChange={onChange} className={inputCls} placeholder="10000000" />
        </div>
        <div>
          <label className={lbl}>Giải ba</label>
          <input name="prizeThird" type="number" value={form.prizeThird} onChange={onChange} className={inputCls} placeholder="5000000" />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm transition-colors">Huỷ</button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 btn-gold-glow transition-all">
          {loading && <Loader2 size={14} className="animate-spin" />} {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function OrganizerRacesPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [showStatus, setShowStatus] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Giải đấu + vòng của Organizer (race cần tournamentId + roundId)
  const [tournaments, setTournaments] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [roundBusy, setRoundBusy] = useState(false);
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [tournamentForm, setTournamentForm] = useState(EMPTY_TOURNAMENT);
  const [tBusy, setTBusy] = useState(false);
  const [tError, setTError] = useState("");

  const fetchRaces = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await organizerService.getRaces();
      setRaces(res.data || []);
    } catch (e) {
      setError(e.message || "Không thể tải danh sách vòng đua");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTournaments = useCallback(async () => {
    try {
      const res = await organizerService.getTournaments();
      setTournaments(res.data || []);
    } catch { setTournaments([]); }
  }, []);

  useEffect(() => { fetchRaces(); fetchTournaments(); }, [fetchRaces, fetchTournaments]);

  // Khi chọn giải đấu → tải danh sách vòng
  useEffect(() => {
    if (!formData.tournamentId) { setRounds([]); return; }
    let alive = true;
    tournamentService.getPublicRounds(formData.tournamentId)
      .then((r) => { if (alive) setRounds(r.data || []); })
      .catch(() => { if (alive) setRounds([]); });
    return () => { alive = false; };
  }, [formData.tournamentId]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value, ...(name === "tournamentId" ? { roundId: "" } : {}) }));
  };

  // Map field FE → body BE cho POST /organizer/races
  const toRacePayload = (f) => ({
    tournamentId: Number(f.tournamentId),
    roundId: Number(f.roundId),
    raceName: f.raceName,
    raceDate: f.startTime,
    trackLength: Number(f.distance) || 1200,
    trackType: f.trackType || "Flat",
    maxParticipants: Number(f.maxEntries) || 8,
    prizeFirst: Number(f.prizeFirst) || 0,
    prizeSecond: Number(f.prizeSecond) || 0,
    prizeThird: Number(f.prizeThird) || 0,
    status: "Scheduled",
    registrationOpen: new Date().toISOString().slice(0, 16),
    registrationClose: f.startTime,
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.tournamentId || !formData.roundId) { setFormError("Vui lòng chọn giải đấu và vòng."); return; }
    setFormLoading(true); setFormError("");
    try {
      await organizerService.createRace(toRacePayload(formData));
      setShowCreate(false); setFormData(EMPTY_FORM); fetchRaces();
    } catch (err) { setFormError(err.message || "Tạo cuộc đua thất bại"); }
    finally { setFormLoading(false); }
  };

  // Tạo nhanh 1 vòng cho giải đang chọn
  const handleAddRound = async () => {
    if (!formData.tournamentId) return;
    setRoundBusy(true);
    try {
      const order = rounds.length + 1;
      const today = new Date().toISOString().slice(0, 10);
      await tournamentService.createRound(formData.tournamentId, {
        roundName: `Vòng ${order}`, roundOrder: order, startDate: today, endDate: today,
      });
      const r = await tournamentService.getPublicRounds(formData.tournamentId);
      setRounds(r.data || []);
    } catch (err) { setFormError(err.message || "Tạo vòng thất bại"); }
    finally { setRoundBusy(false); }
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault(); setTBusy(true); setTError("");
    try {
      const res = await tournamentService.create({
        tournamentName: tournamentForm.tournamentName,
        location: tournamentForm.location,
        startDate: tournamentForm.startDate,
        endDate: tournamentForm.endDate,
        budgetTotal: Number(tournamentForm.budgetTotal) || 0,
        maxHorses: Number(tournamentForm.maxHorses) || 20,
        maxParticipants: Number(tournamentForm.maxParticipants) || 20,
      });
      await fetchTournaments();
      setShowCreateTournament(false);
      setTournamentForm(EMPTY_TOURNAMENT);
      // mở luôn form tạo race với giải vừa tạo
      const newId = res.data?.tournamentId;
      if (newId) { setFormData({ ...EMPTY_FORM, tournamentId: String(newId) }); setFormError(""); setShowCreate(true); }
    } catch (err) { setTError(err.message || "Tạo giải đấu thất bại"); }
    finally { setTBusy(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setFormLoading(true); setFormError("");
    try {
      await organizerService.updateRace(showEdit.raceId, toRacePayload({
        ...formData,
        tournamentId: formData.tournamentId || showEdit.tournamentId,
        roundId: formData.roundId || showEdit.roundId,
      }));
      setShowEdit(null); fetchRaces();
    } catch (err) { setFormError(err.message || "Cập nhật thất bại"); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await organizerService.deleteRace(showDelete.raceId);
      setShowDelete(null); fetchRaces();
    } catch (err) { setFormError(err.message || "Xoá thất bại"); }
    finally { setFormLoading(false); }
  };

  const handleChangeStatus = async (newStatus) => {
    setFormLoading(true);
    try {
      await organizerService.changeRaceStatus(showStatus.raceId, newStatus);
      setShowStatus(null); fetchRaces();
    } catch (err) { alert(err.message || "Đổi trạng thái thất bại"); }
    finally { setFormLoading(false); }
  };

  const openEdit = (race) => {
    setFormData({
      tournamentId: race.tournamentId || "", roundId: race.roundId || "",
      raceName: race.raceName || "",
      startTime: (race.raceDate || race.startTime) ? (race.raceDate || race.startTime).slice(0, 16) : "",
      distance: race.trackLength || race.distance || "1200",
      trackType: race.trackType || "Flat",
      maxEntries: race.maxParticipants || race.maxEntries || "8",
      prizeFirst: race.prizeFirst || "", prizeSecond: race.prizeSecond || "", prizeThird: race.prizeThird || "",
    });
    setShowEdit(race); setFormError("");
  };

  const filtered = filterStatus === "all" ? races : races.filter((r) => r.status === filterStatus);

  const scheduledCount  = races.filter((r) => r.status === "Scheduled").length;
  const regOpenCount    = races.filter((r) => r.status === "RegistrationOpen").length;
  const ongoingCount    = races.filter((r) => r.status === "Ongoing").length;
  const finishedCount   = races.filter((r) => r.status === "Finished").length;

  return (
    <AdminLayout title="Quản lý vòng đua">

      {/* ── Page Header Banner ── */}
      <div className="page-header">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-blue-500/[0.04] to-transparent pointer-events-none" />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-6xl opacity-[0.07] pointer-events-none select-none animate-float">🏁</div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Flag size={14} className="text-blue-400" />
              </div>
              <span className="text-[10px] font-bold text-sb-tx-3 uppercase tracking-widest">Ban tổ chức</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Quản lý vòng đua</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="stat-pill"><span className="text-white font-bold">{races.length}</span> vòng đua</span>
              {ongoingCount > 0 && (
                <span className="stat-pill text-yellow-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot inline-block" /> {ongoingCount} đang diễn ra
                </span>
              )}
              {(scheduledCount + regOpenCount) > 0 && <span className="stat-pill text-blue-400">{scheduledCount + regOpenCount} sắp diễn ra</span>}
              {finishedCount > 0 && <span className="stat-pill text-green-400">{finishedCount} đã kết thúc</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={fetchRaces}
              className="flex items-center gap-2 px-3 py-2 bg-sb-s2 border border-sb-border rounded-xl text-sb-tx-3 hover:text-sb-tx text-sm transition-all">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={() => { setTournamentForm(EMPTY_TOURNAMENT); setTError(""); setShowCreateTournament(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-sb-s2 border border-sb-border text-sb-tx-2 hover:text-sb-tx font-bold rounded-xl text-sm transition-all">
              <Trophy size={15} /> Tạo giải đấu
            </button>
            <button onClick={() => { setFormData(EMPTY_FORM); setFormError(""); setShowCreate(true); }}
              disabled={tournaments.length === 0}
              title={tournaments.length === 0 ? "Hãy tạo giải đấu trước" : ""}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold rounded-xl text-sm btn-gold-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <Plus size={15} /> Tạo cuộc đua
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* ── Filter tabs ── */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all",              label: "Tất cả",    count: races.length },
            { key: "Scheduled",        count: scheduledCount },
            { key: "RegistrationOpen", count: regOpenCount },
            { key: "Ongoing",          count: ongoingCount },
            { key: "Finished",         count: finishedCount },
            { key: "Cancelled",        count: races.filter(r => r.status === "Cancelled").length },
          ].map(({ key, label, count }) => {
            const cfg = STATUS_CONFIG[key];
            const isActive = filterStatus === key;
            return (
              <button key={key} onClick={() => setFilterStatus(key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#D4AF37] text-[#0A0E1A] shadow-[0_0_12px_rgba(212,175,55,0.3)]"
                    : "bg-sb-s1/[0.03] border border-sb-border text-sb-tx-3 hover:text-sb-tx hover:border-sb-border"
                }`}>
                {label || cfg?.label || key}
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? "bg-[#0A0E1A]/20" : "bg-sb-s1/10"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-300 text-sm">
            <AlertCircle size={15} className="text-red-400 shrink-0" /> {error}
            <button onClick={fetchRaces} className="ml-auto text-red-400 hover:text-red-200 text-xs underline">Thử lại</button>
          </div>
        )}

        {/* ── Race list ── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 shimmer rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center mb-4 animate-float">
              <Flag size={24} className="text-blue-500/40" />
            </div>
            <p className="text-white font-semibold mb-1">Chưa có vòng đua nào</p>
            <p className="text-sb-tx-3 text-sm">Tạo vòng đua đầu tiên để bắt đầu</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((race, idx) => {
              const cfg = STATUS_CONFIG[race.status] || { label: race.status, color: "bg-gray-500/20 text-sb-tx-3 border-gray-500/40", borderCls: "border-l-gray-glow", iconCls: "text-sb-tx-3", glow: "" };
              const StatusIcon = cfg.icon || Flag;
              return (
                <div
                  key={race.raceId}
                  className={`group relative bg-[#0d1117] border border-sb-border rounded-xl overflow-hidden card-hover hover:shadow-lg ${cfg.glow} ${cfg.borderCls} animate-fade-in-up`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Left: Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-sb-s1/[0.03] border border-sb-border ${cfg.iconCls}`}>
                      <StatusIcon size={17} />
                    </div>

                    {/* Center: Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                        <h3 className="text-white font-bold text-base leading-tight truncate">{race.raceName}</h3>
                        <StatusBadge status={race.status} />
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {race.startTime && (
                          <span className="flex items-center gap-1 text-sb-tx-3 text-xs">
                            <Clock size={10} /> {new Date(race.startTime).toLocaleString("vi-VN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                        {race.distance && (
                          <span className="stat-pill">📏 {race.distance}m</span>
                        )}
                        {race.maxEntries && (
                          <span className="stat-pill"><Users size={9} /> {race.maxEntries}</span>
                        )}
                        {race.prizePool && (
                          <span className="text-xs font-semibold text-[#D4AF37] neon-gold">
                            💰 {Number(race.prizePool).toLocaleString("vi-VN")} VNĐ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {STATUS_TRANSITIONS[race.status]?.length > 0 && (
                        <button onClick={() => setShowStatus(race)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/50 rounded-xl text-xs font-semibold transition-all">
                          <ChevronDown size={12} /> Đổi trạng thái
                        </button>
                      )}
                      <button onClick={() => navigate(`/organizer/races/${race.raceId}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-sb-s1/[0.03] border border-sb-border text-sb-tx-3 hover:text-sb-tx hover:border-gray-600 rounded-xl text-xs transition-all">
                        <Eye size={12} /> Chi tiết
                      </button>
                      <button onClick={() => openEdit(race)}
                        className="p-2 bg-sb-s1/[0.03] border border-sb-border text-sb-tx-3 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 rounded-xl transition-all">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => { setFormError(""); setShowDelete(race); }}
                        className="p-2 bg-sb-s1/[0.03] border border-sb-border text-sb-tx-3 hover:text-red-400 hover:border-red-900/50 rounded-xl transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <Modal title="Tạo cuộc đua mới" onClose={() => setShowCreate(false)}>
          {formError && <div className="mb-4 flex items-center gap-2 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-300 text-sm"><AlertCircle size={13} /> {formError}</div>}
          <RaceForm form={formData} onChange={handleFormChange} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={formLoading} submitLabel="Tạo vòng đua"
            tournaments={tournaments} rounds={rounds} onAddRound={handleAddRound} roundBusy={roundBusy} />
        </Modal>
      )}

      {showCreateTournament && (
        <Modal title="Tạo giải đấu mới" onClose={() => setShowCreateTournament(false)}>
          {tError && <div className="mb-4 flex items-center gap-2 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-300 text-sm"><AlertCircle size={13} /> {tError}</div>}
          <form onSubmit={handleCreateTournament} className="space-y-4">
            <div>
              <label className={lbl}>Tên giải đấu *</label>
              <input value={tournamentForm.tournamentName} onChange={(e) => setTournamentForm((p) => ({ ...p, tournamentName: e.target.value }))} required className={inputCls} placeholder="VD: Giải Đua Mùa Thu 2026" />
            </div>
            <div>
              <label className={lbl}>Địa điểm</label>
              <input value={tournamentForm.location} onChange={(e) => setTournamentForm((p) => ({ ...p, location: e.target.value }))} className={inputCls} placeholder="Hồ Chí Minh" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Ngày bắt đầu *</label>
                <input type="date" value={tournamentForm.startDate} onChange={(e) => setTournamentForm((p) => ({ ...p, startDate: e.target.value }))} required className={inputCls} />
              </div>
              <div>
                <label className={lbl}>Ngày kết thúc *</label>
                <input type="date" value={tournamentForm.endDate} onChange={(e) => setTournamentForm((p) => ({ ...p, endDate: e.target.value }))} required className={inputCls} />
              </div>
              <div>
                <label className={lbl}>Ngân sách (VNĐ)</label>
                <input type="number" value={tournamentForm.budgetTotal} onChange={(e) => setTournamentForm((p) => ({ ...p, budgetTotal: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={lbl}>Số ngựa tối đa</label>
                <input type="number" value={tournamentForm.maxHorses} onChange={(e) => setTournamentForm((p) => ({ ...p, maxHorses: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <p className="text-sb-tx-3 text-[11px]">Giải tạo ở trạng thái Nháp. Tạo cuộc đua xong, gửi Admin duyệt để mở đăng ký.</p>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowCreateTournament(false)} className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm transition-colors">Huỷ</button>
              <button type="submit" disabled={tBusy}
                className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 btn-gold-glow transition-all">
                {tBusy && <Loader2 size={14} className="animate-spin" />} Tạo giải đấu
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showEdit && (
        <Modal title={`Chỉnh sửa — ${showEdit.raceName}`} onClose={() => setShowEdit(null)}>
          {formError && <div className="mb-4 flex items-center gap-2 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-300 text-sm"><AlertCircle size={13} /> {formError}</div>}
          <RaceForm form={formData} onChange={handleFormChange} onSubmit={handleEdit} onCancel={() => setShowEdit(null)} loading={formLoading} submitLabel="Lưu thay đổi" />
        </Modal>
      )}

      {showDelete && (
        <Modal title="Xác nhận xoá" accentColor="rgb(239,68,68)" onClose={() => setShowDelete(null)}>
          {formError && <div className="mb-3 text-red-300 text-sm">{formError}</div>}
          <p className="text-sb-tx-3 text-sm mb-5">
            Bạn có chắc muốn xoá vòng đua <span className="text-white font-bold">"{showDelete.raceName}"</span>?
            Hành động này không thể hoàn tác.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDelete(null)} className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm transition-colors">Huỷ</button>
            <button onClick={handleDelete} disabled={formLoading}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
              {formLoading && <Loader2 size={14} className="animate-spin" />} Xoá
            </button>
          </div>
        </Modal>
      )}

      {showStatus && (
        <Modal title={`Đổi trạng thái vòng đua`} onClose={() => setShowStatus(null)}>
          <p className="text-sb-tx-3 text-xs mb-1 uppercase tracking-widest font-semibold">Vòng đua</p>
          <p className="text-white font-bold mb-4">{showStatus.raceName}</p>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-sb-tx-3 text-sm">Hiện tại:</span>
            <StatusBadge status={showStatus.status} />
          </div>
          <div className="space-y-2">
            {STATUS_TRANSITIONS[showStatus.status]?.map((newStatus) => {
              const newCfg = STATUS_CONFIG[newStatus];
              return (
                <button key={newStatus} onClick={() => handleChangeStatus(newStatus)} disabled={formLoading}
                  className="w-full py-3 px-4 rounded-xl border border-sb-border bg-sb-s2 text-white hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 text-sm font-medium transition-all flex items-center justify-between disabled:opacity-60">
                  <span>Chuyển sang <span className={`font-bold ${newCfg?.iconCls || "text-[#D4AF37]"}`}>{newCfg?.label}</span></span>
                  {formLoading ? <Loader2 size={14} className="animate-spin text-[#D4AF37]" /> : <Check size={14} className="text-sb-tx-2" />}
                </button>
              );
            })}
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
