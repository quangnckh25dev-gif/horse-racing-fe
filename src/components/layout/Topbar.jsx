import { useState, useEffect, useCallback } from "react";
import { Bell, User, ChevronDown, LogOut, KeyRound, Info, CheckCircle2, Trophy, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { notificationService } from "../../services/notification";
import MinutesViewer from "../sb/MinutesViewer";

const ROLE_LABEL = {
  Admin:      "Quản trị viên",
  Organizer:  "Ban tổ chức",
  HorseOwner: "Chủ ngựa",
  Jockey:     "Nài ngựa",
  Referee:    "Trọng tài",
  Spectator:  "Khán giả",
};

const NOTIF_TYPE_CONFIG = {
  SystemAlert:   { icon: Info,         cls: "text-sb-info bg-sb-info/10" },
  RaceResult:    { icon: Trophy,       cls: "text-sb-gold-2 bg-sb-gold-soft" },
  Invitation:    { icon: Mail,         cls: "text-sb-emerald-ink bg-sb-emerald-soft" },
  EntryApproved: { icon: CheckCircle2, cls: "text-sb-win bg-sb-win/10" },
  default:       { icon: Bell,         cls: "text-sb-tx-3 bg-sb-s2" },
};

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1)  return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return d.toLocaleDateString("vi-VN");
}

function normalizeNotif(n) {
  const cfg = NOTIF_TYPE_CONFIG[n.notifType] || NOTIF_TYPE_CONFIG.default;
  const isRaceDoc = n.relatedEntity === "Race" ||
    /Minutes|Result|Published/i.test(n.notifType || "") ||
    /biên bản|kết quả/i.test(n.title || "");
  return {
    id: n.notificationId,
    text: n.title || n.body || "Thông báo mới",
    type: n.notifType,
    relatedEntity: n.relatedEntity,
    time: formatRelativeTime(n.createdAt),
    unread: !n.isRead,
    icon: cfg.icon,
    iconCls: cfg.cls,
    // raceId để mở biên bản/kết quả khi bấm vào
    raceId: isRaceDoc ? (n.relatedEntityId ?? n.relatedEntityID ?? null) : null,
  };
}

const HAS_PROFILE = ["HorseOwner", "Jockey", "Referee", "Organizer"];

export default function Topbar({ title }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoaded, setNotifLoaded] = useState(false);
  const [readIds, setReadIds] = useState(new Set());
  const [viewMinutes, setViewMinutes] = useState(null); // { raceId } khi bấm thông báo biên bản

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getMyNotifications();
      setNotifications((res.data || []).map(normalizeNotif));
    } catch {
      setNotifications([]);
    } finally {
      setNotifLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (bellOpen && !notifLoaded) fetchNotifications();
  }, [bellOpen, notifLoaded, fetchNotifications]);

  const unreadCount = notifications.filter((n) => n.unread && !readIds.has(n.id)).length;

  const markAllRead = async () => {
    try { await notificationService.markAllAsRead(); } catch { /* vẫn đánh dấu ở FE */ }
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const markOneRead = async (n) => {
    try { await notificationService.markAsRead(n.id); } catch { /* vẫn đánh dấu ở FE */ }
    setReadIds((prev) => new Set([...prev, n.id]));
    if (role === "Referee" && n.type === "RefereeAssigned" && n.raceId) {
      setBellOpen(false);
      navigate(`/referee/races/${n.raceId}`);
      return;
    }
    // Thông báo về biên bản/kết quả → mở luôn để xem
    if (n.raceId) { setViewMinutes({ raceId: n.raceId, raceName: n.text }); setBellOpen(false); }
  };

  const closeBoth = () => { setDropdownOpen(false); setBellOpen(false); };

  return (
    <header className="relative z-30 h-16 flex items-center justify-between px-6 shrink-0 bg-sb-s1 border-b border-sb-border">
      <h1 className="text-base font-bold text-sb-tx truncate">{title}</h1>

      <div className="flex items-center gap-3">

        {/* ── Chuông thông báo ── */}
        <div className="relative">
          <button
            onClick={() => { setBellOpen((p) => !p); setDropdownOpen(false); }}
            className="relative p-2 rounded-xl text-sb-tx-3 border border-transparent hover:text-sb-tx hover:bg-sb-s2 hover:border-sb-border transition-colors"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-sb-emerald flex items-center justify-center">
                <span className="text-[8px] font-black text-white leading-none">{unreadCount}</span>
              </span>
            )}
          </button>

          {bellOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-2xl bg-sb-s1 border border-sb-border shadow-2xl shadow-black/40 overflow-hidden animate-scale-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-sb-border">
                  <div className="flex items-center gap-2">
                    <Bell size={13} className="text-sb-emerald-ink" />
                    <span className="text-sb-tx text-sm font-bold">Thông báo</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-sb-emerald-soft text-sb-emerald-ink border border-sb-emerald-bd">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] text-sb-tx-3 hover:text-sb-tx transition-colors">
                        Đọc tất cả
                      </button>
                    )}
                    <button onClick={() => { setNotifLoaded(false); fetchNotifications(); }}
                      className="text-[10px] text-sb-tx-3 hover:text-sb-tx transition-colors">↻</button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Bell size={22} className="text-sb-tx-3 mb-2 opacity-50" />
                      <p className="text-sb-tx-3 text-xs">Không có thông báo</p>
                    </div>
                  ) : (
                    <div className="p-1.5 space-y-0.5">
                      {notifications.map((n) => {
                        const isRead = readIds.has(n.id) || !n.unread;
                        const Icon = n.icon;
                        return (
                          <button key={n.id} onClick={() => markOneRead(n)}
                            className={`flex items-start gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors border ${
                              isRead
                                ? "border-transparent hover:bg-sb-s2"
                                : "bg-sb-s2 border-sb-border hover:bg-sb-s3"
                            }`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${n.iconCls}`}>
                              <Icon size={12} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs leading-snug ${isRead ? "text-sb-tx-3" : "text-sb-tx font-medium"}`}>{n.text}</p>
                              <p className="text-sb-tx-3 text-[10px] mt-0.5">{n.time}</p>
                            </div>
                            {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-sb-emerald shrink-0 mt-1.5" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Menu người dùng ── */}
        <div className="relative">
          <button
            onClick={() => { setDropdownOpen((p) => !p); setBellOpen(false); }}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-sb-s2 border border-sb-border hover:border-sb-border-2 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-sb-emerald-soft border border-sb-emerald-bd flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-sb-emerald-ink">
                {(user?.fullName || user?.username || "U")[0].toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-sb-tx leading-tight">{user?.fullName || user?.username}</p>
              <p className="text-[10px] leading-tight text-sb-tx-3">{ROLE_LABEL[role] || role}</p>
            </div>
            <ChevronDown size={13} className={`text-sb-tx-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-2xl bg-sb-s1 border border-sb-border shadow-2xl shadow-black/40 overflow-hidden animate-scale-in">
                <div className="px-4 py-3 border-b border-sb-border">
                  <p className="text-sb-tx text-sm font-semibold truncate">{user?.fullName || user?.username}</p>
                  <p className="text-sb-tx-3 text-xs truncate">{user?.email || user?.username}</p>
                  <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-sb-s2 border border-sb-border text-sb-tx-2 font-medium">
                    {ROLE_LABEL[role] || role}
                  </span>
                </div>

                <div className="p-1.5 space-y-0.5">
                  {HAS_PROFILE.includes(role) && (
                    <button onClick={() => { closeBoth(); navigate("/profile"); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-sb-tx-2 hover:text-sb-tx hover:bg-sb-s2 transition-colors">
                      <User size={14} /> Hồ sơ cá nhân
                    </button>
                  )}
                  <button onClick={() => { closeBoth(); navigate("/change-password"); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-sb-tx-2 hover:text-sb-tx hover:bg-sb-s2 transition-colors">
                    <KeyRound size={14} /> Đổi mật khẩu
                  </button>
                  <button onClick={() => { closeBoth(); logout(); navigate("/"); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-sb-tx-3 hover:text-sb-lose hover:bg-sb-lose/10 transition-colors">
                    <LogOut size={14} /> Đăng xuất
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {viewMinutes && (
        <MinutesViewer
          raceId={viewMinutes.raceId}
          raceName={viewMinutes.raceName}
          onClose={() => setViewMinutes(null)}
        />
      )}
    </header>
  );
}
