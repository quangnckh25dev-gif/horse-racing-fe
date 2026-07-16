import { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit2, AlertCircle, Loader2,
  RefreshCw, X, Heart, Activity, PawPrint,
  Dna, Mars, Venus,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { horseService } from "../../services/horse";

const STATUS_CONFIG = {
  Active:   { label: "Hoạt động",       color: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd", strip: "from-green-400/20 to-green-400/5", dot: "bg-green-500" },
  Injured:  { label: "Bị thương",       color: "bg-sb-lose/10 text-sb-lose border-sb-lose/30",       strip: "from-red-400/20 to-red-400/5",    dot: "bg-red-500" },
  Inactive: { label: "Không hoạt động", color: "bg-sb-s2 text-sb-tx-3 border-sb-border",    strip: "from-gray-400/15 to-gray-400/5",  dot: "bg-gray-400" },
};

const HORSE_COLORS = [
  "Nâu", "Đen", "Trắng", "Xám", "Đỏ nâu (Bay)", "Vàng (Palomino)",
  "Hoa (Pinto)", "Nâu nhạt (Chestnut)", "Xám đốm (Dapple Grey)",
  "Đen tuyền", "Nâu vàng (Buckskin)", "Kem (Cremello)",
];

const HORSE_BREEDS = [
  "Thoroughbred", "Arabian", "Quarter Horse", "Warmblood", "Appaloosa",
  "Morgan", "Friesian", "Mustang", "Andalusian", "Hanoverian",
  "Paint", "Standardbred", "Irish Draught", "Clydesdale", "Ngựa Việt Nam",
];

const EMPTY_FORM = {
  horseName: "", breed: "", birthYear: "", gender: "", color: "",
  weightKg: "", description: "", status: "Active",
};

function Modal({ title, accentColor = "#2563EB", onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
      <div className="bg-sb-s1 border border-sb-border rounded-2xl w-full max-w-lg shadow-2xl shadow-black/20 max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="h-0.5 w-full rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
        <div className="flex items-center justify-between px-6 py-4 border-b border-sb-border">
          <h3 className="text-sb-tx font-bold">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-sb-tx-3 hover:text-sb-tx-2 hover:bg-sb-s2 transition-colors">
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
      <label className="block text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-sb-s1 border border-sb-border rounded-xl px-3 py-2.5 text-sb-tx text-sm focus:outline-none focus:border-sb-emerald focus:ring-1 focus:ring-sb-emerald/40 transition-all placeholder:text-sb-tx-3";

const currentYear = new Date().getFullYear();

function HorseForm({ form, onChange, onSubmit, onCancel, loading, submitLabel }) {
  const calcAge = form.birthYear ? currentYear - Number(form.birthYear) : null;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FormField label="Tên ngựa *">
            <input name="horseName" value={form.horseName} onChange={onChange} required className={inputCls} placeholder="VD: Thunder Storm" />
          </FormField>
        </div>
        <FormField label="Giống ngựa">
          <select name="breed" value={form.breed} onChange={onChange} className={inputCls}>
            <option value="">-- Chọn giống --</option>
            {HORSE_BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </FormField>
        <FormField label={`Năm sinh${calcAge !== null ? ` (${calcAge} tuổi)` : ""}`}>
          <input name="birthYear" type="number" min="1990" max={currentYear} value={form.birthYear} onChange={onChange}
            className={inputCls} placeholder={String(currentYear - 5)} />
        </FormField>
        <FormField label="Giới tính">
          <select name="gender" value={form.gender} onChange={onChange} className={inputCls}>
            <option value="">-- Chọn --</option>
            <option value="Male">Đực ♂</option>
            <option value="Female">Cái ♀</option>
          </select>
        </FormField>
        <FormField label="Màu sắc">
          <select name="color" value={form.color} onChange={onChange} className={inputCls}>
            <option value="">-- Chọn màu --</option>
            {HORSE_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>
        <div className="col-span-2">
          <FormField label="Cân nặng (kg)">
            <input name="weightKg" type="number" min="100" max="1000" value={form.weightKg} onChange={onChange} className={inputCls} placeholder="450" />
          </FormField>
        </div>
        <div className="col-span-2">
          <FormField label="Mô tả">
            <textarea name="description" value={form.description} onChange={onChange} rows={2}
              className={inputCls + " resize-none"} placeholder="Ghi chú thêm..." />
          </FormField>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-3 hover:text-sb-tx hover:border-sb-border-2 text-sm transition-colors">
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
          className="flex items-center gap-2 px-3 py-2 bg-pink-500/10 border border-pink-500/30 text-pink-400 rounded-xl text-xs font-semibold hover:bg-pink-500/20 transition-colors">
          <Plus size={13} /> Thêm hồ sơ mới
        </button>

        {showAdd && (
          <form onSubmit={handleAdd} className="bg-sb-s2 rounded-xl border border-sb-border p-4 space-y-3">
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
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl border border-sb-border text-sb-tx-3 text-sm">Huỷ</button>
              <button type="submit" disabled={addLoading} className="flex-1 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {addLoading && <Loader2 size={12} className="animate-spin" />} Thêm
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-sb-info" size={24} /></div>
        ) : records.length === 0 ? (
          <div className="text-center py-10">
            <Activity size={32} className="mx-auto text-sb-tx-3 mb-2" />
            <p className="text-sb-tx-3 text-sm">Chưa có hồ sơ sức khoẻ</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {records.map((r, i) => (
              <div key={i} className="bg-sb-s2 border border-sb-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sb-tx text-sm font-semibold">{r.condition || "—"}</span>
                  <span className="text-sb-tx-3 text-xs bg-sb-s2 px-2 py-0.5 rounded-full">{r.checkDate || "—"}</span>
                </div>
                {r.veterinarian && <p className="text-sb-tx-3 text-xs">🩺 {r.veterinarian}</p>}
                {r.notes && <p className="text-sb-tx-3 text-xs mt-1 italic">"{r.notes}"</p>}
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
      birthYear: horse.birthYear || "",
      gender: horse.gender || "",
      color: horse.color || "",
      weightKg: horse.weightKg || horse.weight || "",
      description: horse.description || "",
      status: horse.status || "Active",
    });
    setShowEdit(horse);
    setFormError("");
  };

  const activeCount   = horses.filter((h) => h.status === "Active").length;
  const injuredCount  = horses.filter((h) => h.status === "Injured").length;
  const inactiveCount = horses.filter((h) => h.status === "Inactive").length;

  return (
    <AdminLayout title="Ngựa của tôi">

      {/* ── Page Header Banner ── */}
      <div className="page-header mb-0">
        {/* right glow */}
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-orange-500/[0.05] to-transparent pointer-events-none" />
        {/* floating emoji */}

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <PawPrint size={14} className="text-orange-400" />
              </div>
              <span className="text-[10px] font-bold text-sb-tx-3 uppercase tracking-widest">Quản lý ngựa</span>
            </div>
            <h1 className="text-2xl font-black text-sb-tx leading-tight">Ngựa của tôi</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="stat-pill"><span className="text-sb-tx font-bold">{horses.length}</span> tổng cộng</span>
              {activeCount > 0 && <span className="stat-pill text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block mr-1" />{activeCount} hoạt động</span>}
              {injuredCount > 0 && <span className="stat-pill text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block mr-1" />{injuredCount} bị thương</span>}
              {inactiveCount > 0 && <span className="stat-pill text-sb-tx-3"><span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block mr-1" />{inactiveCount} không hoạt động</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={fetchHorses}
              className="flex items-center gap-2 px-3 py-2 bg-sb-s1 border border-sb-border rounded-xl text-sb-tx-3 hover:text-sb-info hover:border-blue-300 text-sm transition-all">
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
          <div className="flex items-center gap-3 p-4 bg-sb-lose/10 border border-sb-lose/30 rounded-xl text-sb-lose text-sm">
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
            <p className="text-sb-tx font-semibold mb-1">Chưa có ngựa nào</p>
            <p className="text-sb-tx-3 text-sm mb-4">Thêm ngựa đầu tiên vào danh sách của bạn</p>
            <button onClick={() => { setFormData(EMPTY_FORM); setFormError(""); setShowCreate(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold rounded-xl text-sm btn-gold-glow">
              <Plus size={15} /> Thêm ngựa đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {horses.map((horse, idx) => {
              const statusCfg = STATUS_CONFIG[horse.status] || { label: horse.status, color: "bg-gray-500/20 text-sb-tx-3 border-gray-500/40", strip: "from-gray-500/20 to-gray-500/5", dot: "bg-gray-400" };
              return (
                <div
                  key={horse.horseId}
                  className="group relative bg-sb-s1 border border-sb-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-sb-info/30 transition-all"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Top gradient strip based on status */}
                  <div className={`h-0.5 w-full bg-gradient-to-r ${statusCfg.strip}`} />

                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {/* Horse avatar */}
                        <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${statusCfg.strip} border border-sb-border shrink-0`}>
                          🐴
                          <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${statusCfg.dot}`} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sb-tx font-bold text-base leading-tight truncate">{horse.horseName}</h3>
                          <p className="text-sb-tx-3 text-xs mt-0.5 flex items-center gap-1">
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
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[
                        { label: "Tuổi",   value: horse.birthYear ? `${currentYear - horse.birthYear}t` : (horse.age ? `${horse.age}t` : "—"), icon: "🎂" },
                        { label: "Cân nặng", value: (horse.weightKg || horse.weight) ? `${horse.weightKg || horse.weight}kg` : "—", icon: "⚖️" },
                      ].map(({ label, value, icon }) => (
                        <div key={label} className="bg-sb-s2 rounded-xl p-2.5 text-center border border-sb-border">
                          <span className="text-sm block mb-0.5">{icon}</span>
                          <p className="text-sb-tx text-sm font-bold leading-none">{value}</p>
                          <p className="text-sb-tx-3 text-[9px] uppercase tracking-wider mt-0.5">{label}</p>
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
                      <span className="text-sb-tx-3 text-[10px] uppercase tracking-wider shrink-0">Trạng thái:</span>
                      <select
                        value={horse.status || "Active"}
                        disabled={statusLoading === horse.horseId}
                        onChange={(e) => handleChangeStatus(horse.horseId, e.target.value)}
                        className="flex-1 bg-sb-s1 border border-sb-border rounded-lg px-2 py-1 text-xs text-sb-tx focus:outline-none focus:border-sb-emerald transition-all cursor-pointer disabled:opacity-50"
                      >
                        <option value="Active">🟢 Hoạt động</option>
                        <option value="Injured">🔴 Bị thương</option>
                        <option value="Inactive">⚫ Không hoạt động</option>
                      </select>
                      {statusLoading === horse.horseId && <Loader2 size={12} className="animate-spin text-[#D4AF37] shrink-0" />}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-sb-border">
                      <button onClick={() => setShowHealth(horse)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-pink-500/10 border border-pink-500/30 text-pink-400 hover:bg-pink-500/20 hover:border-pink-300 rounded-xl text-xs font-semibold transition-all">
                        <Heart size={11} /> Sức khoẻ
                      </button>
                      <button onClick={() => openEdit(horse)}
                        className="p-2 bg-sb-s2 border border-sb-border text-sb-tx-3 hover:text-sb-info hover:border-blue-300 hover:bg-sb-info/10 rounded-xl transition-all">
                        <Edit2 size={14} />
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
          {formError && <div className="mb-4 flex items-center gap-2 p-3 bg-sb-lose/10 border border-sb-lose/30 rounded-xl text-sb-lose text-sm"><AlertCircle size={13} />{formError}</div>}
          <HorseForm form={formData} onChange={handleFormChange} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={formLoading} submitLabel="Thêm ngựa" />
        </Modal>
      )}

      {showEdit && (
        <Modal title={`Chỉnh sửa — ${showEdit.horseName}`} onClose={() => setShowEdit(null)}>
          {formError && <div className="mb-4 flex items-center gap-2 p-3 bg-sb-lose/10 border border-sb-lose/30 rounded-xl text-sb-lose text-sm"><AlertCircle size={13} />{formError}</div>}
          <HorseForm form={formData} onChange={handleFormChange} onSubmit={handleEdit} onCancel={() => setShowEdit(null)} loading={formLoading} submitLabel="Lưu thay đổi" />
        </Modal>
      )}

      {showHealth &&<HealthModal horseId={showHealth.horseId} horseName={showHealth.horseName} onClose={() => setShowHealth(null)} />}
    </AdminLayout>
  );
}
