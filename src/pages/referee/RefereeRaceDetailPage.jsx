import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Award, AlertTriangle, FileText,
  AlertCircle, Loader2, Plus, Trash2, Edit2, X, Save,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { raceResultService } from "../../services/raceResult";
import { spectatorService } from "../../services/spectator";

const TABS = [
  { id: "results",    label: "Kết quả vòng đua", icon: Award },
  { id: "violations", label: "Vi phạm",           icon: AlertTriangle },
  { id: "minutes",    label: "Biên bản",           icon: FileText },
];

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#111827] border border-gray-700/60 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-[#111827]">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Results Tab ───────────────────────────────────────────────────────────────
function ResultsTab({ raceId, entries }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

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

  const initForm = () => {
    const initialForm = entries.map((e, i) => ({
      entryId: e.entryId,
      horseName: e.horseName || `Ngựa #${e.horseId}`,
      jockeyName: e.jockeyName || "—",
      position: i + 1,
      finishTime: "",
      note: "",
    }));
    setForm(initialForm);
    setShowForm(true);
    setIsEditing(results.length > 0);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (isEditing) {
        // Individual PUT per result (contract: PUT /races/{raceId}/results/{resultId})
        for (const row of form) {
          const existing = results.find((r) => r.entryId === row.entryId);
          if (existing?.resultId) {
            await raceResultService.updateResult(raceId, existing.resultId, {
              entryId: row.entryId,
              position: Number(row.position),
              finishTime: row.finishTime || null,
              note: row.note || "",
            });
          }
        }
      } else {
        // Individual POST per entry (contract: POST /races/{raceId}/results)
        for (const row of form) {
          await raceResultService.createResults(raceId, {
            entryId: row.entryId,
            position: Number(row.position),
            finishTime: row.finishTime || null,
          });
        }
      }
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.message || "Lưu kết quả thất bại");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#D4AF37]" /></div>;

  return (
    <div className="space-y-4">
      {error && <div className="text-red-300 text-sm p-3 bg-red-950/40 border border-red-900 rounded-xl">{error}</div>}
      <div className="flex justify-end">
        <button onClick={initForm}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold rounded-lg text-sm transition-colors">
          <Edit2 size={14} /> {results.length > 0 ? "Cập nhật kết quả" : "Nhập kết quả"}
        </button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <Award size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Chưa có kết quả. Hãy nhập kết quả vòng đua.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {results
            .sort((a, b) => (a.position || 99) - (b.position || 99))
            .map((r) => (
              <div key={r.resultId || r.entryId} className="flex items-center gap-4 bg-[#0A0E1A]/60 rounded-xl p-4">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                  r.position === 1 ? "bg-[#D4AF37]/20 text-[#D4AF37]" :
                  r.position === 2 ? "bg-gray-400/20 text-gray-300" :
                  r.position === 3 ? "bg-amber-700/20 text-amber-500" :
                  "bg-white/5 text-gray-400"
                }`}>
                  {r.position ?? "—"}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{r.horseName || `Ngựa #${r.horseId}`}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Jockey: {r.jockeyName || "—"}{r.finishTime ? ` • Thời gian: ${r.finishTime}` : ""}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}

      {showForm && (
        <Modal title={isEditing ? "Cập nhật kết quả" : "Nhập kết quả vòng đua"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            <p className="text-gray-400 text-xs mb-4">Sắp xếp thứ hạng và nhập thời gian cho từng ngựa</p>
            {form.map((row, idx) => (
              <div key={row.entryId || idx} className="bg-[#0A0E1A]/60 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-gray-400 text-xs">Hạng</label>
                    <input type="number" min="1" value={row.position}
                      onChange={(e) => setForm((prev) => prev.map((r, i) => i === idx ? { ...r, position: Number(e.target.value) } : r))}
                      className="w-14 bg-[#0A0E1A] border border-gray-700 rounded px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-[#D4AF37]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{row.horseName}</p>
                    <p className="text-gray-500 text-xs">Jockey: {row.jockeyName}</p>
                  </div>
                </div>
                <input placeholder="Thời gian hoàn thành (VD: 1:23.456)"
                  value={row.finishTime}
                  onChange={(e) => setForm((prev) => prev.map((r, i) => i === idx ? { ...r, finishTime: e.target.value } : r))}
                  className="w-full bg-[#0A0E1A] border border-gray-700 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm">Huỷ</button>
              <button type="submit" disabled={formLoading} className="flex-1 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {formLoading && <Loader2 size={14} className="animate-spin" />} <Save size={14} /> Lưu kết quả
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Violations Tab ────────────────────────────────────────────────────────────
function ViolationsTab({ raceId, entries }) {
  const [violations, setViolations] = useState([]);
  const [violationOptions, setViolationOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ entryId: "", violationType: "", description: "", penalty: "" });
  const [formLoading, setFormLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, optRes] = await Promise.all([
        raceResultService.getViolations(raceId),
        raceResultService.getViolationOptions(),
      ]);
      setViolations(vRes.data || []);
      setViolationOptions(optRes.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [raceId]);

  useEffect(() => { load(); }, [load]);

  const handleViolationTypeChange = (violationType) => {
    const opt = violationOptions.find((o) => (o.violationType || o.type || o.name) === violationType);
    setForm((p) => ({
      ...p,
      violationType,
      penalty: opt ? (opt.defaultPenalty || opt.penalty || "") : "",
    }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await raceResultService.addViolation(raceId, form);
      setShowAdd(false);
      setForm({ entryId: "", violationType: "", description: "", penalty: "" });
      load();
    } catch (err) {
      alert(err.message || "Thêm vi phạm thất bại");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (violationId) => {
    if (!confirm("Xác nhận xoá vi phạm này?")) return;
    try {
      await raceResultService.deleteViolation(violationId);
      load();
    } catch (err) {
      alert(err.message || "Xoá thất bại");
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#D4AF37]" /></div>;

  return (
    <div className="space-y-4">
      {error && <div className="text-red-300 text-sm p-3 bg-red-950/40 border border-red-900 rounded-xl">{error}</div>}
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/40 text-red-300 hover:bg-red-600/30 rounded-lg text-sm font-medium transition-colors">
          <Plus size={14} /> Ghi nhận vi phạm
        </button>
      </div>

      {violations.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <AlertTriangle size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Không có vi phạm nào được ghi nhận</p>
        </div>
      ) : (
        <div className="space-y-2">
          {violations.map((v) => (
            <div key={v.violationId} className="flex items-start justify-between bg-red-950/10 border border-red-900/30 rounded-xl p-4">
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{v.horseName || `Ngựa #${v.horseId}`}</p>
                <p className="text-orange-300 text-xs font-medium mt-0.5">{v.violationType}</p>
                {v.description && <p className="text-gray-400 text-xs mt-1">{v.description}</p>}
                {v.penalty && <p className="text-red-300 text-xs mt-0.5">Hình phạt: {v.penalty}</p>}
              </div>
              <button onClick={() => handleDelete(v.violationId)}
                className="p-2 text-gray-500 hover:text-red-400 transition-colors ml-2">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Ghi nhận vi phạm" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Ngựa vi phạm *</label>
              <select value={form.entryId} onChange={(e) => setForm((p) => ({ ...p, entryId: e.target.value }))} required
                className="w-full bg-[#0A0E1A] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37]">
                <option value="">-- Chọn ngựa --</option>
                {entries.map((e) => <option key={e.entryId} value={e.entryId}>{e.horseName || `Ngựa #${e.horseId}`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Loại vi phạm *</label>
              {violationOptions.length > 0 ? (
                <select value={form.violationType}
                  onChange={(e) => handleViolationTypeChange(e.target.value)}
                  required
                  className="w-full bg-[#0A0E1A] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37]">
                  <option value="">-- Chọn loại vi phạm --</option>
                  {violationOptions.map((o) => {
                    const label = o.violationType || o.type || o.name || "";
                    return <option key={label} value={label}>{label}</option>;
                  })}
                </select>
              ) : (
                <input value={form.violationType} onChange={(e) => setForm((p) => ({ ...p, violationType: e.target.value }))} required
                  placeholder="VD: Cản đường, Xuất phát sớm..."
                  className="w-full bg-[#0A0E1A] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
              )}
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Mô tả chi tiết</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2}
                className="w-full bg-[#0A0E1A] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37] resize-none" />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Hình phạt {form.violationType && <span className="text-[#D4AF37] normal-case">(tự động từ loại vi phạm)</span>}
              </label>
              <input value={form.penalty}
                onChange={(e) => setForm((p) => ({ ...p, penalty: e.target.value }))}
                placeholder="Tự điền khi chọn loại vi phạm..."
                className={`w-full bg-[#0A0E1A] border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37] ${form.penalty ? "border-amber-600/50 text-amber-300" : "border-gray-700 text-white"}`} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm">Huỷ</button>
              <button type="submit" disabled={formLoading} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {formLoading && <Loader2 size={14} className="animate-spin" />} Ghi nhận
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Minutes Tab ───────────────────────────────────────────────────────────────
function MinutesTab({ raceId }) {
  const [minutes, setMinutes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ content: "", weatherCondition: "", trackCondition: "", notes: "" });
  const [formLoading, setFormLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await raceResultService.getMinutes(raceId);
      setMinutes(res.data);
      if (res.data) {
        setForm({
          content: res.data.content || "",
          weatherCondition: res.data.weatherCondition || "",
          trackCondition: res.data.trackCondition || "",
          notes: res.data.notes || "",
        });
      }
    } catch {
      setMinutes(null);
    } finally {
      setLoading(false);
    }
  }, [raceId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (minutes) await raceResultService.updateMinutes(raceId, form);
      else await raceResultService.createMinutes(raceId, form);
      setEditing(false);
      load();
    } catch (err) {
      alert(err.message || "Lưu biên bản thất bại");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#D4AF37]" /></div>;

  if (!editing && !minutes) {
    return (
      <div className="text-center py-10 text-gray-500">
        <FileText size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm mb-4">Chưa có biên bản vòng đua</p>
        <button onClick={() => setEditing(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold rounded-lg text-sm transition-colors mx-auto">
          <Plus size={14} /> Tạo biên bản
        </button>
      </div>
    );
  }

  if (!editing && minutes) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#111827] border border-gray-700 text-gray-300 hover:text-white rounded-lg text-sm transition-colors">
            <Edit2 size={14} /> Chỉnh sửa biên bản
          </button>
        </div>
        <div className="space-y-3">
          {[
            ["Điều kiện thời tiết", minutes.weatherCondition],
            ["Điều kiện đường đua", minutes.trackCondition],
            ["Nội dung biên bản", minutes.content],
            ["Ghi chú thêm", minutes.notes],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} className="bg-[#0A0E1A]/60 rounded-xl p-4">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-1">{label}</p>
              <p className="text-white text-sm whitespace-pre-wrap">{value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {[
        { label: "Điều kiện thời tiết", field: "weatherCondition", placeholder: "VD: Nắng, Mưa nhẹ..." },
        { label: "Điều kiện đường đua", field: "trackCondition", placeholder: "VD: Khô ráo, Ướt..." },
      ].map(({ label, field, placeholder }) => (
        <div key={field}>
          <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{label}</label>
          <input value={form[field]} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))} placeholder={placeholder}
            className="w-full bg-[#0A0E1A] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
        </div>
      ))}
      <div>
        <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Nội dung biên bản *</label>
        <textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} rows={6} required
          placeholder="Mô tả diễn biến vòng đua, sự cố, quyết định của trọng tài..."
          className="w-full bg-[#0A0E1A] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37] resize-none" />
      </div>
      <div>
        <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Ghi chú thêm</label>
        <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2}
          className="w-full bg-[#0A0E1A] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37] resize-none" />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm">Huỷ</button>
        <button type="submit" disabled={formLoading} className="flex-1 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
          {formLoading && <Loader2 size={14} className="animate-spin" />} <Save size={14} /> Lưu biên bản
        </button>
      </div>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RefereeRaceDetailPage() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const [race, setRace] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("results");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [raceRes, entriesRes] = await Promise.all([
        spectatorService.getRaceById(raceId),
        spectatorService.getRaceEntries(raceId),
      ]);
      setRace(raceRes.data);
      setEntries(entriesRes.data || []);
    } catch (e) {
      setError(e.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [raceId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <AdminLayout title="Nhập liệu vòng đua">
      <div className="p-6 space-y-6">
        <button onClick={() => navigate("/referee/races")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Quay về danh sách
        </button>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#D4AF37]" size={32} /></div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 bg-red-950/40 border border-red-900 rounded-xl text-red-300 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        ) : (
          <>
            {/* Race header */}
            <div className="bg-[#111827]/80 border border-gray-800/60 rounded-2xl p-6">
              <h1 className="text-xl font-bold text-white">{race?.raceName}</h1>
              <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm flex-wrap">
                {race?.startTime && <span>{new Date(race.startTime).toLocaleString("vi-VN")}</span>}
                {race?.distance && <span>{race.distance}m</span>}
                <span className="text-[#D4AF37]">{entries.length} ngựa tham gia</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#111827]/60 p-1 rounded-xl border border-gray-800/60">
              {TABS.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 flex-1 justify-center py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id ? "bg-[#D4AF37] text-[#0A0E1A]" : "text-gray-400 hover:text-white"
                  }`}>
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="bg-[#111827]/80 border border-gray-800/60 rounded-2xl p-6">
              {activeTab === "results" && <ResultsTab raceId={raceId} entries={entries} />}
              {activeTab === "violations" && <ViolationsTab raceId={raceId} entries={entries} />}
              {activeTab === "minutes" && <MinutesTab raceId={raceId} />}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
