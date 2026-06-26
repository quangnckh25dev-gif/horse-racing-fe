import { useState, useEffect, useMemo } from "react";
import {
  Mail, Lock, KeyRound, Eye, EyeOff,
  Loader2, AlertCircle, CheckCircle2, ArrowLeft,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { authService } from "../services/auth";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [resetData, setResetData] = useState({ token: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const particles = useMemo(() => {
    return [...Array(35)].map((_, i) => ({
      id: i,
      size: Math.random() * 3 + 1.5,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 12,
      opacity: Math.random() * 0.35 + 0.15,
    }));
  }, []);

  useEffect(() => setIsMounted(true), []);

  const clearMessages = () => { setErrorMsg(""); setSuccessMsg(""); };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsLoading(true); clearMessages();
    try {
      await authService.requestPasswordReset({ email });
      setSuccessMsg("Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư.");
      setTimeout(() => { setSuccessMsg(""); setStep(2); }, 1800);
    } catch (err) {
      setErrorMsg(err.message || "Không tìm thấy tài khoản với email này.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault(); clearMessages();
    if (resetData.newPassword.length < 6) { setErrorMsg("Mật khẩu mới phải có ít nhất 6 ký tự."); return; }
    if (resetData.newPassword !== resetData.confirmPassword) { setErrorMsg("Xác nhận mật khẩu không khớp."); return; }
    setIsLoading(true);
    try {
      await authService.resetPassword({ token: resetData.token, newPassword: resetData.newPassword });
      setSuccessMsg("Đặt lại mật khẩu thành công! Đang chuyển về đăng nhập...");
      setTimeout(() => { window.location.href = "/login"; }, 2000);
    } catch (err) {
      setErrorMsg(err.message || "Token không hợp lệ hoặc đã hết hạn.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = "pl-11 h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#D4AF37] focus-visible:border-[#D4AF37] transition-all duration-300";

  return (
    <div className="flex min-h-screen w-full font-sans text-white overflow-hidden relative bg-mesh">
      <style>{`
        @keyframes golden-fall {
          0%   { transform: translateY(-10vh) scale(0.5); opacity: 0; }
          10%  { opacity: var(--max-opacity); transform: translateY(0) scale(1); }
          90%  { opacity: var(--max-opacity); }
          100% { transform: translateY(110vh) scale(0.5); opacity: 0; }
        }
        .golden-particle { animation: golden-fall linear infinite; }
      `}</style>

      {/* Gold dust particles */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="golden-particle absolute rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              "--max-opacity": p.opacity,
            }}
          />
        ))}
      </div>

      {/* ── Left column — horse image ── */}
      <div
        className="hidden lg:flex w-1/2 flex-col justify-end p-16 bg-cover bg-center bg-no-repeat relative z-10"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(253,252,247,0.2), rgba(250,246,230,0.94)), url('/bg-horse.png')`,
        }}
      >
        <div className={`relative z-20 max-w-xl transition-all duration-1000 transform ${isMounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 flex items-center justify-center">
              <span className="text-sm">🏆</span>
            </div>
            <span className="text-[#9A7B0A] text-xs font-bold uppercase tracking-widest">HorseRacing Pro</span>
          </div>
          <h1 className="font-display text-5xl font-black text-gray-900 mb-4 leading-tight tracking-tight">
            Khôi phục
            <br />
            <span className="text-gold-gradient">Tài khoản</span>
          </h1>
          <p className="text-gray-600 text-base leading-relaxed">
            {step === 1
              ? "Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác nhận về hộp thư của bạn."
              : "Nhập mã xác nhận từ email và đặt mật khẩu mới cho tài khoản."}
          </p>
        </div>
      </div>

      {/* ── Right column — form ── */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 relative z-10 shadow-[-20px_0_50px_rgba(10,14,26,0.8)]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

        <div
          className={`w-full max-w-md rounded-2xl p-8 border relative z-10 transition-all duration-700 delay-150 transform ${isMounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
          style={{
            background: "#FFFFFF",
            borderColor: "rgba(212,175,55,0.22)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.08), 0 0 32px rgba(212,175,55,0.07), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 transition-all ${step >= 1 ? "bg-[#D4AF37] border-[#D4AF37] text-[#0A0E1A]" : "border-gray-300 text-gray-400"}`}>1</div>
            <div className={`h-0.5 w-12 transition-all ${step >= 2 ? "bg-[#D4AF37]" : "bg-gray-200"}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 transition-all ${step >= 2 ? "bg-[#D4AF37] border-[#D4AF37] text-[#0A0E1A]" : "border-gray-300 text-gray-400"}`}>2</div>
          </div>

          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 mb-4 flex items-center justify-center">
              <KeyRound size={20} className="text-[#D4AF37]" />
            </div>
            <h2 className="font-display text-2xl font-black text-gray-900 tracking-tight">
              {step === 1 ? "Quên mật khẩu" : "Đặt lại mật khẩu"}
            </h2>
            <p className="text-gray-500 text-sm mt-1.5 text-center">
              {step === 1
                ? "Nhập email đã đăng ký để nhận mã xác nhận"
                : `Mã đã gửi đến ${email} — có hiệu lực 15 phút`}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 flex items-center gap-3 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              <AlertCircle size={16} className="text-red-500 shrink-0" /><span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-center gap-3 p-3.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              <CheckCircle2 size={16} className="text-green-500 shrink-0" /><span>{successMsg}</span>
            </div>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div className="space-y-1.5 group">
                <Label htmlFor="email" className="text-gray-500 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37] transition-colors">
                  Email đã đăng ký
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" size={16} />
                  <Input id="email" type="email" placeholder="email@example.com" className={inputCls}
                    value={email} onChange={(e) => { setEmail(e.target.value); clearMessages(); }} required />
                </div>
              </div>
              <Button type="submit" disabled={isLoading}
                className="w-full h-12 text-[#0A0E1A] font-bold text-base btn-gold btn-gold-glow transition-all"
                style={{ background: "linear-gradient(135deg, #D4AF37 0%, #c9a227 50%, #B8860B 100%)" }}>
                {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang gửi...</> : "GỬI MÃ XÁC NHẬN"}
              </Button>
              <button type="button" onClick={() => setStep(2)}
                className="w-full text-center text-xs text-gray-400 hover:text-[#D4AF37] transition-colors pt-1">
                Đã có mã xác nhận? Nhập ngay →
              </button>
            </form>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5 group">
                <Label htmlFor="token" className="text-gray-500 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37] transition-colors">
                  Mã xác nhận
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" size={16} />
                  <Input id="token" type="text" placeholder="Nhập mã từ email..."
                    className={`${inputCls} tracking-widest`}
                    value={resetData.token}
                    onChange={(e) => { setResetData({ ...resetData, token: e.target.value }); clearMessages(); }}
                    required />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <Label htmlFor="newPassword" className="text-gray-500 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37] transition-colors">
                  Mật khẩu mới
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" size={16} />
                  <Input id="newPassword" type={showPassword ? "text" : "password"} placeholder="Tối thiểu 6 ký tự"
                    className={`${inputCls} pr-11`}
                    value={resetData.newPassword}
                    onChange={(e) => { setResetData({ ...resetData, newPassword: e.target.value }); clearMessages(); }}
                    required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 group">
                <Label htmlFor="confirmPassword" className="text-gray-500 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37] transition-colors">
                  Xác nhận mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" size={16} />
                  <Input id="confirmPassword" type="password" placeholder="Nhập lại mật khẩu mới"
                    className={inputCls}
                    value={resetData.confirmPassword}
                    onChange={(e) => { setResetData({ ...resetData, confirmPassword: e.target.value }); clearMessages(); }}
                    required />
                </div>
              </div>

              <Button type="submit" disabled={isLoading}
                className="w-full h-12 text-[#0A0E1A] font-bold text-base btn-gold btn-gold-glow transition-all"
                style={{ background: "linear-gradient(135deg, #D4AF37 0%, #c9a227 50%, #B8860B 100%)" }}>
                {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang xử lý...</> : "ĐẶT LẠI MẬT KHẨU"}
              </Button>

              <button type="button" onClick={() => { setStep(1); clearMessages(); }}
                className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-[#D4AF37] transition-colors pt-1">
                <ArrowLeft size={13} /> Quay lại nhập email
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Nhớ mật khẩu rồi?{" "}
              <a href="/login" className="text-[#D4AF37] hover:text-[#9A7B0A] font-semibold hover:underline underline-offset-2 transition-all">
                Đăng nhập ngay
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
