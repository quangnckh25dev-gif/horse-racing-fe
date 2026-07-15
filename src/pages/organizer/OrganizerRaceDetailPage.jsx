import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Flag, Users, Award, FileText,
  AlertCircle, Loader2, Plus, Trash2, X,
  CheckCircle2, XCircle, Globe, RefreshCw,
  Clock, Zap, MapPin, Calendar, Trophy,
  Timer, User, Medal, ShieldCheck,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { organizerService } from "../../services/organizer";
import { raceResultService } from "../../services/raceResult";
import { useAuth } from "../../context/AuthContext";

const RACE_STATUS_CONFIG = {
  Scheduled:        { label: "Sắp diễn ra",  color: "bg-blue-500/20 text-blue-300 border-blue-500/40 badge-glow-blue",       icon: Clock,        dot: "bg-blue-400" },
  RegistrationOpen: { label: "Mở đăng ký",   color: "bg-purple-500/20 text-purple-300 border-purple-500/40",                 icon: Calendar,     dot: "bg-purple-400" },
  Ongoing:          { label: "Đang diễn ra", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 badge-glow-yellow", icon: Zap,          dot: "bg-yellow-400" },
  Finished:         { label: "Đã kết thúc",  color: "bg-green-500/20 text-green-300 border-green-500/40 badge-glow-green",   icon: CheckCircle2, dot: "bg-green-400" },
  Cancelled:        { label: "Đã huỷ",       color: "bg-red-500/20 text-red-300 border-red-500/40",                          icon: XCircle,      dot: "bg-red-400" },
};

const REFEREE_ROLES = ["MainReferee", "AssistantReferee", "TimingReferee", "StartReferee"];

const TABS = [
  { id: "info",     label: "Thông tin", icon: FileText },
  { id: "referees", label: "Trọng tài", icon: ShieldCheck },
  { id: "entries",  label: "Đội tham gia", icon: Users },
  { id: "results",  label: "Kết quả",   icon: Trophy },
];

const selectCls = "w-full bg-[#070B14] border border-sb-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60 transition-all";
const inputCls  = "w-full bg-[#070B14] border border-sb-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60 transition-all resize-none";
const labelCls  = "block text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-1.5";

function Modal({ title, accentColor = "#D4AF37", onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
      <div className="bg-[#0d1117] border border-sb-border rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
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

// ── Tab: Race Info ────────────────────────────────────────────────────────────
function InfoTab({ race }) {
  if (!race) return null;
  const statusCfg = RACE_STATUS_CONFIG[race.status] || {};

  const infoCards = [
    { icon: "🏁", label: "Tên vòng đua",        value: race.raceName,       accent: "#D4AF37" },
    { icon: "📅", label: "Bắt đầu",             value: race.startTime ? new Date(race.startTime).toLocaleString("vi-VN") : "—" },
    { icon: "🏁", label: "Kết thúc",            value: race.endTime ? new Date(race.endTime).toLocaleString("vi-VN") : "—" },
    { icon: "📏", label: "Cự ly",               value: race.distance ? `${race.distance}m` : "—" },
    { icon: "👥", label: "Tối đa tham gia",     value: race.maxEntries || "—" },
    { icon: "💰", label: "Giải thưởng",         value: race.prizePool ? `${Number(race.prizePool).toLocaleString("vi-VN")} VNĐ` : "—", accent: "#D4AF37" },
  ];

  return (
    <div className="space-y-4">
      {/* Status badge at top */}
      <div className="flex items-center gap-3 p-4 bg-sb-s2 rounded-xl border border-sb-border">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${statusCfg.color || "bg-gray-500/20 text-sb-tx-3 border-gray-600/40"}`}>
            {race.status === "Ongoing" && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot" />}
            {statusCfg.label || race.status}
          </span>
        </div>
        {race.tournamentName && (
          <span className="text-sb-tx-3 text-sm flex items-center gap-1.5">
            <Trophy size={12} className="text-[#D4AF37]" /> {race.tournamentName}
          </span>
        )}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {infoCards.map(({ icon, label, value, accent }) => (
          <div key={label} className="bg-sb-s2 border border-sb-border rounded-xl p-4 card-hover">
            <p className="text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <span>{icon}</span> {label}
            </p>
            <p className={`text-sm font-semibold ${accent ? "neon-gold" : "text-white"}`}
               style={accent ? { color: accent } : {}}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Description */}
      {race.description && (
        <div className="bg-sb-s2 border border-sb-border rounded-xl p-4">
          <p className="text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-2">📝 Mô tả</p>
          <p className="text-sb-tx-3 text-sm leading-relaxed">{race.description}</p>
        </div>
      )}
    </div>
  );
}

// ── Tab: Referees ─────────────────────────────────────────────────────────────
function RefereesTab({ raceId }) {
  const [assigned, setAssigned] = useState([]);
  const [allReferees, setAllReferees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ refereeId: "", role: "AssistantReferee" });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const ROLE_LABELS = {
    MainReferee:      { label: "Trọng tài chính", color: "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/25" },
    AssistantReferee: { label: "Trợ lý TT",        color: "text-blue-300 bg-blue-500/10 border-blue-500/25" },
    TimingReferee:    { label: "TT bấm giờ",       color: "text-purple-300 bg-purple-500/10 border-purple-500/25" },
    StartReferee:     { label: "TT xuất phát",     color: "text-green-300 bg-green-500/10 border-green-500/25" },
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [assignedRes, refereesRes] = await Promise.all([
        organizerService.getRaceReferees(raceId),
        organizerService.getAllReferees(),
      ]);
      setAssigned(assignedRes.data || []);
      setAllReferees(refereesRes.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [raceId]);

  useEffect(() => { load(); }, [load]);

  const handleAssign = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await organizerService.assignReferee(raceId, assignForm.refereeId, assignForm.role);
      setShowAssign(false);
      load();
    } catch (err) {
      alert(err.message || "Phân công thất bại");
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemove = async (refereeId) => {
    if (!confirm("Xác nhận huỷ phân công trọng tài này?")) return;
    try {
      await organizerService.removeReferee(raceId, refereeId);
      load();
    } catch (err) {
      alert(err.message || "Huỷ phân công thất bại");
    }
  };

  // Danh sách đã phân công chỉ trả refereeId → tra tên/email từ danh sách trọng tài
  const refById = {};
  allReferees.forEach((r) => { refById[r.refereeId] = r; });

  const unassignedReferees = allReferees.filter(
    (r) => !assigned.find((a) => a.refereeId === r.refereeId)
  );

  if (loading) return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => <div key={i} className="h-16 shimmer rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-4">
      {error && <div className="text-red-300 text-sm p-3 bg-red-950/40 border border-red-900 rounded-xl">{error}</div>}

      <div className="flex items-center justify-between">
        <p className="text-sb-tx-3 text-sm"><span className="text-white font-bold">{assigned.length}</span> trọng tài được phân công</p>
        <button onClick={() => setShowAssign(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold rounded-xl text-sm transition-colors btn-gold-glow">
          <Plus size={14} /> Phân công
        </button>
      </div>

      {assigned.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/10 flex items-center justify-center mb-3 animate-float">
            <ShieldCheck size={22} className="text-[#D4AF37]/30" />
          </div>
          <p className="text-white font-semibold text-sm mb-1">Chưa có trọng tài nào</p>
          <p className="text-sb-tx-3 text-xs">Bấm "Phân công" để thêm trọng tài vào vòng đua</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {assigned.map((ref, idx) => {
            const roleKey = ref.role || ref.refereeRole || "AssistantReferee";
            const roleCfg = ROLE_LABELS[roleKey] || { label: roleKey, color: "text-sb-tx-3 bg-sb-s1/5 border-sb-border" };
            const info = refById[ref.refereeId] || {};
            const name = info.fullName || info.username || ref.fullName || `Trọng tài #${ref.refereeId}`;
            const email = info.email;
            const initials = (name[0] || "T").toUpperCase();
            return (
              <div key={ref.refereeId || ref.id || idx}
                className="group flex items-center gap-4 bg-sb-s2 border border-sb-border rounded-xl p-4 card-hover animate-fade-in-up"
                style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shrink-0">
                  <span className="text-[#D4AF37] font-black">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{name}</p>
                  {email && <p className="text-sb-tx-3 text-xs mt-0.5">{email}</p>}
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${roleCfg.color}`}>
                  {roleCfg.label}
                </span>
                <button onClick={() => handleRemove(ref.refereeId || ref.id)}
                  className="p-2 text-sb-tx-2 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-950/20">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showAssign && (
        <Modal title="Phân công trọng tài" onClose={() => setShowAssign(false)}>
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className={labelCls}>Trọng tài *</label>
              <select value={assignForm.refereeId} onChange={(e) => setAssignForm((p) => ({ ...p, refereeId: e.target.value }))} required className={selectCls}>
                <option value="">-- Chọn trọng tài --</option>
                {unassignedReferees.map((r) => (
                  <option key={r.refereeId} value={r.refereeId}>
                    {r.fullName || r.username}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Vai trò</label>
              <select value={assignForm.role} onChange={(e) => setAssignForm((p) => ({ ...p, role: e.target.value }))} className={selectCls}>
                {REFEREE_ROLES.map((r) => (
                  <option key={r} value={r}>{REFEREE_ROLES_LABELS[r] || r}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowAssign(false)}
                className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm transition-colors">Huỷ</button>
              <button type="submit" disabled={formLoading}
                className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                {formLoading && <Loader2 size={14} className="animate-spin" />} Phân công
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

const REFEREE_ROLES_LABELS = {
  MainReferee:      "Trọng tài chính",
  AssistantReferee: "Trợ lý trọng tài",
  TimingReferee:    "Trọng tài bấm giờ",
  StartReferee:     "Trọng tài xuất phát",
};

// ── Tab: Entries ──────────────────────────────────────────────────────────────
function EntriesTab({ raceId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await organizerService.getRaceEntries(raceId);
      setEntries(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [raceId]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (entryId) => {
    setActionLoading(entryId);
    try {
      await organizerService.approveEntry(raceId, entryId, { approved: true, reason: "" });
      load();
    } catch (err) {
      alert(err.message || "Duyệt thất bại");
    } finally {
      setActionLoading("");
    }
  };

  if (loading) return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-20 shimmer rounded-xl" />)}
    </div>
  );

  const counts = {
    pending:  entries.filter((e) => e.status === "Pending").length,
    approved: entries.filter((e) => e.status === "Approved").length,
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-red-300 text-sm p-3 bg-red-950/40 border border-red-900 rounded-xl">{error}</div>}

      {/* Mini stat bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="stat-pill"><span className="text-white font-bold">{entries.length}</span> đăng ký</span>
        {counts.pending > 0 && <span className="stat-pill text-yellow-400">{counts.pending} chờ duyệt</span>}
        {counts.approved > 0 && <span className="stat-pill text-green-400">{counts.approved} đã duyệt</span>}
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-sb-s1/[0.03] border border-sb-border flex items-center justify-center mb-3 animate-float">
            <span className="text-3xl">🐴</span>
          </div>
          <p className="text-white font-semibold text-sm mb-1">Chưa có đội tham gia</p>
          <p className="text-sb-tx-3 text-xs">Các đội sẽ hiển thị sau khi đăng ký</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map((entry, idx) => {
            const isPending = entry.status === "Pending";
            const isApproved = entry.status === "Approved";
            const busyThis = actionLoading === entry.entryId;

            return (
              <div key={entry.entryId}
                className={`group flex items-center gap-4 bg-sb-s2 border rounded-xl p-4 card-hover animate-fade-in-up
                  ${isPending ? "border-yellow-500/20 border-l-gold-glow" : isApproved ? "border-green-500/15 border-l-green-glow" : "border-sb-border"}`}
                style={{ animationDelay: `${idx * 50}ms` }}>
                {/* Horse avatar */}
                <div className="w-11 h-11 rounded-xl bg-sb-s1/[0.03] border border-sb-border flex items-center justify-center shrink-0 text-xl">
                  🐴
                </div>

                {/* Entry info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{entry.horseName || `Ngựa #${entry.horseId}`}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {entry.ownerName && <span className="stat-pill">👤 {entry.ownerName}</span>}
                    {entry.jockeyName ? (
                      <span className="stat-pill">🏇 {entry.jockeyName}</span>
                    ) : (
                      <span className="text-sb-tx-2 text-xs italic">Chưa có jockey</span>
                    )}
                  </div>
                </div>

                {/* Status / action */}
                <div className="shrink-0">
                  {isPending ? (
                    <button onClick={() => handleApprove(entry.entryId)} disabled={busyThis}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-green-600/15 border border-green-600/30 text-green-300 hover:bg-green-600/25 rounded-xl text-xs font-bold transition-all disabled:opacity-50">
                      {busyThis ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      Duyệt
                    </button>
                  ) : (
                    <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full border ${
                      isApproved ? "bg-green-500/15 text-green-300 border-green-500/30" : "bg-gray-500/15 text-sb-tx-3 border-gray-500/30"
                    }`}>
                      {isApproved ? "✓ Đã duyệt" : entry.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab: Results ──────────────────────────────────────────────────────────────
function ResultsTab({ raceId, race, role, onRefresh }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await raceResultService.getResults(raceId);
      setResults(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [raceId]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (action, extra = {}) => {
    setActionLoading(action);
    try {
      if (action === "approve") await organizerService.approveResults(raceId);
      else if (action === "reject") await organizerService.rejectResults(raceId, extra.reason);
      else if (action === "publish") await organizerService.publishResults(raceId);
      load();
      onRefresh && onRefresh();
      if (action === "reject") { setShowReject(false); setRejectReason(""); }
    } catch (err) {
      alert(err.message || "Thao tác thất bại");
    } finally {
      setActionLoading("");
    }
  };

  // 1 role Organizer duy nhất — được duyệt/công bố kết quả
  const isHead = role === "Organizer";
  const sorted = [...results].sort((a, b) => (a.position || 99) - (b.position || 99));

  if (loading) return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="h-16 shimmer rounded-xl" />)}
    </div>
  );

  const PODIUM = [
    { pos: 1, icon: "🥇", bg: "from-[#D4AF37]/20 to-[#D4AF37]/5", border: "border-[#D4AF37]/30", text: "text-[#D4AF37] neon-gold" },
    { pos: 2, icon: "🥈", bg: "from-gray-400/20 to-gray-400/5",   border: "border-gray-400/30",   text: "text-sb-tx-3" },
    { pos: 3, icon: "🥉", bg: "from-amber-700/20 to-amber-700/5", border: "border-amber-700/30",  text: "text-amber-500" },
  ];

  return (
    <div className="space-y-5">
      {error && <div className="text-red-300 text-sm p-3 bg-red-950/40 border border-red-900 rounded-xl">{error}</div>}

      {/* OrganizerHead actions */}
      {isHead && race?.status === "Finished" && (
        <div className="flex items-center gap-3 flex-wrap p-4 bg-sb-s2 border border-sb-border rounded-xl">
          <p className="text-sb-tx-3 text-xs font-semibold uppercase tracking-wider mr-auto">Thao tác kết quả</p>
          <button onClick={() => handleAction("approve")} disabled={!!actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600/15 border border-green-600/30 text-green-300 hover:bg-green-600/25 rounded-xl text-sm font-bold transition-all disabled:opacity-60">
            {actionLoading === "approve" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Duyệt kết quả
          </button>
          <button onClick={() => setShowReject(true)} disabled={!!actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/20 text-red-400 hover:bg-red-600/20 rounded-xl text-sm font-medium transition-all disabled:opacity-60">
            {actionLoading === "reject" ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            Từ chối
          </button>
          <button onClick={() => handleAction("publish")} disabled={!!actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] rounded-xl text-sm font-bold transition-all disabled:opacity-60 btn-gold-glow">
            {actionLoading === "publish" ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
            Công bố
          </button>
        </div>
      )}

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/10 flex items-center justify-center mb-3 animate-float">
            <Trophy size={22} className="text-[#D4AF37]/30" />
          </div>
          <p className="text-white font-semibold text-sm mb-1">Chưa có kết quả</p>
          <p className="text-sb-tx-3 text-xs">Trọng tài chưa nhập kết quả vòng đua</p>
        </div>
      ) : (
        <>
          {/* Podium top 3 */}
          {sorted.length >= 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PODIUM.map(({ pos, icon, bg, border, text }) => {
                const r = sorted.find((x) => x.position === pos);
                if (!r) return null;
                return (
                  <div key={pos} className={`bg-gradient-to-br ${bg} border ${border} rounded-xl p-4 text-center`}>
                    <div className="text-3xl mb-2">{icon}</div>
                    <p className={`text-base font-black ${text}`}>{r.horseName || (r.horseId ? `Ngựa #${r.horseId}` : "Chưa có")}</p>
                    <p className="text-sb-tx-3 text-xs mt-1">🏇 {r.jockeyName || "Chưa có jockey"}</p>
                    {r.finishTime && <p className="text-sb-tx-3 text-xs mt-1">⏱ {r.finishTime}</p>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Full ranking list */}
          <div className="space-y-2">
            {sorted.map((r, idx) => (
              <div key={r.resultId || r.entryId}
                className="flex items-center gap-4 bg-sb-s2 border border-sb-border rounded-xl p-4 animate-fade-in-up"
                style={{ animationDelay: `${idx * 40}ms` }}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 border ${
                  r.position === 1 ? "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30" :
                  r.position === 2 ? "bg-gray-400/20 text-sb-tx-3 border-gray-400/30" :
                  r.position === 3 ? "bg-amber-700/20 text-amber-500 border-amber-700/30" :
                  "bg-sb-s1/[0.03] text-sb-tx-3 border-sb-border"
                }`}>
                  {r.position ?? "—"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{r.horseName || (r.horseId ? `Ngựa #${r.horseId}` : "Chưa có")}</p>
                  <div className="flex items-center gap-3 flex-wrap mt-0.5">
                    <span className="text-sb-tx-3 text-xs">🏇 {r.jockeyName || "Chưa có jockey"}</span>
                    {r.finishTime && <span className="stat-pill">⏱ {r.finishTime}</span>}
                  </div>
                </div>
                {r.status && (
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    r.status === "Published" ? "bg-green-500/15 text-green-300 border-green-500/30" :
                    r.status === "Approved"  ? "bg-blue-500/15 text-blue-300 border-blue-500/30" :
                    "bg-gray-500/15 text-sb-tx-3 border-gray-500/30"
                  }`}>
                    {r.status === "Published" ? "Đã công bố" : r.status === "Approved" ? "Đã duyệt" : r.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showReject && (
        <Modal title="Từ chối kết quả" accentColor="rgb(239,68,68)" onClose={() => setShowReject(false)}>
          <p className="text-sb-tx-3 text-sm mb-3">Nhập lý do từ chối để trọng tài biết cần chỉnh sửa:</p>
          <textarea
            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            placeholder="VD: Thiếu thời gian về đích của ngựa số 3..." rows={4}
            className={inputCls + " mb-4"}
          />
          <div className="flex gap-3">
            <button onClick={() => setShowReject(false)}
              className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm transition-colors">Huỷ</button>
            <button onClick={() => handleAction("reject", { reason: rejectReason })} disabled={!!actionLoading}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
              {actionLoading === "reject" && <Loader2 size={14} className="animate-spin" />} Từ chối
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OrganizerRaceDetailPage() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [race, setRace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("info");

  const fetchRace = useCallback(async () => {
    setLoading(true);
    try {
      const res = await organizerService.getRaceById(raceId);
      setRace(res.data);
    } catch (e) {
      setError(e.message || "Không thể tải thông tin vòng đua");
    } finally {
      setLoading(false);
    }
  }, [raceId]);

  useEffect(() => { fetchRace(); }, [fetchRace]);

  const statusCfg = RACE_STATUS_CONFIG[race?.status] || {};

  return (
    <AdminLayout title="Chi tiết vòng đua">

      {/* ── Page Header Banner ── */}
      <div className="page-header">
        <div className="absolute right-0 top-0 w-72 h-full bg-gradient-to-l from-[#D4AF37]/[0.04] to-transparent pointer-events-none" />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-6xl opacity-[0.07] select-none pointer-events-none animate-float">🏁</div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button onClick={() => navigate("/organizer/races")}
              className="flex items-center gap-1.5 text-sb-tx-3 hover:text-[#D4AF37] transition-colors text-xs font-semibold mb-2.5 group">
              <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" /> Quay về danh sách
            </button>
            {loading ? (
              <div className="h-7 w-64 shimmer rounded-lg" />
            ) : (
              <>
                <h1 className="text-2xl font-black text-white leading-tight">{race?.raceName || "Vòng đua"}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {race?.status && (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${statusCfg.color || "bg-gray-500/20 text-sb-tx-3 border-gray-600"}`}>
                      {race.status === "Ongoing" && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot" />}
                      {statusCfg.label || race.status}
                    </span>
                  )}
                  {race?.startTime && (
                    <span className="stat-pill">
                      📅 {new Date(race.startTime).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                  {race?.distance && <span className="stat-pill">📏 {race.distance}m</span>}
                  {race?.prizePool && (
                    <span className="text-xs font-bold text-[#D4AF37] neon-gold">
                      💰 {Number(race.prizePool).toLocaleString("vi-VN")} VNĐ
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          <button onClick={fetchRace}
            className="flex items-center gap-2 px-3 py-2 bg-sb-s2 border border-sb-border rounded-xl text-sb-tx-3 hover:text-sb-tx text-sm transition-all shrink-0">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-950/40 border border-red-900 rounded-xl text-red-300 text-sm">
            <AlertCircle size={16} /> {error}
            <button onClick={fetchRace} className="ml-auto text-xs underline text-red-400 hover:text-red-300">Thử lại</button>
          </div>
        )}

        {loading && !error ? (
          <div className="space-y-4">
            <div className="h-10 w-72 shimmer rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-20 shimmer rounded-xl" />)}
            </div>
          </div>
        ) : !error && (
          <>
            {/* ── Tab bar ── */}
            <div className="flex gap-1 bg-sb-s2 p-1 rounded-xl border border-sb-border w-fit flex-wrap">
              {TABS.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-[#D4AF37] text-[#0A0E1A] shadow-[0_0_14px_rgba(212,175,55,0.25)]"
                      : "text-sb-tx-3 hover:text-sb-tx hover:bg-sb-s2"
                  }`}>
                  <tab.icon size={13} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab content ── */}
            <div className="bg-sb-s1/[0.015] border border-sb-border rounded-2xl p-5">
              {activeTab === "info"     && <InfoTab race={race} />}
              {activeTab === "referees" && <RefereesTab raceId={raceId} />}
              {activeTab === "entries"  && <EntriesTab raceId={raceId} />}
              {activeTab === "results"  && (
                <ResultsTab raceId={raceId} race={race} role={role} onRefresh={fetchRace} />
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
