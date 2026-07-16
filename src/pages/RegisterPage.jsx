import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User, Lock, Eye, EyeOff, Loader2, AlertCircle,
  Mail, Phone, Type, CheckCircle2, ShieldCheck,
} from "lucide-react";
import { authService } from "../services/auth";
import AuthShell from "../components/auth/AuthShell";

// value = enum BE (GET /api/auth/register-roles) — 1 role Organizer duy nhất
const ROLE_OPTIONS = [
  { value: "HorseOwner", label: "Chủ ngựa" },
  { value: "Jockey",     label: "Nài ngựa (Jockey)" },
  { value: "Referee",    label: "Trọng tài" },
  { value: "Spectator",  label: "Khán giả" },
  { value: "Organizer",  label: "Ban tổ chức" },
];

const EMPTY = { username: "", password: "", fullName: "", email: "", phone: "", role: "" };

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
    if (errorMsg) setErrorMsg("");
    if (successMsg) setSuccessMsg("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.role) { setErrorMsg("Vui lòng chọn vai trò của bạn."); return; }
    setIsLoading(true); setErrorMsg(""); setSuccessMsg("");
    try {
      // BE đọc roleName (không phải role) → gửi đúng field, nếu không sẽ mặc định Spectator
      const { role, ...rest } = form;
      await authService.register({ ...rest, roleName: role });
      setSuccessMsg("Đăng ký thành công! Tài khoản cần Admin duyệt. Đang chuyển tới đăng nhập…");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setErrorMsg(err.message || "Đăng ký thất bại, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    "w-full h-11 pl-11 pr-4 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx text-sm " +
    "placeholder:text-sb-tx-3 outline-none focus:border-sb-emerald focus:ring-1 focus:ring-sb-emerald/40 transition-all";
  const iconCls = "absolute left-3.5 top-1/2 -translate-y-1/2 text-sb-tx-3";
  const labelCls = "block text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-1.5";

  return (
    <AuthShell title="Đăng ký tài khoản" subtitle="Điền thông tin để bắt đầu" wide>
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm">
          <AlertCircle size={16} className="shrink-0" /> <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-sb-emerald-soft border border-sb-emerald-bd text-sb-emerald-ink text-sm">
          <CheckCircle2 size={16} className="shrink-0" /> <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="username" className={labelCls}>Tài khoản</label>
            <div className="relative">
              <User className={iconCls} size={16} />
              <input id="username" placeholder="username" className={inputCls}
                value={form.username} onChange={handleChange} required autoComplete="username" />
            </div>
          </div>
          <div>
            <label htmlFor="password" className={labelCls}>Mật khẩu</label>
            <div className="relative">
              <Lock className={iconCls} size={16} />
              <input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                className={inputCls + " pr-11"} value={form.password} onChange={handleChange} required autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sb-tx-3 hover:text-sb-tx transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="fullName" className={labelCls}>Họ và tên</label>
          <div className="relative">
            <Type className={iconCls} size={16} />
            <input id="fullName" placeholder="Nguyễn Văn A" className={inputCls}
              value={form.fullName} onChange={handleChange} required />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className={labelCls}>Email</label>
            <div className="relative">
              <Mail className={iconCls} size={16} />
              <input id="email" type="email" placeholder="email@gmail.com" className={inputCls}
                value={form.email} onChange={handleChange} required />
            </div>
          </div>
          <div>
            <label htmlFor="phone" className={labelCls}>Số điện thoại</label>
            <div className="relative">
              <Phone className={iconCls} size={16} />
              <input id="phone" type="tel" placeholder="0901234567" className={inputCls}
                value={form.phone} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="role" className={labelCls}>Vai trò <span className="text-sb-lose">*</span></label>
          <div className="relative">
            <ShieldCheck className={iconCls + " z-10"} size={16} />
            <select id="role" value={form.role}
              onChange={(e) => { setForm({ ...form, role: e.target.value }); if (errorMsg) setErrorMsg(""); }}
              required className={inputCls + " appearance-none cursor-pointer"}>
              <option value="" disabled>— Chọn vai trò —</option>
              {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" disabled={isLoading}
          className="w-full h-12 rounded-xl bg-sb-emerald text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Đang xử lý…</> : "ĐĂNG KÝ TÀI KHOẢN"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-sb-border text-center space-y-2">
        <p className="text-sm text-sb-tx-3">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-sb-emerald-ink font-semibold hover:underline">Đăng nhập ngay</Link>
        </p>
        <p className="text-sm text-sb-tx-3">
          Hoặc <Link to="/races" className="text-sb-emerald-ink font-semibold hover:underline">xem lịch đua không cần đăng nhập</Link>
        </p>
      </div>
    </AuthShell>
  );
}
