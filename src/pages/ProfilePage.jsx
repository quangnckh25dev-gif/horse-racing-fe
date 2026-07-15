import { useState, useEffect } from "react";
import { User, Save, Loader2, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import AdminLayout from "../components/layout/AdminLayout";
import { profileService } from "../services/profile";
import { useAuth } from "../context/AuthContext";

const ROLE_FIELDS = {
  HorseOwner: [
    { key: "address",       label: "Địa chỉ",               type: "text",   placeholder: "Nhập địa chỉ..." },
    { key: "organization",  label: "Tổ chức / Chuồng ngựa", type: "text",   placeholder: "Tên tổ chức hoặc chuồng ngựa..." },
    { key: "licenseNumber", label: "Số giấy phép",           type: "text",   placeholder: "VD: OWN-001" },
  ],
  Jockey: [
    { key: "weightKg",      label: "Cân nặng (kg)",     type: "number", placeholder: "VD: 58.5", step: "0.1" },
    { key: "heightCm",      label: "Chiều cao (cm)",     type: "number", placeholder: "VD: 168",  step: "0.1" },
    { key: "experienceYear",label: "Số năm kinh nghiệm",type: "number", placeholder: "VD: 4",    step: "1" },
  ],
  Referee: [
    { key: "badgeNumber",   label: "Số huy hiệu",  type: "text", placeholder: "VD: REF-001" },
    { key: "speciality",    label: "Chuyên môn",   type: "text", placeholder: "VD: Race Control, Timing..." },
  ],
};

const ROLE_LABEL = {
  Admin:      "Quản trị viên",
  Organizer:  "Ban tổ chức",
  HorseOwner: "Chủ ngựa",
  Jockey:     "Nài ngựa",
  Referee:    "Trọng tài",
  Spectator:  "Khán giả",
};

const ROLE_BADGE_CLS = {
  Admin:      "bg-sb-lose/10 text-sb-lose border-sb-lose/30",
  Organizer:  "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd",
  HorseOwner: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  Jockey:     "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Referee:    "bg-sb-info/10 text-sb-info border-sb-info/30",
  Spectator:  "bg-sb-s2 text-sb-tx-2 border-sb-border",
};

const ROLE_AVATAR_GRADIENT = {
  Admin:      "from-red-400 to-rose-500",
  Organizer:  "from-amber-400 to-amber-500",
  HorseOwner: "from-orange-400 to-amber-500",
  Jockey:     "from-purple-400 to-violet-500",
  Referee:    "from-yellow-400 to-amber-400",
  Spectator:  "from-gray-400 to-gray-500",
};

export default function ProfilePage() {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState({});
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fields = ROLE_FIELDS[role] || [];
  const hasProfile = fields.length > 0;

  const loadProfile = async () => {
    if (!hasProfile || !user?.userId) { setLoading(false); return; }
    setLoading(true);
    try {
      let res;
      if (role === "HorseOwner")  res = await profileService.getOwnerProfile(user.userId);
      else if (role === "Jockey") res = await profileService.getJockeyProfile(user.userId);
      else if (role === "Referee")res = await profileService.getRefereeProfile(user.userId);
      if (res?.data && Object.keys(res.data).length > 0) {
        setProfile(res.data);
        setProfileExists(true);
      } else {
        setProfile({});
        setProfileExists(false);
      }
    } catch {
      setProfile({});
      setProfileExists(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, [user, role]); // eslint-disable-line

  const handleChange = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess(false);
    try {
      if (role === "HorseOwner")  await profileService.updateOwnerProfile(user.userId, profile);
      else if (role === "Jockey") await profileService.updateJockeyProfile(user.userId, profile);
      else if (role === "Referee")await profileService.updateRefereeProfile(user.userId, profile);
      setProfileExists(true);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Lưu hồ sơ thất bại");
    } finally {
      setSaving(false);
    }
  };

  const gradientCls = ROLE_AVATAR_GRADIENT[role] || "from-gray-400 to-gray-500";

  return (
    <AdminLayout title="Hồ sơ cá nhân">
      <div className="p-6 max-w-2xl mx-auto">

        {/* ── User info card ── */}
        <div className="mb-6 flex items-center gap-4 p-5 bg-sb-s1 border border-sb-border rounded-2xl shadow-sm">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradientCls} flex items-center justify-center text-2xl font-black text-white shadow-md`}>
            {(user?.fullName || user?.username || "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sb-tx font-bold text-lg truncate">{user?.fullName || user?.username}</p>
            <p className="text-sb-tx-3 text-sm truncate">{user?.email}</p>
            <span className={`inline-block mt-1.5 text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${ROLE_BADGE_CLS[role] || "bg-sb-s2 text-sb-tx-2 border-sb-border"}`}>
              {ROLE_LABEL[role] || role}
            </span>
          </div>
          {hasProfile && (
            <button onClick={loadProfile} disabled={loading}
              className="p-2 rounded-xl text-sb-tx-3 hover:text-sb-info hover:bg-sb-info/10 border border-transparent hover:border-blue-100 transition-all">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          )}
        </div>

        {!hasProfile ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-sb-s2 border border-sb-border flex items-center justify-center mb-4">
              <User size={28} className="text-sb-tx-3" />
            </div>
            <p className="text-sb-tx-2 font-semibold text-base mb-2">Role này chưa có hồ sơ mở rộng</p>
            <p className="text-sb-tx-3 text-sm">Chỉ Chủ ngựa, Nài ngựa và Trọng tài mới có hồ sơ riêng.</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-sb-info" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Fields card */}
            <div className="bg-sb-s1 border border-sb-border rounded-2xl p-5 shadow-sm">
              <h3 className="text-sb-tx font-bold text-sm mb-4 pb-3 border-b border-sb-border flex items-center gap-2">
                <User size={14} className="text-sb-info" />
                Thông tin hồ sơ
              </h3>
              <div className="space-y-4">
                {fields.map((f) => (
                  <div key={f.key}>
                    <label className="block text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      value={profile[f.key] ?? ""}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      step={f.step}
                      className="w-full bg-sb-s1 border border-sb-border rounded-xl px-4 py-2.5 text-sb-tx text-sm focus:outline-none focus:border-sb-emerald focus:ring-1 focus:ring-sb-emerald/40 transition-all placeholder:text-sb-tx-3 hover:border-sb-border-2"
                    />
                  </div>
                ))}
              </div>
            </div>

            {!profileExists && (
              <div className="flex items-start gap-2 p-3 bg-sb-info/10 border border-sb-info/30 rounded-xl text-sb-info text-sm">
                <AlertCircle size={14} className="shrink-0 text-blue-500 mt-0.5" />
                <span>Hồ sơ chưa có dữ liệu — điền thông tin và nhấn <strong>Lưu hồ sơ</strong> để cập nhật.</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-sb-lose/10 border border-sb-lose/30 rounded-xl text-sb-lose text-sm">
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-sb-emerald-soft border border-sb-emerald-bd rounded-xl text-sb-emerald-ink text-sm">
                <CheckCircle2 size={14} className="shrink-0" /> Hồ sơ đã được lưu thành công!
              </div>
            )}

            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold rounded-xl btn-gold-glow transition-all text-sm disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Lưu hồ sơ
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
