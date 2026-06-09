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
  const [step, setStep] = useState(1); // 1 = nhập email, 2 = nhập token + pass mới
  const [email, setEmail] = useState("");
  const [resetData, setResetData] = useState({ token: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const particles = useMemo(() => {
    return [...Array(40)].map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  }, []);

  useEffect(() => setIsMounted(true), []);

  const clearMessages = () => { setErrorMsg(""); setSuccessMsg(""); };

  // ── BƯỚC 1: Gửi email ──────────────────────────────────────────
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();
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

  // ── BƯỚC 2: Đặt lại mật khẩu ───────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    if (resetData.newPassword.length < 6) {
      setErrorMsg("Mật khẩu mới phải có ít nhất 6 ký tự."); return;
    }
    if (resetData.newPassword !== resetData.confirmPassword) {
      setErrorMsg("Xác nhận mật khẩu không khớp."); return;
    }
    setIsLoading(true);
    try {
      await authService.resetPassword({
        token: resetData.token,
        newPassword: resetData.newPassword,
      });
      setSuccessMsg("Đặt lại mật khẩu thành công! Đang chuyển về đăng nhập...");
      setTimeout(() => { window.location.href = "/login"; }, 2000);
    } catch (err) {
      setErrorMsg(err.message || "Token không hợp lệ hoặc đã hết hạn.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0A0E1A] font-sans text-white overflow-hidden relative">
      <style>{`
        @keyframes golden-fall {
          0% { transform: translateY(-10vh) scale(0.5); opacity: 0; }
          10% { opacity: var(--max-opacity); transform: translateY(0) scale(1); }
          90% { opacity: var(--max-opacity); }
          100% { transform: translateY(110vh) scale(0.5); opacity: 0; }
        }
        .golden-particle { animation: golden-fall linear infinite; }
      `}</style>

      {/* Particles */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="golden-particle absolute rounded-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]"
            style={{
              width: `${p.size}px`, height: `${p.size}px`,
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              "--max-opacity": p.opacity,
            }}
          />
        ))}
      </div>

      {/* CỘT TRÁI */}
      <div
        className="hidden lg:flex w-1/2 flex-col justify-end p-16 bg-cover bg-center bg-no-repeat relative z-10"
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(10,14,26,0.4), rgba(10,14,26,1)), url('/bg-horse.png')` }}
      >
        <div className={`relative z-20 max-w-xl transition-all duration-1000 transform ${isMounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight tracking-wide drop-shadow-lg">
            Khôi phục
            <br />
            <span className="text-[#D4AF37]">Tài khoản</span>
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed drop-shadow-md">
            {step === 1
              ? "Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác nhận về hộp thư của bạn."
              : "Nhập mã xác nhận từ email và đặt mật khẩu mới cho tài khoản."}
          </p>
        </div>
      </div>

      {/* CỘT PHẢI */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 relative z-10 shadow-[-20px_0_50px_rgba(10,14,26,0.8)]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className={`w-full max-w-md bg-[#111827]/90 backdrop-blur-xl rounded-2xl p-8 border border-gray-800/60 shadow-2xl relative z-10 transition-all duration-700 delay-150 transform ${isMounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 transition-all ${step >= 1 ? "bg-[#D4AF37] border-[#D4AF37] text-[#0A0E1A]" : "border-gray-600 text-gray-500"}`}>1</div>
            <div className={`h-0.5 w-12 transition-all ${step >= 2 ? "bg-[#D4AF37]" : "bg-gray-700"}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 transition-all ${step >= 2 ? "bg-[#D4AF37] border-[#D4AF37] text-[#0A0E1A]" : "border-gray-600 text-gray-500"}`}>2</div>
          </div>

          <div className="flex flex-col items-center mb-6">
            <h2 className="text-2xl font-bold text-white tracking-wide">
              {step === 1 ? "Quên mật khẩu" : "Đặt lại mật khẩu"}
            </h2>
            <p className="text-gray-400 text-sm mt-2 text-center">
              {step === 1
                ? "Nhập email đã đăng ký để nhận mã xác nhận"
                : `Mã đã gửi đến ${email} — có hiệu lực 15 phút`}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-red-950/50 border border-red-900 text-red-200 text-sm">
              <AlertCircle size={18} className="text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-green-950/50 border border-green-900 text-green-200 text-sm">
              <CheckCircle2 size={18} className="text-green-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div className="space-y-1.5 group">
                <Label htmlFor="email" className="text-gray-400 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37]">
                  Email đã đăng ký
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37]" size={18} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    className="pl-11 h-11 bg-[#0A0E1A]/80 border-gray-700 text-white focus-visible:ring-[#D4AF37]"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearMessages(); }}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-11 bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold text-base transition-all">
                {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang gửi...</> : "GỬI MÃ XÁC NHẬN"}
              </Button>
              <button type="button" onClick={() => setStep(2)} className="w-full text-center text-xs text-gray-500 hover:text-[#D4AF37] transition-colors pt-1">
                Đã có mã xác nhận? Nhập ngay →
              </button>
            </form>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5 group">
                <Label htmlFor="token" className="text-gray-400 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37]">
                  Mã xác nhận
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37]" size={18} />
                  <Input
                    id="token"
                    type="text"
                    placeholder="Nhập mã từ email..."
                    className="pl-11 h-11 bg-[#0A0E1A]/80 border-gray-700 text-white focus-visible:ring-[#D4AF37] tracking-widest"
                    value={resetData.token}
                    onChange={(e) => { setResetData({ ...resetData, token: e.target.value }); clearMessages(); }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <Label htmlFor="newPassword" className="text-gray-400 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37]">
                  Mật khẩu mới
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37]" size={18} />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tối thiểu 6 ký tự"
                    className="pl-11 pr-11 h-11 bg-[#0A0E1A]/80 border-gray-700 text-white focus-visible:ring-[#D4AF37]"
                    value={resetData.newPassword}
                    onChange={(e) => { setResetData({ ...resetData, newPassword: e.target.value }); clearMessages(); }}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#D4AF37]">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 group">
                <Label htmlFor="confirmPassword" className="text-gray-400 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37]">
                  Xác nhận mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37]" size={18} />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    className="pl-11 h-11 bg-[#0A0E1A]/80 border-gray-700 text-white focus-visible:ring-[#D4AF37]"
                    value={resetData.confirmPassword}
                    onChange={(e) => { setResetData({ ...resetData, confirmPassword: e.target.value }); clearMessages(); }}
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-11 bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold text-base transition-all">
                {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang xử lý...</> : "ĐẶT LẠI MẬT KHẨU"}
              </Button>

              <button
                type="button"
                onClick={() => { setStep(1); clearMessages(); }}
                className="w-full flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-[#D4AF37] transition-colors pt-1"
              >
                <ArrowLeft size={13} /> Quay lại nhập email
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-gray-800/50 text-center">
            <p className="text-sm text-gray-400">
              Nhớ mật khẩu rồi?{" "}
              <a href="/login" className="text-[#D4AF37] hover:text-[#f3cd57] font-semibold hover:underline">
                Đăng nhập ngay
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
