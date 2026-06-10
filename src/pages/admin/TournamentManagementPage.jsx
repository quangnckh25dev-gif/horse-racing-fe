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
  Draft:     { label: "Nháp",         cls: "bg-gray-800/60 text-gray-300 border-gray-700/50" },
  Open:      { label: "Mở đăng ký",   cls: "bg-blue-900/30 text-blue-300 border-blue-800/50" },
  Ongoing:   { label: "Đang diễn ra", cls: "bg-green-900/30 text-green-300 border-green-800/50" },
  Finished:  { label: "Kết thúc",     cls: "bg-yellow-900/30 text-yellow-300 border-yellow-800/50" },
  Cancelled: { label: "Đã hủy",       cls: "bg-red-900/30 text-red-300 border-red-800/50" },
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
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400 text-sm">
            Tổng cộng{" "}
            <span className="text-[#D4AF37] font-semibold">{tournaments.length}</span>{" "}
            giải đấu
          </p>
          <div className="flex gap-3">
            <button
              onClick={fetchAll}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all text-sm"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Làm mới
            </button>
            <Button
              onClick={openCreate}
              className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-semibold text-sm h-9 px-4"
            >
              <Plus size={16} /> Tạo giải đấu
            </Button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-950/50 border border-red-900 text-red-200 text-sm">
            <AlertCircle size={15} className="shrink-0 text-red-400" /> {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <Trophy size={48} className="mb-4" />
            <p className="text-lg font-medium">Chưa có giải đấu nào</p>
            <p className="text-sm mt-1">Nhấn "Tạo giải đấu" để bắt đầu</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tournaments.map((t) => {
              const s = STATUS_CONFIG[t.status] || STATUS_CONFIG.Draft;
              return (
                <div
                  key={t.tournamentId}
                  className="bg-[#111827]/80 border border-gray-800/60 rounded-xl p-5 hover:border-[#D4AF37]/30 transition-all flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>
                      {s.label}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 text-gray-500 hover:text-[#D4AF37] transition-colors rounded"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.tournamentId)}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-white font-semibold mb-3 leading-tight flex-1">
                    {t.tournamentName}
                  </h3>

                  <div className="space-y-1.5 mb-4">
                    {t.location && (
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{t.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <Calendar size={12} className="shrink-0" />
                      <span>
                        {t.startDate?.slice(0, 10)} → {t.endDate?.slice(0, 10)}
                      </span>
                    </div>
                    {t.prizeFund > 0 && (
                      <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-semibold">
                        <Trophy size={12} className="shrink-0" />
                        {formatVND(t.prizeFund)}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/admin/tournaments/${t.tournamentId}`)}
                    className="w-full flex items-center justify-center gap-1 py-2 rounded-lg border border-gray-700/60 text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 text-xs transition-all mt-auto"
                  >
                    Quản lý chi tiết <ChevronRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal Create / Edit ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-gray-800/60 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800/60">
              <h2 className="text-lg font-bold text-white">
                {modal === "create" ? "Tạo giải đấu mới" : "Chỉnh sửa giải đấu"}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="text-gray-500 hover:text-white transition-colors text-2xl leading-none"
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
