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
  Admin:           "Quản trị viên",
  OrganizerHead:   "Trưởng ban tổ chức",
  OrganizerMember: "Thành viên BTC",
  HorseOwner:      "Chủ ngựa",
  Jockey:          "Nài ngựa",
  Referee:         "Trọng tài",
  Spectator:       "Khán giả",
};

const ROLE_BADGE_CLS = {
  Admin:           "bg-red-50 text-red-600 border-red-200",
  OrganizerHead:   "bg-amber-50 text-amber-700 border-amber-200",
  OrganizerMember: "bg-blue-50 text-blue-600 border-blue-200",
  HorseOwner:      "bg-orange-50 text-orange-600 border-orange-200",
  Jockey:          "bg-purple-50 text-purple-600 border-purple-200",
  Referee:         "bg-yellow-50 text-yellow-700 border-yellow-200",
  Spectator:       "bg-gray-50 text-gray-600 border-gray-200",
};

const ROLE_AVATAR_GRADIENT = {
  Admin:           "from-red-400 to-rose-500",
  OrganizerHead:   "from-amber-400 to-amber-500",
  OrganizerMember: "from-blue-400 to-sky-500",
  HorseOwner:      "from-orange-400 to-amber-500",
  Jockey:          "from-purple-400 to-violet-500",
  Referee:         "from-yellow-400 to-amber-400",
  Spectator:       "from-gray-400 to-gray-500",
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
        <div className="mb-6 flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradientCls} flex items-center justify-center text-2xl font-black text-white shadow-md`}>
            {(user?.fullName || user?.username || "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 font-bold text-lg truncate">{user?.fullName || user?.username}</p>
            <p className="text-gray-500 text-sm truncate">{user?.email}</p>
            <span className={`inline-block mt-1.5 text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${ROLE_BADGE_CLS[role] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
              {ROLE_LABEL[role] || role}
            </span>
          </div>
          {hasProfile && (
            <button onClick={loadProfile} disabled={loading}
              className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          )}
        </div>

        {!hasProfile ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4">
              <User size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-700 font-semibold text-base mb-2">Role này chưa có hồ sơ mở rộng</p>
            <p className="text-gray-500 text-sm">Chỉ Chủ ngựa, Nài ngựa và Trọng tài mới có hồ sơ riêng.</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Fields card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-gray-800 font-bold text-sm mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                <User size={14} className="text-blue-600" />
                Thông tin hồ sơ
              </h3>
              <div className="space-y-4">
                {fields.map((f) => (
                  <div key={f.key}>
                    <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      value={profile[f.key] ?? ""}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      step={f.step}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all placeholder:text-gray-400 hover:border-gray-300"
                    />
                  </div>
                ))}
              </div>
            </div>

            {!profileExists && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
                <AlertCircle size={14} className="shrink-0 text-blue-500 mt-0.5" />
                <span>Hồ sơ chưa có dữ liệu — điền thông tin và nhấn <strong>Lưu hồ sơ</strong> để cập nhật.</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
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
