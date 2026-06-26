import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Edit2, Trash2, Eye, AlertCircle, Loader2,
  RefreshCw, Flag, ChevronDown, X, Check,
  Clock, Zap, Trophy, Users, Calendar,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { organizerService } from "../../services/organizer";
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
  raceName: "", roundId: "", startTime: "", endTime: "",
  description: "", maxEntries: "", distance: "", prizePool: "",
};

const inputCls = "w-full bg-[#070B14] border border-gray-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.08)] transition-all";

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "bg-gray-500/20 text-gray-300 border-gray-500/40" };
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
      <div className="bg-[#0d1117] border border-gray-800/60 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/60 animate-scale-in">
        <div className="h-0.5 w-full rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
          <h3 className="text-white font-bold">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function RaceForm({ form, onChange, onSubmit, onCancel, loading, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Tên vòng đua *</label>
          <input name="raceName" value={form.raceName} onChange={onChange} required className={inputCls} placeholder="VD: Vòng chung kết mùa hè" />
        </div>
        <div>
          <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Thời gian bắt đầu *</label>
          <input name="startTime" type="datetime-local" value={form.startTime} onChange={onChange} required className={inputCls} />
        </div>
        <div>
          <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Thời gian kết thúc</label>
          <input name="endTime" type="datetime-local" value={form.endTime} onChange={onChange} className={inputCls} />
        </div>
        <div>
          <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Cự ly (m)</label>
          <input name="distance" type="number" value={form.distance} onChange={onChange} className={inputCls} placeholder="1600" />
        </div>
        <div>
          <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Số tham gia tối đa</label>
          <input name="maxEntries" type="number" value={form.maxEntries} onChange={onChange} className={inputCls} placeholder="8" />
        </div>
        <div className="col-span-2">
          <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Giải thưởng (VNĐ)</label>
          <input name="prizePool" type="number" value={form.prizePool} onChange={onChange} className={inputCls} placeholder="50000000" />
        </div>
        <div className="col-span-2">
          <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Mô tả</label>
          <textarea name="description" value={form.description} onChange={onChange} rows={2} className={inputCls + " resize-none"} />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-700/60 text-gray-400 hover:text-white text-sm transition-colors">Huỷ</button>
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

  useEffect(() => { fetchRaces(); }, [fetchRaces]);

  const handleFormChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault(); setFormLoading(true); setFormError("");
    try {
      await organizerService.createRace(formData);
      setShowCreate(false); setFormData(EMPTY_FORM); fetchRaces();
    } catch (err) { setFormError(err.message || "Tạo vòng đua thất bại"); }
    finally { setFormLoading(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setFormLoading(true); setFormError("");
    try {
      await organizerService.updateRace(showEdit.raceId, formData);
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
      raceName: race.raceName || "", roundId: race.roundId || "",
      startTime: race.startTime ? race.startTime.slice(0, 16) : "",
      endTime: race.endTime ? race.endTime.slice(0, 16) : "",
      description: race.description || "", maxEntries: race.maxEntries || "",
      distance: race.distance || "", prizePool: race.prizePool || "",
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
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ban tổ chức</span>
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
              className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-gray-700/60 rounded-xl text-gray-400 hover:text-white text-sm transition-all">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={() => { setFormData(EMPTY_FORM); setFormError(""); setShowCreate(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold rounded-xl text-sm btn-gold-glow transition-all">
              <Plus size={15} /> Tạo vòng đua
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
                    : "bg-white/[0.03] border border-gray-800/60 text-gray-400 hover:text-white hover:border-gray-700"
                }`}>
                {label || cfg?.label || key}
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? "bg-[#0A0E1A]/20" : "bg-white/10"}`}>
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
            <p className="text-gray-500 text-sm">Tạo vòng đua đầu tiên để bắt đầu</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((race, idx) => {
              const cfg = STATUS_CONFIG[race.status] || { label: race.status, color: "bg-gray-500/20 text-gray-300 border-gray-500/40", borderCls: "border-l-gray-glow", iconCls: "text-gray-400", glow: "" };
              const StatusIcon = cfg.icon || Flag;
              return (
                <div
                  key={race.raceId}
                  className={`group relative bg-[#0d1117] border border-gray-800/60 rounded-xl overflow-hidden card-hover hover:shadow-lg ${cfg.glow} ${cfg.borderCls} animate-fade-in-up`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Left: Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/[0.03] border border-gray-800/60 ${cfg.iconCls}`}>
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
                          <span className="flex items-center gap-1 text-gray-500 text-xs">
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
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-gray-700/60 text-gray-400 hover:text-white hover:border-gray-600 rounded-xl text-xs transition-all">
                        <Eye size={12} /> Chi tiết
                      </button>
                      <button onClick={() => openEdit(race)}
                        className="p-2 bg-white/[0.03] border border-gray-700/60 text-gray-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 rounded-xl transition-all">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => { setFormError(""); setShowDelete(race); }}
                        className="p-2 bg-white/[0.03] border border-gray-700/60 text-gray-500 hover:text-red-400 hover:border-red-900/50 rounded-xl transition-all">
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
        <Modal title="Tạo vòng đua mới" onClose={() => setShowCreate(false)}>
          {formError && <div className="mb-4 flex items-center gap-2 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-300 text-sm"><AlertCircle size={13} /> {formError}</div>}
          <RaceForm form={formData} onChange={handleFormChange} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={formLoading} submitLabel="Tạo vòng đua" />
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
          <p className="text-gray-300 text-sm mb-5">
            Bạn có chắc muốn xoá vòng đua <span className="text-white font-bold">"{showDelete.raceName}"</span>?
            Hành động này không thể hoàn tác.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDelete(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700/60 text-gray-400 hover:text-white text-sm transition-colors">Huỷ</button>
            <button onClick={handleDelete} disabled={formLoading}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
              {formLoading && <Loader2 size={14} className="animate-spin" />} Xoá
            </button>
          </div>
        </Modal>
      )}

      {showStatus && (
        <Modal title={`Đổi trạng thái vòng đua`} onClose={() => setShowStatus(null)}>
          <p className="text-gray-500 text-xs mb-1 uppercase tracking-widest font-semibold">Vòng đua</p>
          <p className="text-white font-bold mb-4">{showStatus.raceName}</p>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-gray-500 text-sm">Hiện tại:</span>
            <StatusBadge status={showStatus.status} />
          </div>
          <div className="space-y-2">
            {STATUS_TRANSITIONS[showStatus.status]?.map((newStatus) => {
              const newCfg = STATUS_CONFIG[newStatus];
              return (
                <button key={newStatus} onClick={() => handleChangeStatus(newStatus)} disabled={formLoading}
                  className="w-full py-3 px-4 rounded-xl border border-gray-800/60 bg-white/[0.02] text-white hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 text-sm font-medium transition-all flex items-center justify-between disabled:opacity-60">
                  <span>Chuyển sang <span className={`font-bold ${newCfg?.iconCls || "text-[#D4AF37]"}`}>{newCfg?.label}</span></span>
                  {formLoading ? <Loader2 size={14} className="animate-spin text-[#D4AF37]" /> : <Check size={14} className="text-gray-600" />}
                </button>
              );
            })}
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
