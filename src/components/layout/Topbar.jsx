import { useState, useEffect, useCallback } from "react";
import { Bell, User, ChevronDown, LogOut, KeyRound, X, Info, CheckCircle2, Trophy, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { notificationService } from "../../services/notification";

const ROLE_LABEL = {
  Admin:           "Quản trị viên",
  OrganizerHead:   "Trưởng ban tổ chức",
  OrganizerMember: "Thành viên BTC",
  HorseOwner:      "Chủ ngựa",
  Jockey:          "Nài ngựa",
  Referee:         "Trọng tài",
  Spectator:       "Khán giả",
};

const ROLE_COLOR = {
  Admin:           "from-red-400 to-rose-500",
  OrganizerHead:   "from-[#D4AF37] to-amber-400",
  OrganizerMember: "from-blue-400 to-sky-500",
  HorseOwner:      "from-orange-400 to-amber-500",
  Jockey:          "from-purple-400 to-violet-500",
  Referee:         "from-yellow-400 to-amber-400",
  Spectator:       "from-gray-400 to-gray-500",
};

const ROLE_DOT = {
  Admin:           "bg-red-400",
  OrganizerHead:   "bg-[#D4AF37]",
  OrganizerMember: "bg-blue-400",
  HorseOwner:      "bg-orange-400",
  Jockey:          "bg-purple-400",
  Referee:         "bg-yellow-400",
  Spectator:       "bg-gray-400",
};

const NOTIF_TYPE_CONFIG = {
  SystemAlert:    { icon: Info,         iconCls: "text-blue-400 bg-blue-500/10" },
  RaceResult:     { icon: Trophy,       iconCls: "text-[#D4AF37] bg-[#D4AF37]/10" },
  Invitation:     { icon: Mail,         iconCls: "text-purple-400 bg-purple-500/10" },
  EntryApproved:  { icon: CheckCircle2, iconCls: "text-green-400 bg-green-500/10" },
  default:        { icon: Bell,         iconCls: "text-gray-400 bg-gray-500/10" },
};

const DEMO_NOTIFICATIONS = {
  Admin:           [
    { id: 1, icon: User,        iconCls: "text-yellow-400 bg-yellow-500/10", text: "3 tài khoản mới chờ duyệt",           time: "5 phút trước", unread: true },
    { id: 2, icon: Info,        iconCls: "text-blue-400 bg-blue-500/10",     text: "Giải đấu Mùa Hè 2026 đã được tạo",   time: "1 giờ trước",  unread: true },
    { id: 3, icon: CheckCircle2,iconCls: "text-green-400 bg-green-500/10",   text: "Hệ thống hoạt động bình thường",      time: "Hôm nay",      unread: false },
  ],
  OrganizerHead:   [
    { id: 1, icon: Trophy,      iconCls: "text-[#D4AF37] bg-[#D4AF37]/10",  text: "Kết quả vòng đua chờ bạn duyệt",     time: "10 phút trước", unread: true },
    { id: 2, icon: Info,        iconCls: "text-blue-400 bg-blue-500/10",     text: "Vòng đua Sprint 500m đã kết thúc",   time: "2 giờ trước",  unread: false },
  ],
  OrganizerMember: [
    { id: 1, icon: User,        iconCls: "text-purple-400 bg-purple-500/10", text: "Cần phân công trọng tài cho 2 vòng đua", time: "30 phút trước", unread: true },
  ],
  HorseOwner:      [
    { id: 1, icon: Mail,        iconCls: "text-pink-400 bg-pink-500/10",     text: "Jockey đã chấp nhận lời mời của bạn", time: "15 phút trước", unread: true },
    { id: 2, icon: Trophy,      iconCls: "text-[#D4AF37] bg-[#D4AF37]/10",  text: "Đăng ký vòng đua Mùa Thu đã được duyệt", time: "3 giờ trước", unread: false },
  ],
  Jockey:          [
    { id: 1, icon: Mail,        iconCls: "text-purple-400 bg-purple-500/10", text: "Bạn nhận được 1 lời mời thi đấu mới", time: "1 giờ trước",  unread: true },
  ],
  Referee:         [
    { id: 1, icon: Trophy,      iconCls: "text-yellow-400 bg-yellow-500/10", text: "Bạn được phân công vào vòng đua mới", time: "2 giờ trước",  unread: true },
  ],
  Spectator:       [
    { id: 1, icon: Trophy,      iconCls: "text-green-400 bg-green-500/10",   text: "Kết quả vòng đua Chủ nhật đã công bố", time: "1 giờ trước",  unread: true },
    { id: 2, icon: Info,        iconCls: "text-blue-400 bg-blue-500/10",     text: "Vòng đua Thứ Bảy bắt đầu trong 2 giờ", time: "30 phút trước", unread: true },
  ],
};

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return d.toLocaleDateString("vi-VN");
}

function normalizeNotif(n) {
  const cfg = NOTIF_TYPE_CONFIG[n.notifType] || NOTIF_TYPE_CONFIG.default;
  return {
    id: n.notificationId,
    text: n.title || n.body || "Thông báo mới",
    time: formatRelativeTime(n.createdAt),
    unread: !n.isRead,
    icon: cfg.icon,
    iconCls: cfg.iconCls,
  };
}

const HAS_PROFILE = ["HorseOwner", "Jockey", "Referee"];

export default function Topbar({ title }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen]         = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoaded, setNotifLoaded]   = useState(false);
  const [readIds, setReadIds]           = useState(new Set());

  const gradientCls = ROLE_COLOR[role] || "from-gray-400 to-gray-500";
  const dotCls      = ROLE_DOT[role]   || "bg-gray-400";

  const fetchNotifications = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const res = await notificationService.getUserNotifications(user.userId);
      const items = (res.data || []).map(normalizeNotif);
      setNotifications(items);
    } catch {
      setNotifications(DEMO_NOTIFICATIONS[role] || []);
    } finally {
      setNotifLoaded(true);
    }
  }, [user, role]);

  useEffect(() => {
    if (bellOpen && !notifLoaded) fetchNotifications();
  }, [bellOpen, notifLoaded, fetchNotifications]);

  const unreadCount = notifications.filter((n) => n.unread && !readIds.has(n.id)).length;

  const markAllRead = async () => {
    if (user?.userId) {
      try { await notificationService.markAllAsRead(user.userId); } catch {}
    }
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const markOneRead = async (notifId) => {
    try { await notificationService.markAsRead(notifId); } catch {}
    setReadIds((prev) => new Set([...prev, notifId]));
  };

  const closeBoth = () => { setDropdownOpen(false); setBellOpen(false); };

  return (
    <header className="relative z-30 h-16 flex items-center justify-between px-6 shrink-0 bg-[#070B14]/90 backdrop-blur-md">
      {/* Gradient bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-[#D4AF37]/30 via-[#D4AF37]/10 to-transparent" />

      {/* Left: title */}
      <div className="flex items-center gap-3">
        <div className="gold-underline">
          <h1 className="text-base font-semibold text-white">{title}</h1>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">

        {/* ── Notification Bell ── */}
        <div className="relative">
          <button
            onClick={() => { setBellOpen((p) => !p); setDropdownOpen(false); }}
            className="relative p-2 rounded-xl text-gray-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 border border-transparent hover:border-[#D4AF37]/20 transition-all duration-200"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full bg-[#D4AF37] border border-[#070B14] flex items-center justify-center">
                <span className="text-[8px] font-black text-[#0A0E1A] leading-none px-0.5">{unreadCount}</span>
              </span>
            )}
          </button>

          {bellOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-[#0d1321] border border-white/[0.09] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-scale-in">
                <div className="h-0.5 w-full bg-gradient-to-r from-[#D4AF37] to-transparent" />
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Bell size={13} className="text-[#D4AF37]" />
                    <span className="text-white text-sm font-bold">Thông báo</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25">{unreadCount} mới</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] text-gray-500 hover:text-[#D4AF37] transition-colors">Đọc tất cả</button>
                    )}
                    <button onClick={() => { setNotifLoaded(false); fetchNotifications(); }}
                      className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">↻</button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Bell size={22} className="text-gray-700 mb-2" />
                      <p className="text-gray-500 text-xs">Không có thông báo mới</p>
                    </div>
                  ) : (
                    <div className="p-1.5 space-y-0.5">
                      {notifications.map((n) => {
                        const isRead = readIds.has(n.id) || !n.unread;
                        const Icon = n.icon;
                        return (
                          <button key={n.id}
                            onClick={() => markOneRead(n.id)}
                            className={`flex items-start gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                              isRead ? "hover:bg-white/[0.03]" : "bg-[#D4AF37]/[0.05] hover:bg-[#D4AF37]/[0.08] border border-[#D4AF37]/10"
                            }`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${n.iconCls}`}>
                              <Icon size={12} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs leading-snug ${isRead ? "text-gray-400" : "text-white font-medium"}`}>{n.text}</p>
                              <p className="text-gray-600 text-[10px] mt-0.5">{n.time}</p>
                            </div>
                            {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0 mt-1.5" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="px-4 py-2.5 border-t border-white/[0.06]">
                  <p className="text-gray-600 text-[10px] text-center">Dữ liệu từ server · Làm mới để cập nhật</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── User profile dropdown ── */}
        <div className="relative">
          <button
            onClick={() => { setDropdownOpen((p) => !p); setBellOpen(false); }}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
          >
            {/* Avatar */}
            <div className="relative">
              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradientCls} flex items-center justify-center shadow-md`}>
                <span className="text-xs font-bold text-white">
                  {(user?.fullName || user?.username || "U")[0].toUpperCase()}
                </span>
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#070B14] ${dotCls}`} />
            </div>

            {/* Name + role */}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-white leading-tight">
                {user?.fullName || user?.username}
              </p>
              <p className="text-[10px] leading-tight text-gray-500">
                {ROLE_LABEL[role] || role}
              </p>
            </div>

            <ChevronDown size={13} className={`text-gray-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-[#0d1321] border border-white/[0.09] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-scale-in">
                <div className="h-0.5 w-full bg-gradient-to-r from-[#D4AF37] to-transparent" />
                {/* User info */}
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-white text-sm font-semibold truncate">{user?.fullName || user?.username}</p>
                  <p className="text-gray-500 text-xs truncate">{user?.email || user?.username}</p>
                  <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                    role === "OrganizerHead" ? "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30" : "bg-white/5 text-gray-400 border-white/10"
                  }`}>
                    {ROLE_LABEL[role] || role}
                  </span>
                </div>

                {/* Actions */}
                <div className="p-1.5 space-y-0.5">
                  {HAS_PROFILE.includes(role) && (
                    <button
                      onClick={() => { closeBoth(); navigate("/profile"); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all duration-150"
                    >
                      <User size={14} /> Hồ sơ cá nhân
                    </button>
                  )}
                  <button
                    onClick={() => { closeBoth(); navigate("/change-password"); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all duration-150"
                  >
                    <KeyRound size={14} /> Đổi mật khẩu
                  </button>
                  <button
                    onClick={() => { closeBoth(); logout(); navigate("/login"); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/[0.07] transition-all duration-150"
                  >
                    <LogOut size={14} /> Đăng xuất
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
