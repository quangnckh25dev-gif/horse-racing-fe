import { useState, useEffect, useCallback } from "react";
import {
  Mail, AlertCircle, RefreshCw,
  Clock, CheckCircle2, XCircle, Send,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { invitationService } from "../../services/invitation";

const STATUS_CONFIG = {
  Pending:  { label: "Chờ phản hồi", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 badge-glow-yellow", borderCls: "border-l-gold-glow",   icon: Clock,        iconCls: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  Accepted: { label: "Đã chấp nhận", color: "bg-green-500/20 text-green-300 border-green-500/40 badge-glow-green",     borderCls: "border-l-green-glow",  icon: CheckCircle2, iconCls: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20" },
  Declined: { label: "Đã từ chối",   color: "bg-red-500/20 text-red-300 border-red-500/40",                            borderCls: "border-l-red-glow",    icon: XCircle,      iconCls: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20" },
};

export default function OwnerInvitationsPage() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const counts = {
    Pending:  invitations.filter((i) => (i.status || "Pending") === "Pending").length,
    Accepted: invitations.filter((i) => i.status === "Accepted").length,
    Declined: invitations.filter((i) => i.status === "Declined").length,
  };

  return (
    <AdminLayout title="Lời mời Jockey">

      {/* ── Page Header Banner ── */}
      <div className="page-header">
        <div className="absolute right-0 top-0 w-72 h-full bg-gradient-to-l from-pink-500/[0.04] to-transparent pointer-events-none" />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-6xl opacity-[0.08] select-none pointer-events-none animate-float">📨</div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                <Send size={14} className="text-pink-400" />
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Chủ ngựa</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Lời mời Jockey</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="stat-pill"><span className="text-white font-bold">{invitations.length}</span> đã gửi</span>
              {counts.Pending > 0 && (
                <span className="stat-pill text-yellow-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot inline-block" /> {counts.Pending} chờ phản hồi
                </span>
              )}
              {counts.Accepted > 0 && <span className="stat-pill text-green-400">{counts.Accepted} đã chấp nhận</span>}
            </div>
          </div>
          <button onClick={fetchInvitations}
            className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-gray-700/60 rounded-xl text-gray-400 hover:text-white text-sm transition-all shrink-0">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* ── Mini stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
            const Icon = cfg.icon;
            const count = counts[status] || 0;
            return (
              <div key={status} className={`flex items-center gap-3 p-4 rounded-xl border card-hover ${cfg.bg} ${cfg.border}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}>
                  <Icon size={16} className={cfg.iconCls} />
                </div>
                <div>
                  <p className={`text-2xl font-black leading-none ${cfg.iconCls}`}>{count}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{cfg.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-300 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* ── List ── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-24 shimmer rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />)}
          </div>
        ) : invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-pink-500/5 border border-pink-500/10 flex items-center justify-center mb-4 animate-float">
              <Mail size={32} className="text-pink-500/30" />
            </div>
            <p className="text-white font-semibold mb-1">Chưa có lời mời nào</p>
            <p className="text-gray-500 text-sm">Gửi lời mời Jockey từ trang đăng ký thi đấu</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((inv, idx) => {
              const status = inv.status || "Pending";
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
              const Icon = cfg.icon;
              const initials = (inv.jockeyName || inv.jockeyId || "?")[0].toUpperCase();

              return (
                <div
                  key={inv.invitationId || inv.id}
                  className={`group relative bg-[#0d1117] border border-gray-800/60 rounded-xl overflow-hidden card-hover ${cfg.borderCls} animate-fade-in-up`}
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
                        <p className="text-white font-bold">
                          Jockey: <span className="text-[#D4AF37]">{inv.jockeyName || `#${inv.jockeyId}`}</span>
                        </p>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${cfg.color}`}>
                          {status === "Pending" && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot" />}
                          <Icon size={10} /> {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {inv.horseName && <span className="stat-pill">🐴 {inv.horseName}</span>}
                        {inv.raceName && <span className="stat-pill">🏁 {inv.raceName}</span>}
                        {inv.createdAt && (
                          <span className="text-gray-600 text-xs">
                            {new Date(inv.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        )}
                      </div>
                      {inv.note && (
                        <p className="text-gray-500 text-xs mt-2 italic px-3 py-1.5 bg-white/[0.02] rounded-lg border border-gray-800/40">
                          "{inv.note}"
                        </p>
                      )}
                    </div>

                    {/* Status indicator */}
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
    </AdminLayout>
  );
}
