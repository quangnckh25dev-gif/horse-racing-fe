import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Trophy, MapPin, Calendar, RefreshCw,
  Loader2, AlertCircle, Pencil, Trash2, ChevronRight,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { tournamentService } from "../../services/tournament";

const STATUS_CONFIG = {
  Draft:     { label: "Nháp",         cls: "bg-gray-800/60 text-gray-300 border-gray-700/50",           strip: "from-gray-500/30 to-gray-500/5",  dot: "bg-gray-400" },
  Open:      { label: "Mở đăng ký",   cls: "bg-blue-500/20 text-blue-300 border-blue-500/40 badge-glow-blue",   strip: "from-blue-500/30 to-blue-500/5",  dot: "bg-blue-400" },
  Ongoing:   { label: "Đang diễn ra", cls: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 badge-glow-yellow", strip: "from-[#D4AF37]/30 to-[#D4AF37]/5", dot: "bg-[#D4AF37]" },
  Finished:  { label: "Kết thúc",     cls: "bg-green-500/20 text-green-300 border-green-500/40 badge-glow-green",  strip: "from-green-500/30 to-green-500/5", dot: "bg-green-400" },
  Cancelled: { label: "Đã hủy",       cls: "bg-red-500/20 text-red-300 border-red-500/40",                         strip: "from-red-500/20 to-red-500/5",     dot: "bg-red-400" },
};

const EMPTY_FORM = {
  tournamentName: "", description: "", location: "",
  startDate: "", endDate: "", prizeFund: "",
};

const formatVND = (n) =>
  n ? new Intl.NumberFormat("vi-VN").format(n) + " ₫" : null;

export default function TournamentManagementPage() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [modal, setModal] = useState(null); // null | "create" | { mode:"edit", id }
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchAll = async () => {
    setIsLoading(true); setErrorMsg("");
    try {
      const res = await tournamentService.getAll();
      setTournaments(res.data || []);
    } catch (err) {
      setErrorMsg(err.message || "Không thể tải danh sách giải đấu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM); setFormError(""); setModal("create");
  };

  const openEdit = (t) => {
    setForm({
      tournamentName: t.tournamentName || "",
      description:    t.description   || "",
      location:       t.location      || "",
      startDate:      t.startDate?.slice(0, 10) || "",
      endDate:        t.endDate?.slice(0, 10)   || "",
      prizeFund:      t.prizeFund || "",
    });
    setFormError("");
    setModal({ mode: "edit", id: t.tournamentId });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.tournamentName || !form.startDate || !form.endDate) {
      setFormError("Vui lòng điền tên giải đấu, ngày bắt đầu và ngày kết thúc.");
      return;
    }
    setIsSaving(true); setFormError("");
    try {
      const payload = { ...form, prizeFund: Number(form.prizeFund) || 0 };
      if (modal === "create") {
        const res = await tournamentService.create(payload);
        setTournaments((prev) => [res.data, ...prev]);
      } else {
        const res = await tournamentService.update(modal.id, payload);
        setTournaments((prev) =>
          prev.map((t) => t.tournamentId === modal.id ? res.data : t)
        );
      }
      setModal(null);
    } catch (err) {
      setFormError(err.message || "Lưu thất bại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa giải đấu này?")) return;
    try {
      await tournamentService.delete(id);
      setTournaments((prev) => prev.filter((t) => t.tournamentId !== id));
    } catch (err) {
      setErrorMsg(err.message || "Xóa thất bại.");
    }
  };

  return (
    <AdminLayout title="Quản lý giải đấu">

      {/* ── Page Header Banner ── */}
      <div className="page-header">
        <div className="absolute right-0 top-0 w-72 h-full bg-gradient-to-l from-[#D4AF37]/[0.04] to-transparent pointer-events-none" />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-6xl opacity-[0.08] select-none pointer-events-none animate-float">🏆</div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                <Trophy size={14} className="text-[#D4AF37]" />
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Admin</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Quản lý giải đấu</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="stat-pill"><span className="text-white font-bold">{tournaments.length}</span> giải đấu</span>
              {tournaments.filter(t => t.status === "Ongoing").length > 0 && (
                <span className="stat-pill text-yellow-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot inline-block" />
                  {tournaments.filter(t => t.status === "Ongoing").length} đang diễn ra
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={fetchAll} disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-gray-700/60 rounded-xl text-gray-400 hover:text-white text-sm transition-all">
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            </button>
            <Button onClick={openCreate}
              className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold text-sm h-10 px-4 rounded-xl btn-gold-glow transition-all">
              <Plus size={15} /> Tạo giải đấu
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {errorMsg && (
          <div className="mb-5 flex items-center gap-2 p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-300 text-sm">
            <AlertCircle size={14} className="shrink-0 text-red-400" /> {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 shimmer rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/10 flex items-center justify-center mb-4 animate-float">
              <Trophy size={32} className="text-[#D4AF37]/30" />
            </div>
            <p className="text-white font-semibold mb-1">Chưa có giải đấu nào</p>
            <p className="text-gray-500 text-sm mb-4">Tạo giải đấu đầu tiên để bắt đầu mùa giải</p>
            <Button onClick={openCreate} className="bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold btn-gold-glow">
              <Plus size={15} className="mr-2" /> Tạo giải đấu
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tournaments.map((t, idx) => {
              const s = STATUS_CONFIG[t.status] || STATUS_CONFIG.Draft;
              return (
                <div
                  key={t.tournamentId}
                  className="group relative bg-[#0d1117] border border-gray-800/60 rounded-xl overflow-hidden card-hover flex flex-col animate-fade-in-up"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Top status strip */}
                  <div className={`h-0.5 w-full bg-gradient-to-r ${s.strip}`} />

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${s.cls}`}>
                        {t.status === "Ongoing" && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot" />}
                        {s.label}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(t)}
                          className="p-1.5 text-gray-600 hover:text-[#D4AF37] transition-colors rounded-lg hover:bg-[#D4AF37]/5">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(t.tournamentId)}
                          className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/5">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-white font-bold text-base mb-3 leading-tight flex-1">
                      {t.tournamentName}
                    </h3>

                    <div className="space-y-2 mb-4">
                      {t.location && (
                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                          <MapPin size={11} className="shrink-0 text-gray-600" />
                          <span className="truncate">{t.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <Calendar size={11} className="shrink-0 text-gray-600" />
                        <span>{t.startDate?.slice(0, 10)} → {t.endDate?.slice(0, 10)}</span>
                      </div>
                      {t.prizeFund > 0 && (
                        <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-bold neon-gold">
                          <Trophy size={11} className="shrink-0" />
                          {formatVND(t.prizeFund)}
                        </div>
                      )}
                    </div>

                    <button onClick={() => navigate(`/admin/tournaments/${t.tournamentId}`)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-700/60 text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 text-xs transition-all mt-auto group-hover:border-[#D4AF37]/20">
                      Quản lý chi tiết <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal Create / Edit ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div className="bg-[#0d1117] border border-gray-800/60 rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in">
            <div className="h-0.5 w-full rounded-t-2xl bg-gradient-to-r from-[#D4AF37] to-transparent" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
              <h2 className="text-lg font-bold text-white">
                {modal === "create" ? "Tạo giải đấu mới" : "Chỉnh sửa giải đấu"}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/50 border border-red-900 text-red-200 text-sm">
                  <AlertCircle size={14} className="shrink-0" /> {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
                  Tên giải đấu *
                </Label>
                <Input
                  value={form.tournamentName}
                  onChange={(e) => setForm({ ...form, tournamentName: e.target.value })}
                  placeholder="VD: Giải Đua Mùa Hè 2026"
                  className="h-10 bg-[#0A0E1A]/80 border-gray-700 text-white focus-visible:ring-[#D4AF37]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
                  Địa điểm
                </Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="VD: Hồ Chí Minh"
                  className="h-10 bg-[#0A0E1A]/80 border-gray-700 text-white focus-visible:ring-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
                    Ngày bắt đầu *
                  </Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="h-10 bg-[#0A0E1A]/80 border-gray-700 text-white focus-visible:ring-[#D4AF37]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
                    Ngày kết thúc *
                  </Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="h-10 bg-[#0A0E1A]/80 border-gray-700 text-white focus-visible:ring-[#D4AF37]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
                  Tổng giải thưởng (VNĐ)
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={form.prizeFund}
                  onChange={(e) => setForm({ ...form, prizeFund: e.target.value })}
                  placeholder="0"
                  className="h-10 bg-[#0A0E1A]/80 border-gray-700 text-white focus-visible:ring-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
                  Mô tả
                </Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả về giải đấu..."
                  rows={3}
                  className="w-full rounded-md bg-[#0A0E1A]/80 border border-gray-700 text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 h-10 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Hủy
                </button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-10 bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold text-sm"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : modal === "create" ? (
                    "Tạo giải đấu"
                  ) : (
                    "Lưu thay đổi"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
