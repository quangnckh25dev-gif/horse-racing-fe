import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Award, AlertTriangle, FileText,
  AlertCircle, Loader2, Plus, Trash2, Edit2, X, Save,
  Play, Flag, Send, CheckCircle2, Mail, ClipboardCheck,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { confirmBox } from "../../lib/toast";
import { raceResultService } from "../../services/raceResult";
import { spectatorService } from "../../services/spectator";

const TABS = [
  { id: "results",    label: "Race Results", icon: Award },
  { id: "violations", label: "Violations",           icon: AlertTriangle },
  { id: "minutes",    label: "Minutes",           icon: FileText },
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

function isValidRaceEntry(entry) {
  const status = String(entry.registrationStatus || "").toLowerCase();
  return ["approved", "ready"].includes(status) && (entry.jockeyId || entry.jockeyName);
}

// â”€â”€ Results Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ResultsTab({ raceId, entries, preRaceChecked, disabledReason }) {
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

  // Chá»‰ ngá»±a CÃ“ jockey má»›i Ä‘á»§ Ä‘iá»u kiá»‡n Ä‘ua â†’ chá»‰ nháº­p káº¿t quáº£ cho cÃ¡c entry nÃ y
  const raceable = entries.filter(isValidRaceEntry);

  const initForm = () => {
    if (disabledReason) {
      alert(disabledReason);
      return;
    }
    if (!preRaceChecked) {
      alert("Please confirm the pre-race horse information check.");
      return;
    }
    const initialForm = raceable.map((e, i) => ({
      entryId: e.entryId,
      horseName: e.horseName || `Horse #${e.horseId}`,
      jockeyName: e.jockeyName || "â€”",
      position: i + 1,
      mm: "",   // minutes
      ss: "",   // seconds (cÃ³ thá»ƒ láº» .SSS)
      dnf: false,
      note: "",
    }));
    setForm(initialForm);
    setShowForm(true);
    setIsEditing(results.length > 0);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (disabledReason) {
      alert(disabledReason);
      return;
    }
    if (!preRaceChecked) {
      alert("Please confirm the pre-race horse information check.");
      return;
    }
    // PhÃºt + GiÃ¢y â†’ tá»•ng sá»‘ seconds (BE nháº­n sá»‘ seconds thuáº§n)
    const toFinish = (row) => {
      if (row.dnf) return null;
      if (row.mm === "" && row.ss === "") return null;
      const secs = (Number(row.mm) || 0) * 60 + (Number(row.ss) || 0);
      return secs.toFixed(3);
    };
    setFormLoading(true);
    try {
      // Xá»­ lÃ½ Tá»ªNG ngá»±a: Ä‘Ã£ cÃ³ káº¿t quáº£ â†’ cáº­p nháº­t (PUT), chÆ°a cÃ³ â†’ táº¡o má»›i (POST).
      // TrÃ¡nh lá»—i "Entry nay da co ket qua" khi nháº­p láº¡i / nháº­p bá»• sung.
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
      alert(err.message || "Failed to save result");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#D4AF37]" /></div>;

  return (
    <div className="space-y-4">
      {error && <div className="text-red-300 text-sm p-3 bg-red-950/40 border border-red-900 rounded-xl">{error}</div>}
      {(disabledReason || !preRaceChecked) && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
          <AlertCircle size={14} /> {disabledReason || "Pre-race check confirmation is required before entering results."}
        </div>
      )}
      <div className="flex justify-end">
        <button onClick={initForm} disabled={!!disabledReason || !preRaceChecked}
          title={disabledReason || (!preRaceChecked ? "Complete pre-race check before entering results." : "Enter race results")}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Edit2 size={14} /> {results.length > 0 ? "Update Results" : "Enter Results"}
        </button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-10 text-sb-tx-3">
          <Award size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No result yet. Please enter race results.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sb-tx-3 text-xs">
            Há»‡ thá»‘ng Ä‘Ã£ tÃ­nh: <b className="text-sb-tx-2">Official time = finish time + penalty</b>. Horse DQ/DNF xáº¿p cuá»‘i.
          </p>
          {/* Báº£ng káº¿t quáº£ Ä‘Ã£ tÃ­nh â€” place Â· giá» vá» Ä‘Ã­ch Â· pháº¡t Â· giá» chÃ­nh thá»©c */}
          <div className="rounded-xl border border-sb-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-sb-s2 border-b border-sb-border text-[10px] uppercase tracking-widest text-sb-tx-3">
                    <th className="text-left px-4 py-2.5">Position</th>
                    <th className="text-left px-4 py-2.5">Horse / Jockey</th>
                    <th className="text-right px-4 py-2.5">Finish Time</th>
                    <th className="text-right px-4 py-2.5">Penalty</th>
                    <th className="text-right px-4 py-2.5">Official</th>
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
                            }`}>{dq ? "âœ•" : (r.pos ?? "â€”")}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-white font-medium">{r.horseName || `Horse #${r.horseId}`}</p>
                            <p className="text-sb-tx-3 text-xs">ðŸ‡ {r.jockeyName || "â€”"}{dq && <span className="text-red-400 ml-1">Â· {r.dq ? "DQ" : "DNF"}</span>}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sb-tx-2">{r.finishTime || "â€”"}</td>
                          <td className="px-4 py-3 text-right font-mono text-red-300">{r.penaltyTime && Number(String(r.penaltyTime).replace(/[^0-9.]/g,"")) > 0 ? `+${r.penaltyTime}` : "0"}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-sb-gold-2">{dq ? "DQ" : (r.finalTime || r.finishTime || "â€”")}</td>
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
        <Modal title={isEditing ? "Update Results" : "Enter Results races"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            <p className="text-sb-tx-3 text-xs mb-4">Set positions and enter times for each horse</p>
            {form.map((row, idx) => (
              <div key={row.entryId || idx} className="bg-[#0A0E1A]/60 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sb-tx-3 text-xs">Position</label>
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
                  <span className="text-sb-tx-3 text-xs">Time:</span>
                  <select value={row.mm} disabled={row.dnf}
                    onChange={(e) => setForm((prev) => prev.map((r, i) => i === idx ? { ...r, mm: e.target.value } : r))}
                    className="bg-[#0A0E1A] border border-sb-border rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#D4AF37] disabled:opacity-40">
                    <option value="">-- minutes --</option>
                    {[0,1,2,3,4,5].map((m) => <option key={m} value={m}>{m} minutes</option>)}
                  </select>
                  <input type="number" step="0.001" min="0" max="59.999" placeholder="seconds (e.g. 23.456)"
                    value={row.ss} disabled={row.dnf}
                    onChange={(e) => setForm((prev) => prev.map((r, i) => i === idx ? { ...r, ss: e.target.value } : r))}
                    className="w-32 bg-[#0A0E1A] border border-sb-border rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#D4AF37] disabled:opacity-40" />
                  <label className="flex items-center gap-1.5 text-xs text-sb-tx-2 cursor-pointer ml-auto">
                    <input type="checkbox" checked={row.dnf} className="accent-sb-lose"
                      onChange={(e) => setForm((prev) => prev.map((r, i) => i === idx ? { ...r, dnf: e.target.checked } : r))} />
                    Did Not Finish (DNF)
                  </label>
                </div>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm">Cancel</button>
              <button type="submit" disabled={formLoading} className="flex-1 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {formLoading && <Loader2 size={14} className="animate-spin" />} <Save size={14} /> Save Result
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// â”€â”€ Violations Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ViolationsTab({ raceId, entries, preRaceChecked, disabledReason }) {
  const [violations, setViolations] = useState([]);
  const [violationOptions, setViolationOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ entryId: "", violationType: "", evidenceImageUrl: "", description: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [rankingMessage, setRankingMessage] = useState("");

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

  const getOptionValue = (option) => option.type || option.violationType || option.name || "";
  const getOptionLabel = (option) => option.label || getOptionValue(option);
  const getOptionPenalty = (option) => option.penalty ?? option.penaltySeconds ?? option.defaultPenalty ?? 0;
  const selectedOption = violationOptions.find((option) => getOptionValue(option) === form.violationType);
  const selectedPenalty = selectedOption ? getOptionPenalty(selectedOption) : null;
  const isSelectedDq = Boolean(selectedOption?.isDq);

  const formatPenalty = (value, isDq) => {
    if (isDq) return "DQ";
    const amount = Number(value || 0);
    return amount > 0 ? `+${amount}s` : "0s";
  };

  const handleViolationTypeChange = (violationType) => {
    setForm((p) => ({
      ...p,
      violationType,
    }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (disabledReason) {
      alert(disabledReason);
      return;
    }
    if (!preRaceChecked) {
      alert("Please confirm the pre-race horse information check.");
      return;
    }
    setFormLoading(true);
    setRankingMessage("");
    try {
      await raceResultService.addViolation(raceId, {
        entryId: form.entryId,
        violationType: form.violationType,
        evidenceImageUrl: form.evidenceImageUrl,
        description: form.description,
      });
      setShowAdd(false);
      setForm({ entryId: "", violationType: "", evidenceImageUrl: "", description: "" });
      await Promise.all([load(), raceResultService.getResults(raceId)]);
      setRankingMessage("Violation saved. Ranking has been recalculated.");
    } catch (err) {
      setError(err.message || "Failed to record violation. Please check the selected horse and violation type.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (violationId) => {
    if (!(await confirmBox("Confirm deleting this violation?", { okText: "Delete", danger: true }))) return;
    setRankingMessage("");
    try {
      await raceResultService.deleteViolation(violationId);
      await Promise.all([load(), raceResultService.getResults(raceId)]);
      setRankingMessage("Violation deleted. Ranking has been recalculated.");
    } catch (err) {
      setError(err.message || "Failed to delete violation.");
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#D4AF37]" /></div>;

  return (
    <div className="space-y-4">
      {error && <div className="text-red-300 text-sm p-3 bg-red-950/40 border border-red-900 rounded-xl">{error}</div>}
      {rankingMessage && (
        <div className="text-sb-emerald-ink text-sm p-3 bg-sb-emerald-soft border border-sb-emerald-bd rounded-xl">
          {rankingMessage}
        </div>
      )}
      {(disabledReason || !preRaceChecked) && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
          <AlertCircle size={14} /> {disabledReason || "Pre-race check confirmation is required before recording violations."}
        </div>
      )}
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(true)} disabled={!!disabledReason || !preRaceChecked}
          title={disabledReason || (!preRaceChecked ? "Complete pre-race check before recording violations." : "Record a violation")}
          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/40 text-red-300 hover:bg-red-600/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus size={14} /> Record Violation
        </button>
      </div>

      {violations.length === 0 ? (
        <div className="text-center py-10 text-sb-tx-3">
          <AlertTriangle size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No violations recorded</p>
        </div>
      ) : (
        <div className="space-y-2">
          {violations.map((v) => {
            // BE tráº£ vi pháº¡m khÃ´ng kÃ¨m tÃªn ngá»±a â†’ tra tá»« entries theo entryId
            const ent = entries.find((e) => e.entryId === v.entryId) || {};
            const horse = v.horseName || ent.horseName || (ent.horseId ? `Horse #${ent.horseId}` : "Horse -");
            return (
            <div key={v.violationId} className="flex items-start justify-between bg-red-950/10 border border-red-900/30 rounded-xl p-4">
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{horse}</p>
                <p className="text-orange-300 text-xs font-medium mt-0.5">{v.violationType}</p>
                {v.description && <p className="text-sb-tx-3 text-xs mt-1">{v.description}</p>}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-red-300 text-xs font-semibold">
                    Penalty: {formatPenalty(v.penaltySeconds, v.isDq)}
                  </span>
                  {v.evidenceImageUrl && (
                    <a href={v.evidenceImageUrl} target="_blank" rel="noreferrer"
                      className="text-[#D4AF37] hover:underline text-xs">
                      Evidence
                    </a>
                  )}
                </div>
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
        <Modal title="Record Violation" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-wider mb-1">Violating Horse *</label>
              <select value={form.entryId} onChange={(e) => setForm((p) => ({ ...p, entryId: e.target.value }))} required
                className="w-full bg-[#0A0E1A] border border-sb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37]">
                <option value="">-- Choose Horse --</option>
                {entries.filter(isValidRaceEntry).map((e) => <option key={e.entryId} value={e.entryId}>{e.horseName || `Horse #${e.horseId}`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-wider mb-1">Violation Type *</label>
              {violationOptions.length > 0 ? (
                <select value={form.violationType}
                  onChange={(e) => handleViolationTypeChange(e.target.value)}
                  required
                  className="w-full bg-[#0A0E1A] border border-sb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37]">
                  <option value="">-- Select violation type --</option>
                  {violationOptions.map((o) => {
                    const value = getOptionValue(o);
                    return <option key={value} value={value}>{getOptionLabel(o)}</option>;
                  })}
                </select>
              ) : (
                <input value={form.violationType} onChange={(e) => setForm((p) => ({ ...p, violationType: e.target.value }))} required
                  placeholder="e.g. Blocking, false start..."
                  className="w-full bg-[#0A0E1A] border border-sb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
              )}
            </div>
            <div>
              <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-wider mb-1">Auto Penalty</label>
              <div className={`w-full rounded-lg border px-3 py-2 text-sm font-bold ${
                selectedOption ? "bg-red-500/10 border-red-500/30 text-red-300" : "bg-[#0A0E1A] border-sb-border text-sb-tx-3"
              }`}>
                {selectedOption ? `${formatPenalty(selectedPenalty, isSelectedDq)} - ${getOptionLabel(selectedOption)}` : "Select a violation type to see the penalty"}
              </div>
            </div>
            <div>
              <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-wider mb-1">Evidence Image/File</label>
              <input value={form.evidenceImageUrl}
                onChange={(e) => setForm((p) => ({ ...p, evidenceImageUrl: e.target.value }))}
                placeholder="Paste evidence URL or choose a file below..."
                className="w-full bg-[#0A0E1A] border border-sb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
              <label className="mt-2 flex items-center gap-3 bg-[#0A0E1A] border border-dashed border-sb-border-2 rounded-lg px-3 py-3 cursor-pointer hover:border-[#D4AF37] transition-colors">
                <input type="file" accept="image/*,application/pdf" hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const demoUrl = `demo-evidence/${file.name}`;
                    setForm((p) => ({ ...p, evidenceImageUrl: demoUrl }));
                  }} />
                <span className="text-sm text-sb-tx-2">
                  {form.evidenceImageUrl || "Choose evidence image/PDF..."}
                </span>
              </label>
            </div>
            <div>
              <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-wider mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2}
                placeholder="Optional when evidence is provided..."
                className="w-full bg-[#0A0E1A] border border-sb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37] resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm">Cancel</button>
              <button type="submit" disabled={formLoading} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {formLoading && <Loader2 size={14} className="animate-spin" />} Record
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// â”€â”€ Minutes Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MinutesTab({ raceId, disabledReason }) {
  const [minutes, setMinutes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ content: "", weatherCondition: "Clear", minutesFileUrl: "" });
  const [fileName, setFileName] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const weatherOptions = ["Clear", "Cloudy", "Rainy", "Windy", "Foggy", "Wet Track"];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await raceResultService.getMinutes(raceId);
      setMinutes(res.data);
      if (res.data) {
        setForm({
          content: res.data.content || "",
          weatherCondition: res.data.weatherCondition || "Clear",
          minutesFileUrl: res.data.minutesFileUrl || "",
        });
        setFileName("");
      }
    } catch {
      setMinutes(null);
    } finally {
      setLoading(false);
    }
  }, [raceId]);

  useEffect(() => { load(); }, [load]);

  const openEditor = () => {
    if (disabledReason) {
      alert(disabledReason);
      return;
    }
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (disabledReason) {
      alert(disabledReason);
      return;
    }
    if (!form.content.trim()) { alert("Minutes content is required."); return; }
    if (!form.weatherCondition) { alert("Weather condition is required."); return; }
    if (!form.minutesFileUrl) { alert("Please attach the evidence file."); return; }

    setFormLoading(true);
    try {
      const payload = {
        content: form.content.trim(),
        weatherCondition: form.weatherCondition,
        minutesFileUrl: form.minutesFileUrl,
      };
      if (minutes) await raceResultService.updateMinutes(raceId, payload);
      else await raceResultService.createMinutes(raceId, payload);
      setEditing(false);
      load();
    } catch (err) {
      alert(err.message || "Failed to save minutes");
    } finally {
      setFormLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const demoFileUrl = `demo-uploads/${file.name}`;
    setFileName(file.name);
    setForm((prev) => ({ ...prev, minutesFileUrl: demoFileUrl }));

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          localStorage.setItem(`minutes-img-${raceId}`, reader.result);
          localStorage.setItem(`minutes-file-${demoFileUrl}`, reader.result);
        } catch {
          // Ignore oversized local demo images.
        }
      };
      reader.readAsDataURL(file);
    } else {
      try { localStorage.removeItem(`minutes-img-${raceId}`); } catch { /* ignore */ }
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#D4AF37]" /></div>;

  return (
    <div className="space-y-4">
      {disabledReason && (
        <div className="flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
          <AlertCircle size={14} /> {disabledReason}
        </div>
      )}

      {!minutes ? (
        <div className="py-10 text-center text-sb-tx-3">
          <FileText size={32} className="mx-auto mb-2 opacity-30" />
          <p className="mb-4 text-sm">No race minutes yet</p>
          <button
            onClick={openEditor}
            disabled={!!disabledReason}
            title={disabledReason || "Create race minutes"}
            className="mx-auto flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#0A0E1A] transition-colors hover:bg-[#b0902c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} /> Create Minutes
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <button
              onClick={openEditor}
              disabled={!!disabledReason}
              title={disabledReason || "Edit race minutes"}
              className="flex items-center gap-2 rounded-lg border border-sb-border bg-[#111827] px-4 py-2 text-sm text-sb-tx-3 transition-colors hover:text-sb-tx disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Edit2 size={14} /> Edit Minutes
            </button>
          </div>
          <div className="space-y-3">
            {[
              ["Weather Condition", minutes.weatherCondition],
              ["Minutes Content", minutes.content],
              ["Evidence File", minutes.minutesFileUrl],
            ].filter(([, value]) => value).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-[#0A0E1A]/60 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-sb-tx-3">{label}</p>
                {label === "Evidence File" ? (
                  <a href={value} target="_blank" rel="noreferrer" className="break-all text-sm text-[#D4AF37] hover:underline">
                    {value}
                  </a>
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-white">{value}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {editing && (
        <Modal title={minutes ? "Edit Race Minutes" : "Create Race Minutes"} onClose={() => setEditing(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-sb-tx-3">Weather Condition *</label>
              <select
                value={form.weatherCondition}
                onChange={(e) => setForm((prev) => ({ ...prev, weatherCondition: e.target.value }))}
                className="w-full rounded-lg border border-sb-border bg-[#0A0E1A] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                required
              >
                {weatherOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-sb-tx-3">Minutes Content *</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                rows={6}
                required
                placeholder="Describe race events, incidents, and referee decisions..."
                className="w-full resize-none rounded-lg border border-sb-border bg-[#0A0E1A] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-sb-tx-3">
                Evidence File <span className="text-red-400">*</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-sb-border-2 bg-[#0A0E1A] px-3 py-3 transition-colors hover:border-[#D4AF37]">
                <input type="file" accept="image/*,application/pdf" hidden onChange={handleFileChange} />
                <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">File</span>
                <span className="break-all text-sm text-sb-tx-2">
                  {fileName || form.minutesFileUrl || "Click to attach evidence image/PDF..."}
                </span>
              </label>
              <p className="mt-1 text-[11px] text-sb-tx-3">Demo upload saves the file name as the evidence URL.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditing(false)} className="flex-1 rounded-lg border border-sb-border py-2 text-sm text-sb-tx-3 hover:text-sb-tx">
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-2 text-sm font-bold text-[#0A0E1A] hover:bg-[#b0902c] disabled:opacity-60">
                {formLoading && <Loader2 size={14} className="animate-spin" />}
                <Save size={14} /> Save Minutes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  const [preRaceChecked, setPreRaceChecked] = useState(false);
  const [preRaceChecks, setPreRaceChecks] = useState([]);
  const [sent, setSent] = useState(false);          // sent biÃªn báº£n cho Owner
  const [handedOff, setHandedOff] = useState(false); // Ä‘Ã£ bÃ n giao BTC

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [raceRes, entriesRes, minRes, checkRes] = await Promise.all([
        spectatorService.getRaceById(raceId),
        spectatorService.getRaceEntries(raceId),
        raceResultService.getMinutes(raceId).catch(() => ({ data: null })),
        raceResultService.getPreRaceChecks(raceId).catch(() => ({ data: [] })),
      ]);
      const checks = checkRes.data || [];
      setRace(raceRes.data);
      setEntries(entriesRes.data || []);
      setPreRaceChecks(checks);
      setPreRaceChecked(checks.length > 0 && checks.every((check) => ["checked", "rejected"].includes(String(check.status || "").toLowerCase())));
      // Náº¿u biÃªn báº£n sent Owner tá»« trÆ°á»›c â†’ giá»¯ nÃºt khoÃ¡ ká»ƒ cáº£ khi reload
      if (minRes?.data?.sentToOwners) setSent(true);
    } catch (e) {
      setError(e.message || "Unable to load data");
    } finally {
      setLoading(false);
    }
  }, [raceId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const doAction = async (key, fn, okMsg, onOk) => {
    if (busy) return;              // cháº·n spam khi Ä‘ang xá»­ lÃ½
    setBusy(key); setError(""); setFlash("");
    try {
      await fn();
      setFlash(okMsg);
      if (onOk) onOk();            // Ä‘Ã¡nh dáº¥u Ä‘Ã£ xong (khoÃ¡ nÃºt)
      await fetchData();
    } catch (e) {
      setError(e.message || "Action failed");
    } finally {
      setBusy("");
    }
  };

  const status = race?.status;
  // Chá»‰ tÃ­nh ngá»±a Ä‘á»§ Ä‘iá»u kiá»‡n Ä‘ua (Ä‘Ã£ cÃ³ jockey)
  const raceableCount = entries.filter(isValidRaceEntry).length;
  const canStart = status === "RegistrationOpen" && raceableCount >= 1 && preRaceChecked;
  const startBlockedNoHorse = status === "RegistrationOpen" && raceableCount < 1;
  const startBlockedPreCheck = status === "RegistrationOpen" && raceableCount >= 1 && !preRaceChecked;
  const resultsDisabledReason = status === "Ongoing" ? "" : "Results are available only while the race is Ongoing.";
  const violationsDisabledReason = status === "Ongoing" ? "" : "Violations are available only while the race is Ongoing.";
  const minutesDisabledReason = ["Ongoing", "Finished"].includes(status) ? "" : "Minutes are available only after the race starts.";

  return (
    <AdminLayout title="Race Data Entry">
      <div className="p-6 space-y-6">
        <button onClick={() => navigate("/referee/races")}
          className="flex items-center gap-2 text-sb-tx-3 hover:text-sb-tx transition-colors text-sm">
          <ArrowLeft size={16} /> Back to List
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

            {/* Race header + Ä‘iá»u khiá»ƒn tráº¡ng thÃ¡i */}
            <div className="bg-[#111827]/80 border border-sb-border rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-white">{race?.raceName}</h1>
                  <div className="flex items-center gap-4 mt-2 text-sb-tx-3 text-sm flex-wrap">
                    {race?.startTime && <span>{new Date(race.startTime).toLocaleString("vi-VN")}</span>}
                    {race?.distance && <span>{race.distance}m</span>}
                    <span className="text-[#D4AF37]">{entries.length} horses entered</span>
                    <span className="px-2 py-0.5 rounded-full bg-sb-s2 border border-sb-border text-sb-tx-2 text-xs font-semibold">{status}</span>
                  </div>
                </div>

                {/* Referee lÃ  NGÆ¯á»œI DUY NHáº¤T Ä‘á»•i tráº¡ng thÃ¡i Ä‘ua */}
                <div className="flex items-center gap-2 flex-wrap">
                  {canStart && (
                    <button onClick={() => doAction("start", () => raceResultService.changeRaceStatus(raceId, "Ongoing"), "Race started")}
                      disabled={!!busy}
                      className="flex items-center gap-2 px-4 h-10 rounded-xl bg-sb-emerald text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
                      {busy === "start" ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Start Race
                    </button>
                  )}
                  {startBlockedNoHorse && (
                    <span className="flex items-center gap-2 px-4 h-10 rounded-xl bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm font-semibold">
                      <AlertCircle size={14} /> No horse with jockey available - cannot start
                    </span>
                  )}
                  {startBlockedPreCheck && (
                    <span className="flex items-center gap-2 px-4 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm font-semibold">
                      <AlertCircle size={14} /> Pre-race check required
                    </span>
                  )}
                  {status === "Ongoing" && (
                    <button onClick={() => doAction("finish", () => raceResultService.changeRaceStatus(raceId, "Finished"), "Finished races")}
                      disabled={!!busy}
                      className="flex items-center gap-2 px-4 h-10 rounded-xl bg-sb-gold text-[#0B0F14] font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
                      {busy === "finish" ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />} Finish Race
                    </button>
                  )}
                  {status === "Finished" && (
                    <>
                      <button onClick={() => doAction("send", () => raceResultService.sendMinutes(raceId), "Minutes sent to all owners", () => setSent(true))}
                        disabled={!!busy || sent}
                        className="flex items-center gap-2 px-4 h-10 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx-2 hover:text-sb-tx font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        {busy === "send" ? <Loader2 size={14} className="animate-spin" /> : sent ? <CheckCircle2 size={14} /> : <Mail size={14} />}
                        {sent ? "Sent to Owners" : "Send to Owners"}
                      </button>
                      <button onClick={() => doAction("handoff", () => raceResultService.handoff(raceId), "Handed off to Organizer", () => setHandedOff(true))}
                        disabled={!!busy || handedOff}
                        className="flex items-center gap-2 px-4 h-10 rounded-xl bg-sb-emerald text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
                        {busy === "handoff" ? <Loader2 size={14} className="animate-spin" /> : handedOff ? <CheckCircle2 size={14} /> : <Send size={14} />}
                        {handedOff ? "Handed Off" : "Hand Off to Organizer"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#111827]/80 border border-sb-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                  preRaceChecked ? "bg-sb-emerald-soft border-sb-emerald-bd" : "bg-yellow-500/10 border-yellow-500/30"
                }`}>
                  {preRaceChecked ? <CheckCircle2 size={18} className="text-sb-emerald-ink" /> : <AlertCircle size={18} className="text-yellow-300" />}
                </div>
                <div>
                  <h2 className="text-white font-bold text-base">Pre-Race Check</h2>
                  <p className="text-sb-tx-3 text-sm mt-1">
                    {preRaceChecked
                      ? `All ${preRaceChecks.length} entries have been processed.`
                      : "Process every horse before starting the race."}
                  </p>
                </div>
              </div>
              <button onClick={() => navigate(`/referee/races/${raceId}/pre-race-check`)}
                className="flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] hover:bg-[#D4AF37]/20 text-sm font-bold">
                <ClipboardCheck size={14} /> Open Pre-Race Check
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#111827]/60 p-1 rounded-xl border border-sb-border">
              {TABS.map((tab) => {
                const reason = tab.id === "results" ? resultsDisabledReason : tab.id === "violations" ? violationsDisabledReason : minutesDisabledReason;
                return (
                <button key={tab.id} onClick={() => !reason && setActiveTab(tab.id)}
                  disabled={!!reason}
                  title={reason || tab.label}
                  className={`flex items-center gap-2 flex-1 justify-center py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id ? "bg-[#D4AF37] text-[#0A0E1A]" : "text-sb-tx-3 hover:text-sb-tx"
                  } ${reason ? "opacity-50 cursor-not-allowed hover:text-sb-tx-3" : ""
                  }`}>
                  <tab.icon size={14} /> {tab.label}
                </button>
              );})}
            </div>

            {/* Tab content */}
            <div className="bg-[#111827]/80 border border-sb-border rounded-2xl p-6">
              {activeTab === "results" && <ResultsTab raceId={raceId} entries={entries} preRaceChecked={preRaceChecked} disabledReason={resultsDisabledReason} />}
              {activeTab === "violations" && <ViolationsTab raceId={raceId} entries={entries} preRaceChecked={preRaceChecked} disabledReason={violationsDisabledReason} />}
              {activeTab === "minutes" && <MinutesTab raceId={raceId} disabledReason={minutesDisabledReason} />}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

