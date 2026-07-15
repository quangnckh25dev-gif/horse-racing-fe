import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Trophy, MapPin, Calendar, RefreshCw,
  Loader2, AlertCircle, Pencil, ChevronRight,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { tournamentService } from "../../services/tournament";

const STATUS_CONFIG = {
  Draft:     { label: "Nháp",         cls: "bg-sb-s2 text-sb-tx-2 border-sb-border",           strip: "from-gray-400/20 to-gray-400/5",    dot: "bg-gray-400" },
  Open:      { label: "Mở đăng ký",   cls: "bg-sb-info/10 text-sb-info border-sb-info/30",           strip: "from-blue-400/20 to-blue-400/5",    dot: "bg-blue-500" },
  Ongoing:   { label: "Đang diễn ra", cls: "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd",        strip: "from-amber-400/20 to-amber-400/5",  dot: "bg-amber-500" },
  Finished:  { label: "Kết thúc",     cls: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd",        strip: "from-green-400/20 to-green-400/5",  dot: "bg-green-500" },
  Cancelled: { label: "Đã hủy",       cls: "bg-sb-lose/10 text-sb-lose border-sb-lose/30",              strip: "from-red-400/20 to-red-400/5",      dot: "bg-red-500" },
};

const STATUS_TRANSITIONS = {
  Draft:    [{ to: "Open",      label: "Mở đăng ký",   cls: "bg-sb-info/10 border-sb-info/30 text-sb-info hover:bg-sb-info/20" }],
  Open:     [{ to: "Ongoing",   label: "Bắt đầu",       cls: "bg-sb-gold-soft border-sb-gold-bd text-sb-gold-2 hover:bg-sb-gold-soft" },
             { to: "Cancelled", label: "Hủy giải",      cls: "bg-sb-lose/10 border-sb-lose/30 text-sb-lose hover:bg-sb-lose/20" }],
  Ongoing:  [{ to: "Finished",  label: "Kết thúc giải", cls: "bg-sb-emerald-soft border-sb-emerald-bd text-sb-emerald-ink hover:bg-sb-emerald-soft" },
             { to: "Cancelled", label: "Hủy giải",      cls: "bg-sb-lose/10 border-sb-lose/30 text-sb-lose hover:bg-sb-lose/20" }],
  Finished:  [],
  Cancelled: [],
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
  const [statusLoading, setStatusLoading] = useState("");

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

  const handleChangeStatus = async (tournamentId, newStatus) => {
    setStatusLoading(tournamentId + "_" + newStatus);
    try {
      await tournamentService.changeStatus(tournamentId, newStatus);
      setTournaments((prev) =>
        prev.map((t) => t.tournamentId === tournamentId ? { ...t, status: newStatus } : t)
      );
    } catch (err) {
      setErrorMsg(err.message || "Thay đổi trạng thái thất bại.");
    } finally {
      setStatusLoading("");
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
              <span className="text-[10px] font-bold text-sb-tx-3 uppercase tracking-widest">Admin</span>
            </div>
            <h1 className="text-2xl font-black text-sb-tx leading-tight">Quản lý giải đấu</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="stat-pill"><span className="text-sb-tx font-bold">{tournaments.length}</span> giải đấu</span>
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
              className="flex items-center gap-2 px-3 py-2 bg-sb-s2 border border-sb-border rounded-xl text-sb-tx-3 hover:text-sb-tx text-sm transition-all">
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
          <div className="mb-5 flex items-center gap-2 p-4 rounded-xl bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm">
            <AlertCircle size={14} className="shrink-0 text-sb-lose" /> {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 bg-sb-s2 animate-pulse rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-sb-gold-soft border border-amber-100 flex items-center justify-center mb-4">
              <Trophy size={32} className="text-amber-300" />
            </div>
            <p className="text-sb-tx font-semibold mb-1">Chưa có giải đấu nào</p>
            <p className="text-sb-tx-3 text-sm mb-4">Tạo giải đấu đầu tiên để bắt đầu mùa giải</p>
            <Button onClick={openCreate} className="bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold btn-gold-glow">
              <Plus size={15} className="mr-2" /> Tạo giải đấu
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tournaments.map((t, idx) => {
              const s = STATUS_CONFIG[t.status] || STATUS_CONFIG.Draft;
              const transitions = STATUS_TRANSITIONS[t.status] || [];
              return (
                <div
                  key={t.tournamentId}
                  className="group relative bg-sb-s1 border border-sb-border rounded-xl overflow-hidden shadow-sm hover:shadow-md flex flex-col animate-fade-in-up transition-shadow"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Top status strip */}
                  <div className={`h-0.5 w-full bg-gradient-to-r ${s.strip}`} />

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${s.cls}`}>
                        {t.status === "Ongoing" && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                        {s.label}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(t)}
                          className="p-1.5 text-sb-tx-3 hover:text-sb-info transition-colors rounded-lg hover:bg-sb-info/10">
                          <Pencil size={13} />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sb-tx font-bold text-base mb-3 leading-tight flex-1">
                      {t.tournamentName}
                    </h3>

                    <div className="space-y-1.5 mb-4">
                      {t.location && (
                        <div className="flex items-center gap-2 text-sb-tx-3 text-xs">
                          <MapPin size={11} className="shrink-0 text-sb-tx-3" />
                          <span className="truncate">{t.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sb-tx-3 text-xs">
                        <Calendar size={11} className="shrink-0 text-sb-tx-3" />
                        <span>{t.startDate?.slice(0, 10)} → {t.endDate?.slice(0, 10)}</span>
                      </div>
                      {t.prizeFund > 0 && (
                        <div className="flex items-center gap-2 text-sb-gold-2 text-xs font-bold">
                          <Trophy size={11} className="shrink-0" />
                          {formatVND(t.prizeFund)}
                        </div>
                      )}
                    </div>

                    {/* Status transition buttons */}
                    {transitions.length > 0 && (
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {transitions.map((tr) => {
                          const busy = statusLoading === t.tournamentId + "_" + tr.to;
                          return (
                            <button
                              key={tr.to}
                              onClick={() => handleChangeStatus(t.tournamentId, tr.to)}
                              disabled={!!statusLoading}
                              className={`flex-1 min-w-0 flex items-center justify-center gap-1 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-50 ${tr.cls}`}
                            >
                              {busy ? <Loader2 size={11} className="animate-spin" /> : null}
                              {tr.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <button onClick={() => navigate(`/admin/tournaments/${t.tournamentId}`)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-sb-border text-sb-tx-3 hover:text-sb-info hover:border-blue-300 hover:bg-sb-info/10 text-xs transition-all mt-auto">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="bg-sb-s1 border border-sb-border rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in">
            <div className="h-0.5 w-full rounded-t-2xl bg-gradient-to-r from-[#D4AF37] to-transparent" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-sb-border">
              <h2 className="text-lg font-bold text-sb-tx">
                {modal === "create" ? "Tạo giải đấu mới" : "Chỉnh sửa giải đấu"}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="p-1.5 rounded-lg text-sb-tx-3 hover:text-sb-tx-2 hover:bg-sb-s2 transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm">
                  <AlertCircle size={14} className="shrink-0" /> {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">
                  Tên giải đấu *
                </Label>
                <Input
                  value={form.tournamentName}
                  onChange={(e) => setForm({ ...form, tournamentName: e.target.value })}
                  placeholder="VD: Giải Đua Mùa Hè 2026"
                  className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">
                  Địa điểm
                </Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="VD: Hồ Chí Minh"
                  className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">
                    Ngày bắt đầu *
                  </Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">
                    Ngày kết thúc *
                  </Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">
                  Tổng giải thưởng (VNĐ)
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={form.prizeFund}
                  onChange={(e) => setForm({ ...form, prizeFund: e.target.value })}
                  placeholder="0"
                  className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">
                  Mô tả
                </Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả về giải đấu..."
                  rows={3}
                  className="w-full rounded-md bg-sb-s1 border border-sb-border text-sb-tx text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] resize-none placeholder:text-sb-tx-3"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 h-10 rounded-lg border border-sb-border text-sb-tx-3 hover:text-sb-tx hover:border-sb-border-2 text-sm transition-colors"
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
