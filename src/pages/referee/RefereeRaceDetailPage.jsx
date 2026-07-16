import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Award, AlertTriangle, FileText,
  AlertCircle, Loader2, Plus, Trash2, Edit2, X, Save,
  Play, Flag, Send, CheckCircle2, Mail,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { confirmBox } from "../../lib/toast";
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
      <div className="bg-[#111827] border border-sb-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sb-border sticky top-0 bg-[#111827]">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-sb-tx-3 hover:text-sb-tx"><X size={18} /></button>
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

  // Chỉ ngựa CÓ jockey mới đủ điều kiện đua → chỉ nhập kết quả cho các entry này
  const raceable = entries.filter((e) => e.jockeyId || e.jockeyName);

  const initForm = () => {
    const initialForm = raceable.map((e, i) => ({
      entryId: e.entryId,
      horseName: e.horseName || `Ngựa #${e.horseId}`,
      jockeyName: e.jockeyName || "—",
      position: i + 1,
      mm: "",   // phút
      ss: "",   // giây (có thể lẻ .SSS)
      dnf: false,
      note: "",
    }));
    setForm(initialForm);
    setShowForm(true);
    setIsEditing(results.length > 0);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // Phút + Giây → tổng số giây (BE nhận số giây thuần)
    const toFinish = (row) => {
      if (row.dnf) return null;
      if (row.mm === "" && row.ss === "") return null;
      const secs = (Number(row.mm) || 0) * 60 + (Number(row.ss) || 0);
      return secs.toFixed(3);
    };
    setFormLoading(true);
    try {
      // Xử lý TỪNG ngựa: đã có kết quả → cập nhật (PUT), chưa có → tạo mới (POST).
      // Tránh lỗi "Entry nay da co ket qua" khi nhập lại / nhập bổ sung.
      for (const row of form) {
        const existing = results.find((r) => r.entryId === row.entryId);
        if (existing?.resultId) {
          await raceResultService.updateResult(raceId, existing.resultId, {
            entryId: row.entryId,
            position: Number(row.position),
            finishTime: toFinish(row),
            dnf: row.dnf,
            note: row.note || "",
          });
        } else {
          await raceResultService.createResults(raceId, {
            entryId: row.entryId,
            position: Number(row.position),
            finishTime: toFinish(row),
            dnf: row.dnf,
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
        <div className="text-center py-10 text-sb-tx-3">
          <Award size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Chưa có kết quả. Hãy nhập kết quả vòng đua.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sb-tx-3 text-xs">
            Hệ thống đã tính: <b className="text-sb-tx-2">Giờ chính thức = Giờ về đích + Phạt</b>. Ngựa DQ/DNF xếp cuối.
          </p>
          {/* Bảng kết quả đã tính — hạng · giờ về đích · phạt · giờ chính thức */}
          <div className="rounded-xl border border-sb-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-sb-s2 border-b border-sb-border text-[10px] uppercase tracking-widest text-sb-tx-3">
                    <th className="text-left px-4 py-2.5">Hạng</th>
                    <th className="text-left px-4 py-2.5">Ngựa / Nài</th>
                    <th className="text-right px-4 py-2.5">Về đích</th>
                    <th className="text-right px-4 py-2.5">Phạt</th>
                    <th className="text-right px-4 py-2.5">Chính thức</th>
                  </tr>
                </thead>
                <tbody>
                  {results
                    .map((r) => ({ ...r, pos: r.finishPosition ?? r.position }))
                    .sort((a, b) => (a.pos || 99) - (b.pos || 99))
                    .map((r) => {
                      const dq = r.dq || r.dnf;
                      return (
                        <tr key={r.resultId || r.entryId} className={`border-b border-sb-border last:border-0 ${dq ? "bg-red-950/10" : ""}`}>
                          <td className="px-4 py-3">
                            <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center font-bold text-sm ${
                              dq ? "bg-red-500/15 text-red-400" :
                              r.pos === 1 ? "bg-[#D4AF37]/20 text-[#D4AF37]" :
                              r.pos === 2 ? "bg-gray-400/20 text-sb-tx-2" :
                              r.pos === 3 ? "bg-amber-700/20 text-amber-500" :
                              "bg-sb-s2 text-sb-tx-3"
                            }`}>{dq ? "✕" : (r.pos ?? "—")}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-white font-medium">{r.horseName || `Ngựa #${r.horseId}`}</p>
                            <p className="text-sb-tx-3 text-xs">🏇 {r.jockeyName || "—"}{dq && <span className="text-red-400 ml-1">· {r.dq ? "DQ" : "DNF"}</span>}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sb-tx-2">{r.finishTime || "—"}</td>
                          <td className="px-4 py-3 text-right font-mono text-red-300">{r.penaltyTime && Number(String(r.penaltyTime).replace(/[^0-9.]/g,"")) > 0 ? `+${r.penaltyTime}` : "0"}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-sb-gold-2">{dq ? "LOẠI" : (r.finalTime || r.finishTime || "—")}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <Modal title={isEditing ? "Cập nhật kết quả" : "Nhập kết quả vòng đua"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            <p className="text-sb-tx-3 text-xs mb-4">Sắp xếp thứ hạng và nhập thời gian cho từng ngựa</p>
            {form.map((row, idx) => (
              <div key={row.entryId || idx} className="bg-[#0A0E1A]/60 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sb-tx-3 text-xs">Hạng</label>
                    <input type="number" min="1" value={row.position}
                      onChange={(e) => setForm((prev) => prev.map((r, i) => i === idx ? { ...r, position: Number(e.target.value) } : r))}
                      className="w-14 bg-[#0A0E1A] border border-sb-border rounded px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-[#D4AF37]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{row.horseName}</p>
                    <p className="text-sb-tx-3 text-xs">Jockey: {row.jockeyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sb-tx-3 text-xs">Thời gian:</span>
                  <select value={row.mm} disabled={row.dnf}
                    onChange={(e) => setForm((prev) => prev.map((r, i) => i === idx ? { ...r, mm: e.target.value } : r))}
                    className="bg-[#0A0E1A] border border-sb-border rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#D4AF37] disabled:opacity-40">
                    <option value="">-- phút --</option>
                    {[0,1,2,3,4,5].map((m) => <option key={m} value={m}>{m} phút</option>)}
                  </select>
                  <input type="number" step="0.001" min="0" max="59.999" placeholder="giây (vd 23.456)"
                    value={row.ss} disabled={row.dnf}
                    onChange={(e) => setForm((prev) => prev.map((r, i) => i === idx ? { ...r, ss: e.target.value } : r))}
                    className="w-32 bg-[#0A0E1A] border border-sb-border rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#D4AF37] disabled:opacity-40" />
                  <label className="flex items-center gap-1.5 text-xs text-sb-tx-2 cursor-pointer ml-auto">
                    <input type="checkbox" checked={row.dnf} className="accent-sb-lose"
                      onChange={(e) => setForm((prev) => prev.map((r, i) => i === idx ? { ...r, dnf: e.target.checked } : r))} />
                    Bỏ cuộc (DNF)
                  </label>
                </div>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm">Huỷ</button>
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
    if (!(await confirmBox("Xác nhận xoá vi phạm này?", { okText: "Xoá", danger: true }))) return;
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
        <div className="text-center py-10 text-sb-tx-3">
          <AlertTriangle size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Không có vi phạm nào được ghi nhận</p>
        </div>
      ) : (
        <div className="space-y-2">
          {violations.map((v) => {
            // BE trả vi phạm không kèm tên ngựa → tra từ entries theo entryId
            const ent = entries.find((e) => e.entryId === v.entryId) || {};
            const horse = v.horseName || ent.horseName || (ent.horseId ? `Ngựa #${ent.horseId}` : "Ngựa —");
            return (
            <div key={v.violationId} className="flex items-start justify-between bg-red-950/10 border border-red-900/30 rounded-xl p-4">
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{horse}</p>
                <p className="text-orange-300 text-xs font-medium mt-0.5">{v.violationType}</p>
                {v.description && <p className="text-sb-tx-3 text-xs mt-1">{v.description}</p>}
                {v.penalty && <p className="text-red-300 text-xs mt-0.5">Hình phạt: {v.penalty}</p>}
              </div>
              <button onClick={() => handleDelete(v.violationId)}
                className="p-2 text-sb-tx-3 hover:text-red-400 transition-colors ml-2">
                <Trash2 size={14} />
              </button>
            </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <Modal title="Ghi nhận vi phạm" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-wider mb-1">Ngựa vi phạm *</label>
              <select value={form.entryId} onChange={(e) => setForm((p) => ({ ...p, entryId: e.target.value }))} required
                className="w-full bg-[#0A0E1A] border border-sb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37]">
                <option value="">-- Chọn ngựa --</option>
                {entries.filter((e) => e.jockeyId || e.jockeyName).map((e) => <option key={e.entryId} value={e.entryId}>{e.horseName || `Ngựa #${e.horseId}`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-wider mb-1">Loại vi phạm *</label>
              {violationOptions.length > 0 ? (
                <select value={form.violationType}
                  onChange={(e) => handleViolationTypeChange(e.target.value)}
                  required
                  className="w-full bg-[#0A0E1A] border border-sb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37]">
                  <option value="">-- Chọn loại vi phạm --</option>
                  {violationOptions.map((o) => {
                    const label = o.violationType || o.type || o.name || "";
                    return <option key={label} value={label}>{label}</option>;
                  })}
                </select>
              ) : (
                <input value={form.violationType} onChange={(e) => setForm((p) => ({ ...p, violationType: e.target.value }))} required
                  placeholder="VD: Cản đường, Xuất phát sớm..."
                  className="w-full bg-[#0A0E1A] border border-sb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
              )}
            </div>
            <div>
              <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-wider mb-1">Mô tả chi tiết</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2}
                className="w-full bg-[#0A0E1A] border border-sb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37] resize-none" />
            </div>
            <div>
              <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-wider mb-1">
                Hình phạt {form.violationType && <span className="text-[#D4AF37] normal-case">(tự động từ loại vi phạm)</span>}
              </label>
              <input value={form.penalty}
                onChange={(e) => setForm((p) => ({ ...p, penalty: e.target.value }))}
                placeholder="Tự điền khi chọn loại vi phạm..."
                className={`w-full bg-[#0A0E1A] border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37] ${form.penalty ? "border-amber-600/50 text-amber-300" : "border-sb-border text-white"}`} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm">Huỷ</button>
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
  const [form, setForm] = useState({ content: "", weatherCondition: "", trackCondition: "", notes: "", minutesFileUrl: "" });
  const [fileName, setFileName] = useState("");
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
          minutesFileUrl: res.data.minutesFileUrl || "",
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
    if (!form.minutesFileUrl) { alert("Vui lòng đính kèm file biên bản (ảnh/PDF đã ký)."); return; }
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
      <div className="text-center py-10 text-sb-tx-3">
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
            className="flex items-center gap-2 px-4 py-2 bg-[#111827] border border-sb-border text-sb-tx-3 hover:text-sb-tx rounded-lg text-sm transition-colors">
            <Edit2 size={14} /> Chỉnh sửa biên bản
          </button>
        </div>
        <div className="space-y-3">
          {[
            ["Điều kiện thời tiết", minutes.weatherCondition],
            ["Điều kiện đường đua", minutes.trackCondition],
            ["Nội dung biên bản", minutes.content],
            ["File biên bản", minutes.minutesFileUrl],
            ["Ghi chú thêm", minutes.notes],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} className="bg-[#0A0E1A]/60 rounded-xl p-4">
              <p className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest mb-1">{label}</p>
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
          <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-wider mb-1">{label}</label>
          <input value={form[field]} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))} placeholder={placeholder}
            className="w-full bg-[#0A0E1A] border border-sb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
        </div>
      ))}
      <div>
        <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-wider mb-1">Nội dung biên bản *</label>
        <textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} rows={6} required
          placeholder="Mô tả diễn biến vòng đua, sự cố, quyết định của trọng tài..."
          className="w-full bg-[#0A0E1A] border border-sb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37] resize-none" />
      </div>
      <div>
        <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-wider mb-1">
          File biên bản đã ký <span className="text-red-400">*</span>
        </label>
        <label className="flex items-center gap-3 bg-[#0A0E1A] border border-dashed border-sb-border-2 rounded-lg px-3 py-3 cursor-pointer hover:border-[#D4AF37] transition-colors">
          <input type="file" accept="image/*,application/pdf" hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setFileName(f.name);
              setForm((p) => ({ ...p, minutesFileUrl: `demo-uploads/${f.name}` }));
              // Ảnh: lưu data URL vào localStorage (theo raceId) để hiện ảnh thật khi xem biên bản (demo 1 máy)
              if (f.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = () => { try { localStorage.setItem(`minutes-img-${raceId}`, reader.result); } catch { /* ảnh quá lớn */ } };
                reader.readAsDataURL(f);
              } else {
                try { localStorage.removeItem(`minutes-img-${raceId}`); } catch { /* ignore */ }
              }
            }} />
          <span className="text-lg">📎</span>
          <span className="text-sm text-sb-tx-2">
            {fileName || form.minutesFileUrl || "Bấm để đính kèm ảnh/PDF biên bản có chữ ký..."}
          </span>
        </label>
        <p className="text-sb-tx-3 text-[11px] mt-1">Đây là môi trường demo — chỉ lưu tên file làm minh chứng, không upload thật.</p>
      </div>
      <div>
        <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-wider mb-1">Ghi chú thêm</label>
        <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2}
          className="w-full bg-[#0A0E1A] border border-sb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37] resize-none" />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm">Huỷ</button>
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
  const [busy, setBusy] = useState("");
  const [flash, setFlash] = useState("");
  const [sent, setSent] = useState(false);          // đã gửi biên bản cho Owner
  const [handedOff, setHandedOff] = useState(false); // đã bàn giao BTC

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [raceRes, entriesRes, minRes] = await Promise.all([
        spectatorService.getRaceById(raceId),
        spectatorService.getRaceEntries(raceId),
        raceResultService.getMinutes(raceId).catch(() => ({ data: null })),
      ]);
      setRace(raceRes.data);
      setEntries(entriesRes.data || []);
      // Nếu biên bản đã gửi Owner từ trước → giữ nút khoá kể cả khi reload
      if (minRes?.data?.sentToOwners) setSent(true);
    } catch (e) {
      setError(e.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [raceId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const doAction = async (key, fn, okMsg, onOk) => {
    if (busy) return;              // chặn spam khi đang xử lý
    setBusy(key); setError(""); setFlash("");
    try {
      await fn();
      setFlash(okMsg);
      if (onOk) onOk();            // đánh dấu đã xong (khoá nút)
      await fetchData();
    } catch (e) {
      setError(e.message || "Thao tác thất bại");
    } finally {
      setBusy("");
    }
  };

  const status = race?.status;
  // Chỉ tính ngựa đủ điều kiện đua (đã có jockey)
  const raceableCount = entries.filter((e) => e.jockeyId || e.jockeyName).length;
  const canStart = (status === "Scheduled" || status === "RegistrationOpen") && raceableCount >= 1;
  const startBlockedNoHorse = (status === "Scheduled" || status === "RegistrationOpen") && raceableCount < 1;

  return (
    <AdminLayout title="Nhập liệu vòng đua">
      <div className="p-6 space-y-6">
        <button onClick={() => navigate("/referee/races")}
          className="flex items-center gap-2 text-sb-tx-3 hover:text-sb-tx transition-colors text-sm">
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
            {flash && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-sb-emerald-soft border border-sb-emerald-bd text-sb-emerald-ink text-sm">
                <CheckCircle2 size={15} className="shrink-0" /> {flash}
              </div>
            )}

            {/* Race header + điều khiển trạng thái */}
            <div className="bg-[#111827]/80 border border-sb-border rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-white">{race?.raceName}</h1>
                  <div className="flex items-center gap-4 mt-2 text-sb-tx-3 text-sm flex-wrap">
                    {race?.startTime && <span>{new Date(race.startTime).toLocaleString("vi-VN")}</span>}
                    {race?.distance && <span>{race.distance}m</span>}
                    <span className="text-[#D4AF37]">{entries.length} ngựa tham gia</span>
                    <span className="px-2 py-0.5 rounded-full bg-sb-s2 border border-sb-border text-sb-tx-2 text-xs font-semibold">{status}</span>
                  </div>
                </div>

                {/* Trọng tài là NGƯỜI DUY NHẤT đổi trạng thái đua */}
                <div className="flex items-center gap-2 flex-wrap">
                  {canStart && (
                    <button onClick={() => doAction("start", () => raceResultService.changeRaceStatus(raceId, "Ongoing"), "Đã bắt đầu vòng đua")}
                      disabled={!!busy}
                      className="flex items-center gap-2 px-4 h-10 rounded-xl bg-sb-emerald text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
                      {busy === "start" ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Bắt đầu đua
                    </button>
                  )}
                  {startBlockedNoHorse && (
                    <span className="flex items-center gap-2 px-4 h-10 rounded-xl bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm font-semibold">
                      <AlertCircle size={14} /> Chưa có ngựa (có nài) — không thể bắt đầu
                    </span>
                  )}
                  {status === "Ongoing" && (
                    <button onClick={() => doAction("finish", () => raceResultService.changeRaceStatus(raceId, "Finished"), "Đã kết thúc vòng đua")}
                      disabled={!!busy}
                      className="flex items-center gap-2 px-4 h-10 rounded-xl bg-sb-gold text-[#0B0F14] font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
                      {busy === "finish" ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />} Kết thúc đua
                    </button>
                  )}
                  {status === "Finished" && (
                    <>
                      <button onClick={() => doAction("send", () => raceResultService.sendMinutes(raceId), "Đã gửi biên bản cho toàn bộ Owner", () => setSent(true))}
                        disabled={!!busy || sent}
                        className="flex items-center gap-2 px-4 h-10 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx-2 hover:text-sb-tx font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        {busy === "send" ? <Loader2 size={14} className="animate-spin" /> : sent ? <CheckCircle2 size={14} /> : <Mail size={14} />}
                        {sent ? "Đã gửi Owner" : "Gửi cho Owner"}
                      </button>
                      <button onClick={() => doAction("handoff", () => raceResultService.handoff(raceId), "Đã bàn giao cho Ban tổ chức", () => setHandedOff(true))}
                        disabled={!!busy || handedOff}
                        className="flex items-center gap-2 px-4 h-10 rounded-xl bg-sb-emerald text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
                        {busy === "handoff" ? <Loader2 size={14} className="animate-spin" /> : handedOff ? <CheckCircle2 size={14} /> : <Send size={14} />}
                        {handedOff ? "Đã bàn giao" : "Bàn giao BTC"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#111827]/60 p-1 rounded-xl border border-sb-border">
              {TABS.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 flex-1 justify-center py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id ? "bg-[#D4AF37] text-[#0A0E1A]" : "text-sb-tx-3 hover:text-sb-tx"
                  }`}>
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="bg-[#111827]/80 border border-sb-border rounded-2xl p-6">
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
