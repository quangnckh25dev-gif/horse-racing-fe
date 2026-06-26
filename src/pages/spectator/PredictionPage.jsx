import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Star, AlertCircle, Loader2, RefreshCw, Trophy,
  CheckCircle2, Clock, X,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { spectatorService } from "../../services/spectator";

const TABS = [
  { id: "make",    label: "Đặt dự đoán" },
  { id: "history", label: "Lịch sử dự đoán" },
];

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#111827] border border-gray-700/60 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function PredictionForm({ race, entries, existingPrediction, onSuccess }) {
  const [form, setForm] = useState({
    predictedWinner: existingPrediction?.predictedWinner || existingPrediction?.entryId || "",
    predictedPosition: existingPrediction?.predictedPosition || "1",
    note: existingPrediction?.note || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.predictedWinner) { setError("Vui lòng chọn ngựa"); return; }
    setLoading(true);
    setError("");
    try {
      if (existingPrediction) {
        await spectatorService.updatePrediction(race.raceId, form);
      } else {
        await spectatorService.makePrediction(race.raceId, form);
      }
      setSuccess(true);
      onSuccess && onSuccess();
    } catch (err) {
      setError(err.message || "Đặt dự đoán thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 size={40} className="mx-auto mb-3 text-green-400" />
        <p className="text-white font-semibold">Dự đoán đã được lưu!</p>
        <p className="text-gray-400 text-sm mt-1">Chúc bạn may mắn</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-900 rounded-lg text-red-300 text-sm">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      <div>
        <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Chọn ngựa chiến thắng *</label>
        <select value={form.predictedWinner}
          onChange={(e) => setForm((p) => ({ ...p, predictedWinner: e.target.value }))} required
          className="w-full bg-[#0A0E1A] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37]">
          <option value="">-- Chọn ngựa --</option>
          {entries.map((e) => (
            <option key={e.entryId} value={e.entryId}>
              {e.horseName || `Ngựa #${e.horseId}`}
              {e.jockeyName ? ` (Jockey: ${e.jockeyName})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Dự đoán vị trí về đích</label>
        <select value={form.predictedPosition} onChange={(e) => setForm((p) => ({ ...p, predictedPosition: e.target.value }))}
          className="w-full bg-[#0A0E1A] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37]">
          {[1, 2, 3].map((n) => (
            <option key={n} value={String(n)}>Hạng {n} (Top {n})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Ghi chú cá nhân</label>
        <input value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
          placeholder="VD: Ngựa này đang trong phong độ tốt..."
          className="w-full bg-[#0A0E1A] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-2.5 rounded-lg bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {loading && <Loader2 size={14} className="animate-spin" />}
        <Star size={14} /> {existingPrediction ? "Cập nhật dự đoán" : "Đặt dự đoán"}
      </button>
    </form>
  );
}

export default function PredictionPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("make");
  const [races, setRaces] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRace, setSelectedRace] = useState(null);
  const [raceEntries, setRaceEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const preselectedRaceId = searchParams.get("raceId");

  const loadRaces = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [racesRes, historyRes] = await Promise.all([
        spectatorService.getRaces(),
        spectatorService.getPredictionHistory(),
      ]);
      const upcoming = (racesRes.data || []).filter((r) => ["Scheduled", "RegistrationOpen"].includes(r.status));
      setRaces(upcoming);
      setHistory(historyRes.data || []);
    } catch (e) {
      setError(e.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRaces(); }, [loadRaces]);

  const handleSelectRace = async (race) => {
    setSelectedRace(race);
    setEntriesLoading(true);
    try {
      const res = await spectatorService.getRaceEntries(race.raceId);
      setRaceEntries(res.data || []);
    } catch {
      setRaceEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  };

  return (
    <AdminLayout title="Dự đoán của tôi">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Dự đoán kết quả</h1>
            <p className="text-gray-500 text-sm mt-0.5">Dự đoán ngựa chiến thắng các vòng đua sắp tới</p>
          </div>
          <button onClick={loadRaces}
            className="flex items-center gap-2 px-3 py-2 bg-[#111827] border border-gray-700 rounded-lg text-gray-400 hover:text-white text-sm transition-colors">
            <RefreshCw size={14} /> Làm mới
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111827]/60 p-1 rounded-xl border border-gray-800/60 w-fit">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? "bg-[#D4AF37] text-[#0A0E1A]" : "text-gray-400 hover:text-white"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-950/40 border border-red-900 rounded-xl text-red-300 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-[#111827]/60 rounded-xl animate-pulse" />)}
          </div>
        ) : activeTab === "make" ? (
          races.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Star size={40} className="mx-auto mb-3 opacity-30" />
              <p>Không có vòng đua sắp tới để dự đoán</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm">Chọn vòng đua để đặt dự đoán:</p>
              {races.map((race) => {
                const alreadyPredicted = history.find((h) => h.raceId === race.raceId);
                return (
                  <div key={race.raceId} className="bg-[#111827]/80 border border-gray-800/60 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-white font-semibold">{race.raceName}</h3>
                        {alreadyPredicted && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/40 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Đã dự đoán
                          </span>
                        )}
                      </div>
                      {race.startTime && (
                        <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                          <Clock size={11} /> {new Date(race.startTime).toLocaleString("vi-VN")}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleSelectRace(race)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold rounded-lg text-sm transition-colors shrink-0">
                      <Star size={14} /> {alreadyPredicted ? "Sửa dự đoán" : "Dự đoán"}
                    </button>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          // History tab
          history.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Trophy size={40} className="mx-auto mb-3 opacity-30" />
              <p>Bạn chưa có lịch sử dự đoán nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.predictionId || h.id}
                  className="bg-[#111827]/80 border border-gray-800/60 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-white font-semibold">{h.raceName}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Dự đoán: <span className="text-[#D4AF37]">{h.predictedHorseName || `Ngựa #${h.entryId}`}</span>
                        {h.predictedPosition && <span className="text-gray-500"> (Hạng {h.predictedPosition})</span>}
                      </p>
                      {h.actualResult && (
                        <p className={`text-sm mt-1 font-medium ${h.isCorrect ? "text-green-300" : "text-red-300"}`}>
                          {h.isCorrect ? "✓ Dự đoán chính xác!" : `✗ Kết quả thực: ${h.actualResult}`}
                        </p>
                      )}
                    </div>
                    {h.isCorrect !== undefined && (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${h.isCorrect ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {h.isCorrect ? <CheckCircle2 size={18} /> : <X size={18} />}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Prediction Modal */}
      {selectedRace && (
        <Modal title={`Dự đoán: ${selectedRace.raceName}`} onClose={() => setSelectedRace(null)}>
          {entriesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#D4AF37]" /></div>
          ) : (
            <PredictionForm
              race={selectedRace}
              entries={raceEntries}
              existingPrediction={history.find((h) => h.raceId === selectedRace.raceId)}
              onSuccess={() => { setSelectedRace(null); loadRaces(); }}
            />
          )}
        </Modal>
      )}
    </AdminLayout>
  );
}
