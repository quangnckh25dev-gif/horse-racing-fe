import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail, Lock, KeyRound, Eye, EyeOff,
  Loader2, AlertCircle, CheckCircle2, ArrowLeft,
} from "lucide-react";
import { authService } from "../services/auth";
import AuthShell from "../components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [resetData, setResetData] = useState({ token: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const clearMessages = () => { setErrorMsg(""); setSuccessMsg(""); };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsLoading(true); clearMessages();
    try {
      await authService.requestPasswordReset({ email });
      setSuccessMsg("Password reset email has been sent. Please check your inbox.");
      setTimeout(() => { setSuccessMsg(""); setStep(2); }, 1800);
    } catch (err) {
      setErrorMsg(err.message || "No account found with this email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault(); clearMessages();
    if (resetData.newPassword.length < 6) { setErrorMsg("New password must be at least 6 characters."); return; }
    if (resetData.newPassword !== resetData.confirmPassword) { setErrorMsg("Password confirmation does not match."); return; }
    setIsLoading(true);
    try {
      await authService.resetPassword({ token: resetData.token, newPassword: resetData.newPassword });
      setSuccessMsg("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setErrorMsg(err.message || "Token is invalid or expired.");
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
    <AuthShell
      title={step === 1 ? "Forgot Password" : "Reset Password"}
      subtitle={step === 1 ? "Enter your email to receive a verification code" : `Code sent to ${email} · valid for 15 minutes`}
    >
      {/* Bước */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 transition-all ${step >= 1 ? "bg-sb-emerald border-sb-emerald text-white" : "border-sb-border text-sb-tx-3"}`}>1</div>
        <div className={`h-0.5 w-12 ${step >= 2 ? "bg-sb-emerald" : "bg-sb-border"}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 transition-all ${step >= 2 ? "bg-sb-emerald border-sb-emerald text-white" : "border-sb-border text-sb-tx-3"}`}>2</div>
      </div>

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm">
          <AlertCircle size={16} className="shrink-0" /><span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-sb-emerald-soft border border-sb-emerald-bd text-sb-emerald-ink text-sm">
          <CheckCircle2 size={16} className="shrink-0" /><span>{successMsg}</span>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleRequestReset} className="space-y-5">
          <div>
            <label htmlFor="email" className={labelCls}>Registered Email</label>
            <div className="relative">
              <Mail className={iconCls} size={16} />
              <input id="email" type="email" placeholder="email@gmail.com" className={inputCls}
                value={email} onChange={(e) => { setEmail(e.target.value); clearMessages(); }} required />
            </div>
          </div>
          <button type="submit" disabled={isLoading}
            className="w-full h-12 rounded-xl bg-sb-emerald text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Sending...</> : "SEND VERIFICATION CODE"}
          </button>
          <button type="button" onClick={() => setStep(2)}
            className="w-full text-center text-xs text-sb-tx-3 hover:text-sb-emerald-ink transition-colors">
            Already have a code? Enter it now &gt;
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="token" className={labelCls}>Verification Code</label>
            <div className="relative">
              <KeyRound className={iconCls} size={16} />
              <input id="token" placeholder="Enter the code from email..." className={inputCls + " tracking-widest"}
                value={resetData.token} onChange={(e) => { setResetData({ ...resetData, token: e.target.value }); clearMessages(); }} required />
            </div>
          </div>
          <div>
            <label htmlFor="newPassword" className={labelCls}>New Password</label>
            <div className="relative">
              <Lock className={iconCls} size={16} />
              <input id="newPassword" type={showPassword ? "text" : "password"} placeholder="At least 6 characters"
                className={inputCls + " pr-11"} value={resetData.newPassword}
                onChange={(e) => { setResetData({ ...resetData, newPassword: e.target.value }); clearMessages(); }} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sb-tx-3 hover:text-sb-tx transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className={labelCls}>Confirm Password</label>
            <div className="relative">
              <Lock className={iconCls} size={16} />
              <input id="confirmPassword" type="password" placeholder="Re-enter new password" className={inputCls}
                value={resetData.confirmPassword}
                onChange={(e) => { setResetData({ ...resetData, confirmPassword: e.target.value }); clearMessages(); }} required />
            </div>
          </div>
          <button type="submit" disabled={isLoading}
            className="w-full h-12 rounded-xl bg-sb-emerald text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</> : "RESET PASSWORD"}
          </button>
          <button type="button" onClick={() => { setStep(1); clearMessages(); }}
            className="w-full flex items-center justify-center gap-1 text-xs text-sb-tx-3 hover:text-sb-emerald-ink transition-colors">
            <ArrowLeft size={13} /> Back to Email
          </button>
        </form>
      )}

      <div className="mt-6 pt-5 border-t border-sb-border text-center">
        <p className="text-sm text-sb-tx-3">
          Remember your password?{" "}
          <Link to="/login" className="text-sb-emerald-ink font-semibold hover:underline">Login now</Link>
        </p>
      </div>
    </AuthShell>
  );
}
