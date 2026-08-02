import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Edit2,
  ExternalLink,
  FileText,
  Heart,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { horseService } from "../../services/horse";
import { uploadService } from "../../services/upload";

const STATUS_OPTIONS = ["Active", "Injured", "Inactive"];
const FILTER_OPTIONS = ["Active", "Injured", "Inactive", "All"];

const STATUS_CONFIG = {
  Active: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd",
  Injured: "bg-sb-lose/10 text-sb-lose border-sb-lose/30",
  Inactive: "bg-sb-s2 text-sb-tx-3 border-sb-border",
};

const HORSE_BREEDS = [
  "Thoroughbred",
  "Arabian",
  "Quarter Horse",
  "Warmblood",
  "Appaloosa",
  "Morgan",
  "Friesian",
  "Mustang",
  "Andalusian",
  "Hanoverian",
  "Paint",
  "Standardbred",
  "Irish Draught",
  "Clydesdale",
  "Vietnamese Horse",
];

const EMPTY_FORM = {
  horseName: "",
  breed: "",
  birthYear: "",
  gender: "",
  color: "",
  weightKg: "",
  status: "Active",
};

const currentYear = new Date().getFullYear();
const inputCls = "w-full bg-sb-s1 border border-sb-border rounded-xl px-3 py-2.5 text-sb-tx text-sm focus:outline-none focus:border-sb-emerald focus:ring-1 focus:ring-sb-emerald/40 transition-all placeholder:text-sb-tx-3";

function Modal({ title, accentColor = "#D4AF37", onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-sb-s1 border border-sb-border rounded-2xl w-full max-w-xl shadow-2xl shadow-black/20 max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        <div className="h-0.5 w-full rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
        <div className="flex items-center justify-between px-6 py-4 border-b border-sb-border">
          <h3 className="text-sb-tx font-bold">{title}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-sb-tx-3 hover:text-sb-tx-2 hover:bg-sb-s2 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto min-h-0">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-1.5">
        {label}{required && <span className="text-sb-lose"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-sb-tx-3">{hint}</p>}
    </div>
  );
}

function normalizeStatus(status) {
  if (STATUS_OPTIONS.includes(status)) return status;
  if (status === true || status === "true") return "Active";
  if (status === false || status === "false") return "Inactive";
  return "Active";
}

function validateHorseForm(form) {
  if (!form.horseName.trim()) return "Horse name is required.";
  if (!form.birthYear) return "Birth year is required.";
  const birthYear = Number(form.birthYear);
  if (Number.isNaN(birthYear) || birthYear < 1980 || birthYear > currentYear) {
    return `Birth year must be between 1980 and ${currentYear}.`;
  }
  if (!form.weightKg) return "Weight is required.";
  const weight = Number(form.weightKg);
  if (Number.isNaN(weight) || weight <= 0) return "Weight must be greater than 0.";
  if (!STATUS_OPTIONS.includes(form.status)) return "Status is invalid.";
  return "";
}

function HorseForm({ form, onChange, onSubmit, onCancel, loading, submitLabel }) {
  const age = form.birthYear ? currentYear - Number(form.birthYear) : null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField label="Horse Name" required>
        <input name="horseName" value={form.horseName} onChange={onChange} required className={inputCls} placeholder="Thunder Storm" />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Breed">
          <select name="breed" value={form.breed} onChange={onChange} className={inputCls}>
            <option value="">Choose breed</option>
            {HORSE_BREEDS.map((breed) => (
              <option key={breed} value={breed}>{breed}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Birth Year" required hint={age !== null && age >= 0 ? `${age} years old` : ""}>
          <input name="birthYear" type="number" min="1980" max={currentYear} value={form.birthYear} onChange={onChange} required className={inputCls} placeholder={String(currentYear - 5)} />
        </FormField>

        <FormField label="Gender">
          <select name="gender" value={form.gender} onChange={onChange} className={inputCls}>
            <option value="">Choose gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </FormField>

        <FormField label="Color">
          <input name="color" value={form.color} onChange={onChange} className={inputCls} placeholder="Bay, black, chestnut..." />
        </FormField>

        <FormField label="Weight (kg)" required>
          <input name="weightKg" type="number" min="1" step="0.1" value={form.weightKg} onChange={onChange} required className={inputCls} placeholder="450" />
        </FormField>

        <FormField label="Status" required>
          <select name="status" value={form.status} onChange={onChange} className={inputCls}>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-3 hover:text-sb-tx hover:border-sb-border-2 text-sm transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 btn-gold-glow transition-all">
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
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    checkDate: new Date().toISOString().slice(0, 10),
    healthStatus: "Active",
    diagnosis: "",
    notes: "",
    evidenceUrl: "",
  });

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

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFormError("");
    try {
      const uploaded = await uploadService.uploadEvidence(file);
      setForm((previous) => ({ ...previous, evidenceUrl: uploaded.url }));
    } catch (err) {
      setFormError(err.message || "Evidence upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.checkDate) {
      setFormError("Check date is required.");
      return;
    }
    if (!form.evidenceUrl) {
      setFormError("Health certificate image or PDF is required.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await horseService.addHealthRecord(horseId, {
        checkDate: form.checkDate,
        healthStatus: form.healthStatus,
        diagnosis: form.diagnosis.trim() || "Owner submitted health certificate",
        notes: form.notes.trim() || null,
        evidenceUrl: form.evidenceUrl,
      });
      setForm({
        checkDate: new Date().toISOString().slice(0, 10),
        healthStatus: "Active",
        diagnosis: "",
        notes: "",
        evidenceUrl: "",
      });
      load();
    } catch (err) {
      setFormError(err.message || "Submit health record failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Health Records - ${horseName}`} accentColor="rgb(244,114,182)" onClose={onClose}>
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="rounded-xl border border-pink-500/20 bg-pink-500/10 p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Check Date" required>
              <input type="date" value={form.checkDate} onChange={(event) => setForm((previous) => ({ ...previous, checkDate: event.target.value }))} className={inputCls} />
            </FormField>
            <FormField label="Health Status" required>
              <select value={form.healthStatus} onChange={(event) => setForm((previous) => ({ ...previous, healthStatus: event.target.value }))} className={inputCls}>
                {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Diagnosis">
            <input value={form.diagnosis} onChange={(event) => setForm((previous) => ({ ...previous, diagnosis: event.target.value }))} className={inputCls} placeholder="General health check" />
          </FormField>
          <FormField label="Health Certificate" required>
            <label className="flex items-center justify-center gap-2 w-full bg-sb-s1 border border-sb-border rounded-xl px-3 py-2.5 text-sb-tx text-sm hover:border-pink-400 cursor-pointer transition-all">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {form.evidenceUrl ? "Replace file" : "Upload image or PDF"}
              <input type="file" accept="image/*,.pdf" onChange={handleUpload} className="hidden" />
            </label>
            {form.evidenceUrl && (
              <a href={form.evidenceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-pink-300 hover:text-pink-200">
                <ExternalLink size={12} /> View uploaded certificate
              </a>
            )}
          </FormField>
          <FormField label="Notes">
            <textarea value={form.notes} onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))} rows={2} className={inputCls} placeholder="Optional notes for Organizer" />
          </FormField>
          {formError && <div className="flex items-center gap-2 text-sb-lose text-xs"><AlertCircle size={13} /> {formError}</div>}
          <button type="submit" disabled={submitting || uploading} className="w-full py-2.5 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-200 font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            Submit Health Record
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-sb-info" size={24} /></div>
        ) : records.length === 0 ? (
          <div className="text-center py-10">
            <Activity size={32} className="mx-auto text-sb-tx-3 mb-2" />
            <p className="text-sb-tx-3 text-sm">No health records yet.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {records.map((record) => (
              <div key={record.recordId || `${record.horseId}-${record.checkDate}`} className="bg-sb-s2 border border-sb-border rounded-xl p-3">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-sb-tx text-sm font-semibold">{record.healthStatus || record.diagnosis || "Health Check"}</span>
                  <span className="text-sb-tx-3 text-xs bg-sb-s1 px-2 py-0.5 rounded-full">{record.status || "Pending"}</span>
                </div>
                <p className="text-sb-tx-3 text-xs mb-1">{record.checkDate || "No date"}</p>
                {record.vetName && <p className="text-sb-tx-3 text-xs">Veterinarian: {record.vetName}</p>}
                {record.notes && <p className="text-sb-tx-3 text-xs mt-1">{record.notes}</p>}
                {record.evidenceUrl && (
                  <a href={uploadService.normalizeUploadUrl(record.evidenceUrl)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-pink-300 hover:text-pink-200">
                    <ExternalLink size={12} /> View certificate
                  </a>
                )}
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showHealth, setShowHealth] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [statusLoading, setStatusLoading] = useState("");
  const [archiveLoading, setArchiveLoading] = useState("");

  const fetchHorses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await horseService.getMyHorses();
      setHorses((res.data || []).map((horse) => ({ ...horse, status: normalizeStatus(horse.status || horse.healthStatus || horse.active) })));
    } catch (err) {
      setError(err.message || "Unable to load horses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHorses(); }, [fetchHorses]);

  const filteredHorses = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return horses.filter((horse) => {
      const matchesSearch = !keyword || String(horse.horseName || "").toLowerCase().includes(keyword);
      const matchesFilter = statusFilter === "All" || normalizeStatus(horse.status || horse.healthStatus || horse.active) === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [horses, search, statusFilter]);

  const counts = useMemo(() => ({
    total: horses.length,
    active: horses.filter((horse) => normalizeStatus(horse.status || horse.healthStatus || horse.active) === "Active").length,
    injured: horses.filter((horse) => normalizeStatus(horse.status || horse.healthStatus || horse.active) === "Injured").length,
    inactive: horses.filter((horse) => normalizeStatus(horse.status || horse.healthStatus || horse.active) === "Inactive").length,
  }), [horses]);

  const handleFormChange = (event) => {
    setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  const submitPayload = () => ({
    horseName: formData.horseName.trim(),
    breed: formData.breed || null,
    birthYear: formData.birthYear ? Number(formData.birthYear) : null,
    gender: formData.gender || null,
    color: formData.color.trim() || null,
    weightKg: formData.weightKg ? Number(formData.weightKg) : null,
    status: formData.status,
  });

  const handleCreate = async (event) => {
    event.preventDefault();
    const validationError = validateHorseForm(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormLoading(true);
    setFormError("");
    try {
      await horseService.create(submitPayload());
      setShowCreate(false);
      setFormData(EMPTY_FORM);
      fetchHorses();
    } catch (err) {
      setFormError(err.message || "Create failed.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    const validationError = validateHorseForm(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormLoading(true);
    setFormError("");
    try {
      await horseService.update(showEdit.horseId, submitPayload());
      setShowEdit(null);
      fetchHorses();
    } catch (err) {
      setFormError(err.message || "Update failed.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangeStatus = async (horseId, newStatus) => {
    setStatusLoading(horseId);
    try {
      await horseService.changeStatus(horseId, newStatus);
      setHorses((previous) => previous.map((horse) => (
        horse.horseId === horseId
          ? { ...horse, status: newStatus, healthStatus: newStatus, active: newStatus !== "Inactive" }
          : horse
      )));
    } catch (err) {
      alert(err.message || "Failed to change status.");
    } finally {
      setStatusLoading("");
    }
  };

  const handleArchiveHorse = async (horse) => {
    if (!window.confirm(`Archive horse "${horse.horseName}"? Race history will be kept.`)) return;
    setArchiveLoading(horse.horseId);
    try {
      await horseService.archive(horse.horseId);
      setHorses((previous) => previous.filter((item) => item.horseId !== horse.horseId));
    } catch (err) {
      alert(err.message || "Archive horse failed.");
    } finally {
      setArchiveLoading("");
    }
  };

  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowCreate(true);
  };

  const openEdit = (horse) => {
    setFormData({
      horseName: horse.horseName || "",
      breed: horse.breed || "",
      birthYear: horse.birthYear || "",
      gender: horse.gender || "",
      color: horse.color || "",
      weightKg: horse.weightKg || horse.weight || "",
      status: normalizeStatus(horse.status || horse.healthStatus || horse.active),
    });
    setShowEdit(horse);
    setFormError("");
  };

  return (
    <AdminLayout title="My Horses">
      <div className="page-header mb-0">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-orange-500/[0.05] to-transparent pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Activity size={14} className="text-orange-400" />
              </div>
              <span className="text-[10px] font-bold text-sb-tx-3 uppercase tracking-widest">Horse Management</span>
            </div>
            <h1 className="text-2xl font-black text-sb-tx leading-tight">My Horses</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="stat-pill"><span className="text-sb-tx font-bold">{counts.total}</span> total</span>
              <span className="stat-pill text-green-400">{counts.active} active</span>
              <span className="stat-pill text-red-400">{counts.injured} injured</span>
              <span className="stat-pill text-sb-tx-3">{counts.inactive} inactive</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={fetchHorses} className="flex items-center gap-2 px-3 py-2 bg-sb-s1 border border-sb-border rounded-xl text-sb-tx-3 hover:text-sb-info hover:border-blue-300 text-sm transition-all" title="Refresh">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
            <button type="button" onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold rounded-xl text-sm transition-all btn-gold-glow">
              <Plus size={15} /> Add Horse
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

        <div className="bg-sb-s1 border border-sb-border rounded-2xl p-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sb-tx-3" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputCls} pl-9`} placeholder="Search by horse name" />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((status) => (
                <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${statusFilter === status ? "bg-sb-emerald text-[#07130f] border-sb-emerald" : "bg-sb-s2 text-sb-tx-3 border-sb-border hover:text-sb-tx"}`}>
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-20 shimmer rounded-2xl" style={{ animationDelay: `${index * 80}ms` }} />
            ))}
          </div>
        ) : horses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center mb-4">
              <Activity size={28} className="text-orange-400" />
            </div>
            <p className="text-sb-tx font-semibold mb-1">No horses yet</p>
            <p className="text-sb-tx-3 text-sm mb-4">Add your first horse to your stable.</p>
            <button type="button" onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold rounded-xl text-sm btn-gold-glow">
              <Plus size={15} /> Add First Horse
            </button>
          </div>
        ) : filteredHorses.length === 0 ? (
          <div className="bg-sb-s1 border border-sb-border rounded-2xl py-16 text-center">
            <p className="text-sb-tx font-semibold">No matching horses</p>
            <p className="text-sb-tx-3 text-sm mt-1">Try another keyword or status filter.</p>
          </div>
        ) : (
          <div className="bg-sb-s1 border border-sb-border rounded-2xl overflow-hidden">
            <div className="hidden lg:grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr_1.3fr] gap-4 px-4 py-3 border-b border-sb-border bg-sb-s2/60 text-[10px] font-bold uppercase tracking-widest text-sb-tx-3">
              <span>Horse</span>
              <span>Profile</span>
              <span>Age</span>
              <span>Weight</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-sb-border">
              {filteredHorses.map((horse) => {
                const status = normalizeStatus(horse.status || horse.healthStatus || horse.active);
                const age = horse.birthYear ? currentYear - horse.birthYear : horse.age;
                return (
                  <div key={horse.horseId} className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr_1.3fr] gap-3 lg:gap-4 px-4 py-4 lg:items-center hover:bg-sb-s2/40 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sb-tx font-bold truncate">{horse.horseName}</p>
                      <p className="text-sb-tx-3 text-xs truncate">{horse.registerCode || "No register code"}</p>
                    </div>
                    <div className="text-sm text-sb-tx-2">
                      <p>{horse.breed || "Unknown breed"}</p>
                      <p className="text-xs text-sb-tx-3">{[horse.gender, horse.color].filter(Boolean).join(" / ") || "No profile details"}</p>
                    </div>
                    <div className="text-sm text-sb-tx-2">{age ? `${age} years` : "No age"}</div>
                    <div className="text-sm text-sb-tx-2">{horse.weightKg || horse.weight ? `${horse.weightKg || horse.weight} kg` : "No weight"}</div>
                    <div>
                      <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-bold ${STATUS_CONFIG[status] || STATUS_CONFIG.Active}`}>
                        {status}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row lg:justify-end gap-2">
                      <select value={status} disabled={statusLoading === horse.horseId} onChange={(event) => handleChangeStatus(horse.horseId, event.target.value)} className="bg-sb-s2 border border-sb-border rounded-xl px-3 py-2 text-xs text-sb-tx focus:outline-none focus:border-sb-emerald disabled:opacity-50">
                        {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                      <button type="button" onClick={() => setShowHealth(horse)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-pink-500/10 border border-pink-500/30 text-pink-400 hover:bg-pink-500/20 rounded-xl text-xs font-semibold transition-all">
                        <Heart size={12} /> Health
                      </button>
                      <button type="button" onClick={() => openEdit(horse)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-sb-s2 border border-sb-border text-sb-tx-3 hover:text-sb-info hover:border-blue-300 rounded-xl text-xs font-semibold transition-all">
                        <Edit2 size={12} /> Edit
                      </button>
                      <button type="button" onClick={() => handleArchiveHorse(horse)} disabled={archiveLoading === horse.horseId} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-sb-lose/10 border border-sb-lose/25 text-sb-lose hover:bg-sb-lose/20 rounded-xl text-xs font-semibold transition-all disabled:opacity-50">
                        {archiveLoading === horse.horseId ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Archive
                      </button>
                      {statusLoading === horse.horseId && <Loader2 size={14} className="animate-spin text-[#D4AF37] self-center" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <Modal title="Add Horse" onClose={() => setShowCreate(false)}>
          {formError && <div className="mb-4 flex items-center gap-2 p-3 bg-sb-lose/10 border border-sb-lose/30 rounded-xl text-sb-lose text-sm"><AlertCircle size={13} />{formError}</div>}
          <HorseForm form={formData} onChange={handleFormChange} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={formLoading} submitLabel="Add Horse" />
        </Modal>
      )}

      {showEdit && (
        <Modal title={`Edit ${showEdit.horseName}`} onClose={() => setShowEdit(null)}>
          {formError && <div className="mb-4 flex items-center gap-2 p-3 bg-sb-lose/10 border border-sb-lose/30 rounded-xl text-sb-lose text-sm"><AlertCircle size={13} />{formError}</div>}
          <HorseForm form={formData} onChange={handleFormChange} onSubmit={handleEdit} onCancel={() => setShowEdit(null)} loading={formLoading} submitLabel="Save Changes" />
        </Modal>
      )}

      {showHealth && (
        <HealthModal horseId={showHealth.horseId} horseName={showHealth.horseName} onClose={() => setShowHealth(null)} />
      )}
    </AdminLayout>
  );
}
