import { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit2, Trash2, AlertCircle, Loader2,
  RefreshCw, X, Heart, Activity, PawPrint,
  Weight, Ruler, Dna, Mars, Venus,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { horseService } from "../../services/horse";

const STATUS_CONFIG = {
  Active:   { label: "Hoạt động",  color: "bg-green-500/20 text-green-300 border-green-500/40 badge-glow-green", strip: "from-green-500/30 to-green-500/5", dot: "bg-green-400" },
  Injured:  { label: "Bị thương",  color: "bg-red-500/20 text-red-300 border-red-500/40 badge-glow-red",         strip: "from-red-500/30 to-red-500/5",   dot: "bg-red-400" },
  Retired:  { label: "Đã nghỉ",    color: "bg-gray-500/20 text-gray-400 border-gray-500/40",                     strip: "from-gray-500/20 to-gray-500/5", dot: "bg-gray-400" },
  Training: { label: "Đang luyện", color: "bg-blue-500/20 text-blue-300 border-blue-500/40 badge-glow-blue",     strip: "from-blue-500/30 to-blue-500/5", dot: "bg-blue-400" },
};

const EMPTY_FORM = {
  horseName: "", breed: "", age: "", gender: "", color: "",
  weight: "", height: "", description: "",
};

function Modal({ title, accentColor = "#D4AF37", onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
      <div className="bg-[#0d1117] border border-gray-800/60 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/60 max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Accent top bar */}
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

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-[#070B14] border border-gray-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.08)] transition-all";

function HorseForm({ form, onChange, onSubmit, onCancel, loading, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FormField label="Tên ngựa *">
            <input name="horseName" value={form.horseName} onChange={onChange} required className={inputCls} placeholder="VD: Thunder Storm" />
          </FormField>
        </div>
        <FormField label="Giống ngựa">
          <input name="breed" value={form.breed} onChange={onChange} className={inputCls} placeholder="VD: Thoroughbred" />
        </FormField>
        <FormField label="Tuổi">
          <input name="age" type="number" min="0" max="30" value={form.age} onChange={onChange} className={inputCls} placeholder="5" />
        </FormField>
        <FormField label="Giới tính">
          <select name="gender" value={form.gender} onChange={onChange} className={inputCls}>
            <option value="">-- Chọn --</option>
            <option value="Male">Đực ♂</option>
            <option value="Female">Cái ♀</option>
          </select>
        </FormField>
        <FormField label="Màu sắc">
          <input name="color" value={form.color} onChange={onChange} className={inputCls} placeholder="VD: Hạt dẻ" />
        </FormField>
        <FormField label="Cân nặng (kg)">
          <input name="weight" type="number" value={form.weight} onChange={onChange} className={inputCls} placeholder="450" />
        </FormField>
        <FormField label="Chiều cao (cm)">
          <input name="height" type="number" value={form.height} onChange={onChange} className={inputCls} placeholder="165" />
        </FormField>
        <div className="col-span-2">
          <FormField label="Mô tả">
            <textarea name="description" value={form.description} onChange={onChange} rows={2}
              className={inputCls + " resize-none"} placeholder="Ghi chú thêm..." />
          </FormField>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-700/60 text-gray-400 hover:text-white hover:border-gray-600 text-sm transition-colors">
          Huỷ
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 btn-gold-glow transition-all">
          {loading && <Loader2 size={14} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function HealthModal({ horseId, horseName, onClose }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ checkDate: "", condition: "", notes: "", veterinarian: "" });
  const [addLoading, setAddLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await horseService.getHealthRecords(horseId);
      setRecords(res.data || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [horseId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await horseService.addHealthRecord(horseId, addForm);
      setShowAdd(false);
      setAddForm({ checkDate: "", condition: "", notes: "", veterinarian: "" });
      load();
    } catch (err) {
      alert(err.message || "Thêm hồ sơ thất bại");
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <Modal title={`Hồ sơ sức khoẻ — ${horseName}`} accentColor="rgb(244,114,182)" onClose={onClose}>
      <div className="space-y-4">
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-3 py-2 bg-pink-600/10 border border-pink-600/30 text-pink-300 rounded-xl text-xs font-semibold hover:bg-pink-600/20 transition-colors">
          <Plus size={13} /> Thêm hồ sơ mới
        </button>

        {showAdd && (
          <form onSubmit={handleAdd} className="bg-[#070B14]/80 rounded-xl border border-gray-800/60 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Ngày kiểm tra">
                <input type="date" value={addForm.checkDate} onChange={(e) => setAddForm((p) => ({ ...p, checkDate: e.target.value }))} className={inputCls} />
              </FormField>
              <FormField label="Tình trạng">
                <input value={addForm.condition} onChange={(e) => setAddForm((p) => ({ ...p, condition: e.target.value }))}
                  placeholder="VD: Tốt, Bị thương..." className={inputCls} />
              </FormField>
              <div className="col-span-2">
                <FormField label="Bác sĩ thú y">
                  <input value={addForm.veterinarian} onChange={(e) => setAddForm((p) => ({ ...p, veterinarian: e.target.value }))} className={inputCls} />
                </FormField>
              </div>
              <div className="col-span-2">
                <FormField label="Ghi chú">
                  <textarea value={addForm.notes} onChange={(e) => setAddForm((p) => ({ ...p, notes: e.target.value }))} rows={2}
                    className={inputCls + " resize-none"} />
                </FormField>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl border border-gray-700 text-gray-400 text-sm">Huỷ</button>
              <button type="submit" disabled={addLoading} className="flex-1 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {addLoading && <Loader2 size={12} className="animate-spin" />} Thêm
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#D4AF37]" size={24} /></div>
        ) : records.length === 0 ? (
          <div className="text-center py-10">
            <Activity size={32} className="mx-auto text-gray-700 mb-2" />
            <p className="text-gray-500 text-sm">Chưa có hồ sơ sức khoẻ</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {records.map((r, i) => (
              <div key={i} className="bg-[#070B14]/60 border border-gray-800/40 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-semibold">{r.condition || "—"}</span>
                  <span className="text-gray-500 text-xs bg-white/5 px-2 py-0.5 rounded-full">{r.checkDate || "—"}</span>
                </div>
                {r.veterinarian && <p className="text-gray-500 text-xs">🩺 {r.veterinarian}</p>}
                {r.notes && <p className="text-gray-400 text-xs mt-1 italic">"{r.notes}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function HorsesPage() {
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [showHealth, setShowHealth] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [statusLoading, setStatusLoading] = useState("");

  const fetchHorses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await horseService.getMyHorses();
      setHorses(res.data || []);
    } catch (e) {
      setError(e.message || "Không thể tải danh sách ngựa");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHorses(); }, [fetchHorses]);

  const handleFormChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      await horseService.create(formData);
      setShowCreate(false);
      setFormData(EMPTY_FORM);
      fetchHorses();
    } catch (err) {
      setFormError(err.message || "Tạo thất bại");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      await horseService.update(showEdit.horseId, formData);
      setShowEdit(null);
      fetchHorses();
    } catch (err) {
      setFormError(err.message || "Cập nhật thất bại");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await horseService.delete(showDelete.horseId);
      setShowDelete(null);
      fetchHorses();
    } catch (err) {
      setFormError(err.message || "Xoá thất bại");
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangeStatus = async (horseId, newStatus) => {
    setStatusLoading(horseId);
    try {
      await horseService.changeStatus(horseId, newStatus);
      setHorses((prev) => prev.map((h) => h.horseId === horseId ? { ...h, status: newStatus } : h));
    } catch (err) {
      alert(err.message || "Đổi trạng thái thất bại");
    } finally {
      setStatusLoading("");
    }
  };

  const openEdit = (horse) => {
    setFormData({
      horseName: horse.horseName || "",
      breed: horse.breed || "",
      age: horse.age || "",
      gender: horse.gender || "",
      color: horse.color || "",
      weight: horse.weight || "",
      height: horse.height || "",
      description: horse.description || "",
    });
    setShowEdit(horse);
    setFormError("");
  };

  const activeCount   = horses.filter((h) => h.status === "Active").length;
  const injuredCount  = horses.filter((h) => h.status === "Injured").length;

  return (
    <AdminLayout title="Ngựa của tôi">

      {/* ── Page Header Banner ── */}
      <div className="page-header mb-0">
        {/* right glow */}
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-orange-500/[0.05] to-transparent pointer-events-none" />
        {/* floating emoji */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-6xl opacity-[0.08] pointer-events-none select-none animate-float">🐴</div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <PawPrint size={14} className="text-orange-400" />
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Quản lý ngựa</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Ngựa của tôi</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="stat-pill"><span className="text-white font-bold">{horses.length}</span> tổng cộng</span>
              {activeCount > 0 && <span className="stat-pill text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block mr-1" />{activeCount} hoạt động</span>}
              {injuredCount > 0 && <span className="stat-pill text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block mr-1" />{injuredCount} bị thương</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={fetchHorses}
              className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-gray-700/60 rounded-xl text-gray-400 hover:text-white text-sm transition-all">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={() => { setFormData(EMPTY_FORM); setFormError(""); setShowCreate(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold rounded-xl text-sm transition-all btn-gold-glow">
              <Plus size={15} /> Thêm ngựa
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-300 text-sm">
            <AlertCircle size={15} className="text-red-400 shrink-0" /> {error}
          </div>
        )}

        {/* ── Horse Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 shimmer rounded-2xl" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : horses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center mb-4 animate-float">
              <span className="text-4xl">🐴</span>
            </div>
            <p className="text-white font-semibold mb-1">Chưa có ngựa nào</p>
            <p className="text-gray-500 text-sm mb-4">Thêm ngựa đầu tiên vào danh sách của bạn</p>
            <button onClick={() => { setFormData(EMPTY_FORM); setFormError(""); setShowCreate(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold rounded-xl text-sm btn-gold-glow">
              <Plus size={15} /> Thêm ngựa đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {horses.map((horse, idx) => {
              const statusCfg = STATUS_CONFIG[horse.status] || { label: horse.status, color: "bg-gray-500/20 text-gray-400 border-gray-500/40", strip: "from-gray-500/20 to-gray-500/5", dot: "bg-gray-400" };
              return (
                <div
                  key={horse.horseId}
                  className="group relative bg-[#0d1117] border border-gray-800/60 rounded-2xl overflow-hidden card-hover"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Top gradient strip based on status */}
                  <div className={`h-0.5 w-full bg-gradient-to-r ${statusCfg.strip}`} />

                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {/* Horse avatar */}
                        <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${statusCfg.strip} border border-white/[0.06] shrink-0`}>
                          🐴
                          <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0d1117] ${statusCfg.dot}`} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-white font-bold text-base leading-tight truncate">{horse.horseName}</h3>
                          <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                            <Dna size={10} className="shrink-0" />
                            {horse.breed || "Chưa xác định"}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold shrink-0 ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { label: "Tuổi",    value: horse.age    ? `${horse.age}t`        : "—", icon: "🎂" },
                        { label: "Nặng",    value: horse.weight ? `${horse.weight}kg`     : "—", icon: "⚖️" },
                        { label: "Cao",     value: horse.height ? `${horse.height}cm`     : "—", icon: "📏" },
                      ].map(({ label, value, icon }) => (
                        <div key={label} className="bg-[#070B14]/60 rounded-xl p-2.5 text-center border border-gray-800/40">
                          <span className="text-sm block mb-0.5">{icon}</span>
                          <p className="text-white text-sm font-bold leading-none">{value}</p>
                          <p className="text-gray-600 text-[9px] uppercase tracking-wider mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Extra info */}
                    <div className="flex flex-wrap gap-1.5 mb-4 min-h-[20px]">
                      {horse.gender && (
                        <span className="stat-pill">
                          {horse.gender === "Male" ? <><Mars size={10} className="text-blue-400" /> Đực</> : <><Venus size={10} className="text-pink-400" /> Cái</>}
                        </span>
                      )}
                      {horse.color && (
                        <span className="stat-pill">{horse.color}</span>
                      )}
                    </div>

                    {/* Status changer */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-gray-600 text-[10px] uppercase tracking-wider shrink-0">Trạng thái:</span>
                      <select
                        value={horse.status || "Active"}
                        disabled={statusLoading === horse.horseId}
                        onChange={(e) => handleChangeStatus(horse.horseId, e.target.value)}
                        className="flex-1 bg-[#070B14] border border-gray-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <option value="Active">🟢 Hoạt động</option>
                        <option value="Injured">🔴 Bị thương</option>
                        <option value="Retired">⚫ Đã nghỉ</option>
                        <option value="Training">🟡 Đang luyện tập</option>
                      </select>
                      {statusLoading === horse.horseId && <Loader2 size={12} className="animate-spin text-[#D4AF37] shrink-0" />}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-800/40">
                      <button onClick={() => setShowHealth(horse)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-pink-600/10 border border-pink-600/25 text-pink-300 hover:bg-pink-600/20 hover:border-pink-600/40 rounded-xl text-xs font-semibold transition-all">
                        <Heart size={11} /> Sức khoẻ
                      </button>
                      <button onClick={() => openEdit(horse)}
                        className="p-2 bg-white/[0.03] border border-gray-700/60 text-gray-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 rounded-xl transition-all">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => { setFormError(""); setShowDelete(horse); }}
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
        <Modal title="Thêm ngựa mới" onClose={() => setShowCreate(false)}>
          {formError && <div className="mb-4 flex items-center gap-2 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-300 text-sm"><AlertCircle size={13} />{formError}</div>}
          <HorseForm form={formData} onChange={handleFormChange} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={formLoading} submitLabel="Thêm ngựa" />
        </Modal>
      )}

      {showEdit && (
        <Modal title={`Chỉnh sửa — ${showEdit.horseName}`} onClose={() => setShowEdit(null)}>
          {formError && <div className="mb-4 flex items-center gap-2 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-300 text-sm"><AlertCircle size={13} />{formError}</div>}
          <HorseForm form={formData} onChange={handleFormChange} onSubmit={handleEdit} onCancel={() => setShowEdit(null)} loading={formLoading} submitLabel="Lưu thay đổi" />
        </Modal>
      )}

      {showDelete && (
        <Modal title="Xác nhận xoá ngựa" accentColor="rgb(239,68,68)" onClose={() => setShowDelete(null)}>
          {formError && <div className="mb-3 text-red-300 text-sm">{formError}</div>}
          <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-900/30 rounded-xl mb-5">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0 text-xl">🐴</div>
            <div>
              <p className="text-white font-bold">{showDelete.horseName}</p>
              <p className="text-gray-500 text-xs">{showDelete.breed || "Chưa xác định"}</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-5">Hành động này sẽ xoá vĩnh viễn dữ liệu ngựa và không thể hoàn tác.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowDelete(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700/60 text-gray-400 hover:text-white text-sm transition-colors">Huỷ</button>
            <button onClick={handleDelete} disabled={formLoading}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
              {formLoading && <Loader2 size={14} className="animate-spin" />} Xoá ngựa
            </button>
          </div>
        </Modal>
      )}

      {showHealth && <HealthModal horseId={showHealth.horseId} horseName={showHealth.horseName} onClose={() => setShowHealth(null)} />}
    </AdminLayout>
  );
}
