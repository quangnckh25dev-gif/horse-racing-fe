import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle, Wrench, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/auth";
import AuthShell from "../components/auth/AuthShell";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [, setFailedCount] = useState(0);
  const [maintenanceUntil, setMaintenanceUntil] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (errorMsg) setErrorMsg("");
    if (e.target.id === "username") setFailedCount(0);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true); setErrorMsg(""); setInfoMsg("");
    try {
      const result = await authService.login(formData);
      const { accessToken, user } = result.data;
      setFailedCount(0); setMaintenanceUntil(null);
      login(user, accessToken, rememberMe);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.message || "";
      const m = msg.toLowerCase();
      const isMaintenance = err.status === 503 || m.includes("bảo trì") || m.includes("maintenance");
      const isPending = err.status === 403 || m.includes("chờ") || m.includes("duyệt") ||
        m.includes("pending") || m.includes("not active") || m.includes("not approved");
      const isLocked = m.includes("quá nhiều") || m.includes("too many") || m.includes("lock");
      const isBadCred = m.includes("sai mật khẩu") || m.includes("bad credentials") ||
        m.includes("incorrect") || m.includes("invalid") || m.includes("không đúng") ||
        m.includes("không chính xác") || m.includes("không tìm thấy") || m.includes("not found");

      if (isMaintenance) {
        let until = err.data?.maintenanceUntil || null;
        setMaintenanceUntil(until || "");
      } else if (isLocked) {
        setFailedCount(5);
        setErrorMsg("Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần.");
      } else if (isBadCred) {
        setFailedCount((prev) => {
          const next = Math.min(prev + 1, 5);
          setErrorMsg(`Sai tài khoản hoặc mật khẩu. (Lần ${next}/5)`);
          return next;
        });
      } else if (isPending) {
        setInfoMsg("Tài khoản của bạn đang chờ Admin phê duyệt. Vui lòng chờ.");
      } else {
        setErrorMsg(msg || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    "w-full h-12 pl-11 pr-4 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx text-sm " +
    "placeholder:text-sb-tx-3 outline-none focus:border-sb-emerald focus:ring-1 focus:ring-sb-emerald/40 transition-all";

  return (
    <AuthShell title="Đăng nhập" subtitle="Vào sân đua · Mùa giải 2026">
      {maintenanceUntil !== null && (
        <div className="mb-5 rounded-xl bg-sb-gold-soft border border-sb-gold-bd p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Wrench size={15} className="text-sb-gold-2" />
            <span className="text-sb-gold-2 font-bold text-sm">Hệ thống đang bảo trì</span>
          </div>
          {maintenanceUntil
            ? <p className="text-sb-tx-2 text-xs flex items-center justify-center gap-1"><Clock size={11} /> Dự kiến xong: <strong>{maintenanceUntil}</strong></p>
            : <p className="text-sb-tx-3 text-xs">Vui lòng quay lại sau</p>}
          <p className="text-sb-tx-3 text-[11px] mt-2">Chỉ Quản trị viên đăng nhập được lúc này.</p>
        </div>
      )}

      {infoMsg && (
        <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-sb-gold-soft border border-sb-gold-bd text-sb-gold-2 text-sm">
          <Clock size={15} className="shrink-0 mt-0.5" /> <span>{infoMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="mb-5 flex items-center gap-2.5 p-3.5 rounded-xl bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm">
          <AlertCircle size={16} className="shrink-0" /> <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-1.5">Tài khoản</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sb-tx-3" size={17} />
            <input id="username" type="text" placeholder="vd: spectator1" className={inputCls}
              value={formData.username} onChange={handleChange} required autoComplete="username" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest">Mật khẩu</label>
            <Link to="/forgot-password" className="text-xs text-sb-emerald-ink hover:underline">Quên mật khẩu?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sb-tx-3" size={17} />
            <input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
              className={inputCls + " pr-11"} value={formData.password} onChange={handleChange} required autoComplete="current-password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sb-tx-3 hover:text-sb-tx transition-colors">
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-sb-border bg-sb-s2 accent-sb-emerald cursor-pointer" />
          <span className="text-sb-tx-2 text-sm">Duy trì đăng nhập</span>
        </label>

        <button type="submit" disabled={isLoading}
          className="w-full h-12 rounded-xl bg-sb-emerald text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Đang xử lý…</> : "ĐĂNG NHẬP"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-sb-border text-center space-y-2">
        <p className="text-sm text-sb-tx-3">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-sb-emerald-ink font-semibold hover:underline">Đăng ký ngay</Link>
        </p>
        <p className="text-sm text-sb-tx-3">
          Hoặc <Link to="/races" className="text-sb-emerald-ink font-semibold hover:underline">xem lịch đua không cần đăng nhập</Link>
        </p>
      </div>
    </AuthShell>
  );
}
