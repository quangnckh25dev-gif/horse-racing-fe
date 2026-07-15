import { useState, useEffect, useCallback } from "react";
import {
  Mail, AlertCircle, RefreshCw,
  Clock, CheckCircle2, XCircle, Send, Plus,
  Loader2, X, Users, ChevronDown,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { invitationService } from "../../services/invitation";
import { entryService } from "../../services/entry";

const STATUS_CONFIG = {
  Pending:  {
    label: "Chờ phản hồi",
    color: "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd",
    borderCls: "border-l-4 border-l-yellow-400",
    icon: Clock,
    iconCls: "text-sb-gold-2",
    bg: "bg-sb-gold-soft",
    border: "border-sb-gold-bd",
  },
  Accepted: {
    label: "Đã chấp nhận",
    color: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd",
    borderCls: "border-l-4 border-l-green-400",
    icon: CheckCircle2,
    iconCls: "text-sb-emerald-ink",
    bg: "bg-sb-emerald-soft",
    border: "border-sb-emerald-bd",
  },
  Declined: {
    label: "Đã từ chối",
    color: "bg-sb-lose/10 text-sb-lose border-sb-lose/30",
    borderCls: "border-l-4 border-l-red-400",
    icon: XCircle,
    iconCls: "text-sb-lose",
    bg: "bg-sb-lose/10",
    border: "border-sb-lose/30",
  },
};

const selectCls = "w-full h-10 rounded-xl bg-sb-s1 border border-sb-border text-sb-tx text-sm px-3 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-sb-emerald";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-sb-s1 border border-sb-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sb-border sticky top-0 bg-sb-s1">
          <h3 className="text-sb-tx font-semibold">{title}</h3>
          <button onClick={onClose} className="text-sb-tx-3 hover:text-sb-tx-2 p-1 rounded-lg hover:bg-sb-s2 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function OwnerInvitationsPage() {
  const [invitations, setInvitations]       = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");
  const [showModal, setShowModal]           = useState(false);
  const [entries, setEntries]               = useState([]);
  const [jockeys, setJockeys]               = useState([]);
  const [modalLoading, setModalLoading]     = useState(false);
  const [selectedEntry, setSelectedEntry]   = useState("");
  const [selectedJockey, setSelectedJockey] = useState("");
  const [message, setMessage]               = useState("");
  const [sending, setSending]               = useState(false);
  const [modalError, setModalError]         = useState("");
  const [modalSuccess, setModalSuccess]     = useState("");

  const fetchInvitations = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await invitationService.getSentInvitations();
      setInvitations(res.data || []);
    } catch (e) {
      setError(e.message || "Không thể tải lời mời");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvitations(); }, [fetchInvitations]);

  const openModal = async () => {
    setShowModal(true);
    setModalError(""); setModalSuccess("");
    setSelectedEntry(""); setSelectedJockey(""); setMessage("");
    setModalLoading(true);
    try {
      const [entryRes, jockeyRes] = await Promise.all([
        entryService.getMyApprovedEntries(),
        entryService.getJockeys(),
      ]);
      setEntries(entryRes.data || []);
      setJockeys(jockeyRes.data || []);
    } catch (e) {
      setModalError(e.message || "Không thể tải dữ liệu");
    } finally {
      setModalLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedEntry)  { setModalError("Vui lòng chọn entry (đăng ký thi đấu)"); return; }
    if (!selectedJockey) { setModalError("Vui lòng chọn Jockey"); return; }
    setSending(true); setModalError(""); setModalSuccess("");
    try {
      await invitationService.sendInvitation(Number(selectedEntry), {
        jockeyId: Number(selectedJockey),
        message: message.trim() || undefined,
      });
      setModalSuccess("Gửi lời mời thành công!");
      setSelectedEntry(""); setSelectedJockey(""); setMessage("");
      fetchInvitations();
    } catch (e) {
      setModalError(e.message || "Gửi lời mời thất bại");
    } finally {
      setSending(false);
    }
  };

  const counts = {
    Pending:  invitations.filter((i) => (i.status || "Pending") === "Pending").length,
    Accepted: invitations.filter((i) => i.status === "Accepted").length,
    Declined: invitations.filter((i) => i.status === "Declined").length,
  };

  return (
    <AdminLayout title="Lời mời Jockey">

      {/* ── Page Header ── */}
      <div className="relative p-6 pb-5 border-b border-sb-border bg-sb-s1 overflow-hidden">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-6xl opacity-[0.05] select-none pointer-events-none">📨</div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center">
                <Send size={14} className="text-pink-400" />
              </div>
              <span className="text-[10px] font-bold text-sb-tx-3 uppercase tracking-widest">Chủ ngựa</span>
            </div>
            <h1 className="text-2xl font-black text-sb-tx leading-tight">Lời mời Jockey</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-sb-s2 border border-sb-border text-sb-tx-2 text-xs font-semibold">
                <span className="font-bold text-sb-tx mr-1">{invitations.length}</span> đã gửi
              </span>
              {counts.Pending > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sb-gold-soft border border-sb-gold-bd text-sb-gold-2 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /> {counts.Pending} chờ phản hồi
                </span>
              )}
              {counts.Accepted > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-sb-emerald-soft border border-sb-emerald-bd text-sb-emerald-ink text-xs font-semibold">
                  {counts.Accepted} đã chấp nhận
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={fetchInvitations}
              className="flex items-center gap-2 px-3 py-2 bg-sb-s1 border border-sb-border rounded-xl text-sb-tx-3 hover:text-sb-info hover:border-blue-300 hover:bg-sb-info/10 text-sm transition-all">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Làm mới
            </button>
            <button onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold text-sm rounded-xl transition-colors">
              <Plus size={14} /> Gửi lời mời
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* ── Mini stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
            const Icon = cfg.icon;
            const count = counts[status] || 0;
            return (
              <div key={status} className="flex items-center gap-3 p-4 rounded-xl border border-sb-border bg-sb-s1 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}>
                  <Icon size={16} className={cfg.iconCls} />
                </div>
                <div>
                  <p className={`text-2xl font-black leading-none ${cfg.iconCls}`}>{count}</p>
                  <p className="text-sb-tx-3 text-xs mt-0.5">{cfg.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-sb-lose/10 border border-sb-lose/30 rounded-xl text-sb-lose text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* ── List ── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-sb-s2 animate-pulse rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
        ) : invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-pink-500/10 border border-pink-100 flex items-center justify-center mb-4">
              <Mail size={32} className="text-pink-300" />
            </div>
            <p className="text-sb-tx-2 font-semibold mb-1">Chưa có lời mời nào</p>
            <p className="text-sb-tx-3 text-sm mb-4">Nhấn "Gửi lời mời" để mời Jockey tham gia cùng ngựa của bạn</p>
            <button onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold text-sm rounded-xl transition-colors">
              <Plus size={14} /> Gửi lời mời đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((inv, idx) => {
              const status = inv.status || "Pending";
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
              const Icon = cfg.icon;
              const initials = (inv.jockeyName || inv.jockeyId || "?")[0]?.toUpperCase() || "?";

              return (
                <div
                  key={inv.invitationId || inv.id}
                  className={`group relative bg-sb-s1 border border-sb-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${cfg.borderCls} animate-fade-in-up`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Jockey avatar */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border}`}>
                      <span className={`text-lg font-black ${cfg.iconCls}`}>{initials}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                        <p className="text-sb-tx font-bold">
                          Jockey: <span className="text-sb-gold-2">{inv.jockeyName || `#${inv.jockeyId}`}</span>
                        </p>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${cfg.color}`}>
                          {status === "Pending" && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />}
                          <Icon size={10} /> {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {inv.horseName && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sb-s2 border border-sb-border text-sb-tx-2 text-xs">🐴 {inv.horseName}</span>
                        )}
                        {inv.raceName && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sb-s2 border border-sb-border text-sb-tx-2 text-xs">🏁 {inv.raceName}</span>
                        )}
                        {inv.createdAt && (
                          <span className="text-sb-tx-3 text-xs">
                            {new Date(inv.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        )}
                      </div>
                      {inv.note && (
                        <p className="text-sb-tx-3 text-xs mt-2 italic px-3 py-1.5 bg-sb-s2 rounded-lg border border-sb-border">
                          "{inv.note}"
                        </p>
                      )}
                    </div>

                    {/* Status icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border}`}>
                      <Icon size={18} className={cfg.iconCls} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Send Invitation Modal ── */}
      {showModal && (
        <Modal title="Gửi lời mời Jockey" onClose={() => setShowModal(false)}>
          {modalLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-sb-info" size={28} />
            </div>
          ) : (
            <div className="space-y-4">
              {modalError && (
                <div className="flex items-center gap-2 p-3 bg-sb-lose/10 border border-sb-lose/30 rounded-xl text-sb-lose text-sm">
                  <AlertCircle size={13} className="shrink-0" /> {modalError}
                </div>
              )}
              {modalSuccess && (
                <div className="flex items-center gap-2 p-3 bg-sb-emerald-soft border border-sb-emerald-bd rounded-xl text-sb-emerald-ink text-sm">
                  <CheckCircle2 size={13} className="shrink-0" /> {modalSuccess}
                </div>
              )}

              {/* Entry select */}
              <div>
                <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-widest mb-2">
                  Đăng ký thi đấu (đã được BTC duyệt)
                </label>
                <div className="relative">
                  <select value={selectedEntry} onChange={(e) => setSelectedEntry(e.target.value)} className={selectCls}>
                    <option value="">-- Chọn entry --</option>
                    {entries.map((en) => (
                      <option key={en.entryId} value={en.entryId}>
                        {en.horseName || `Ngựa #${en.horseId}`} — {en.raceName || `Race #${en.raceId}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-sb-tx-3 pointer-events-none" />
                </div>
                {entries.length === 0 && (
                  <p className="text-sb-tx-3 text-xs mt-1">Chưa có đăng ký nào được BTC duyệt. Hãy đăng ký và chờ ban tổ chức xét duyệt.</p>
                )}
              </div>

              {/* Jockey select */}
              <div>
                <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-widest mb-2">
                  <span className="flex items-center gap-1.5"><Users size={12} /> Chọn Jockey</span>
                </label>
                <div className="relative">
                  <select value={selectedJockey} onChange={(e) => setSelectedJockey(e.target.value)} className={selectCls}>
                    <option value="">-- Chọn Jockey --</option>
                    {jockeys.map((j) => (
                      <option key={j.userId || j.jockeyId} value={j.userId || j.jockeyId}>
                        {j.fullName || j.username} {j.experienceYear ? `(${j.experienceYear} năm KN)` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-sb-tx-3 pointer-events-none" />
                </div>
                {jockeys.length === 0 && (
                  <p className="text-sb-tx-3 text-xs mt-1">Không tìm thấy Jockey nào trong hệ thống.</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sb-tx-3 text-xs font-semibold uppercase tracking-widest mb-2">
                  Tin nhắn (tuỳ chọn)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập lời nhắn cho Jockey..."
                  className="w-full rounded-xl bg-sb-s1 border border-sb-border text-sb-tx text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-sb-emerald placeholder:text-sb-tx-3 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-10 rounded-xl bg-sb-s1 border border-sb-border text-sb-tx-3 hover:text-sb-tx hover:border-sb-border-2 text-sm font-semibold transition-colors"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || !selectedEntry || !selectedJockey}
                  className="flex-1 h-10 rounded-xl bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Gửi lời mời
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </AdminLayout>
  );
}
