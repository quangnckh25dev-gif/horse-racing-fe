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
      const isMaintenance = err.status === 503 || m.includes("maintenance");
      const isPending = err.status === 403 ||
        m.includes("pending") || m.includes("not active") || m.includes("not approved");
      const isLocked = m.includes("too many") || m.includes("lock");
      const isBadCred = m.includes("bad credentials") ||
        m.includes("incorrect") || m.includes("invalid") || m.includes("not found");

      if (isMaintenance) {
        let until = err.data?.maintenanceUntil || null;
        setMaintenanceUntil(until || "");
      } else if (isLocked) {
        setFailedCount(5);
        setErrorMsg("Username has been locked after too many failed login attempts.");
      } else if (isBadCred) {
        setFailedCount((prev) => {
          const next = Math.min(prev + 1, 5);
          setErrorMsg(`Incorrect username or password. (Attempt ${next}/5)`);
          return next;
        });
      } else if (isPending) {
        setInfoMsg("Your account is waiting for Administrator approval. Please wait.");
      } else {
        setErrorMsg(msg || "Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    "w-full h-12 pl-11 pr-4 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx text-sm " +
    "placeholder:text-sb-tx-3 outline-none focus:border-sb-emerald focus:ring-1 focus:ring-sb-emerald/40 transition-all";

  return (
    <AuthShell title="Login" subtitle="Enter the racetrack - Season 2026">
      {maintenanceUntil !== null && (
        <div className="mb-5 rounded-xl bg-sb-gold-soft border border-sb-gold-bd p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Wrench size={15} className="text-sb-gold-2" />
            <span className="text-sb-gold-2 font-bold text-sm">System is under maintenance</span>
          </div>
          {maintenanceUntil
            ? <p className="text-sb-tx-2 text-xs flex items-center justify-center gap-1"><Clock size={11} /> Expected completion: <strong>{maintenanceUntil}</strong></p>
            : <p className="text-sb-tx-3 text-xs">Please come back later</p>}
          <p className="text-sb-tx-3 text-[11px] mt-2">Only Administrators can log in right now.</p>
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
          <label htmlFor="username" className="block text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-1.5">Username</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sb-tx-3" size={17} />
            <input id="username" type="text" placeholder="e.g. spectator1" className={inputCls}
              value={formData.username} onChange={handleChange} required autoComplete="username" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest">Password</label>
            <Link to="/forgot-password" className="text-xs text-sb-emerald-ink hover:underline">Forgot Password?</Link>
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
          <span className="text-sb-tx-2 text-sm">Keep me signed in</span>
        </label>

        <button type="submit" disabled={isLoading}
          className="w-full h-12 rounded-xl bg-sb-emerald text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</> : "LOGIN"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-sb-border text-center space-y-2">
        <p className="text-sm text-sb-tx-3">
          No account yet?{" "}
          <Link to="/register" className="text-sb-emerald-ink font-semibold hover:underline">Register Now</Link>
        </p>
        <p className="text-sm text-sb-tx-3">
          Or <Link to="/" className="text-sb-emerald-ink font-semibold hover:underline">view the race schedule without logging in</Link>
        </p>
      </div>
    </AuthShell>
  );
}
