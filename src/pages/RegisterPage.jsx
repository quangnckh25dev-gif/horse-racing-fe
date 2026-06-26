import { useState, useEffect, useMemo } from "react";
import {
  User, Lock, Eye, EyeOff, Loader2, AlertCircle,
  Mail, Phone, Type, CheckCircle2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    phone: "",
  });
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

  useEffect(() => { setIsMounted(true); }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (errorMsg) setErrorMsg("");
    if (successMsg) setSuccessMsg("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(""); setSuccessMsg("");
    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (response.ok) {
        setSuccessMsg("Đăng ký thành công! Đang chuyển hướng...");
        setTimeout(() => { window.location.href = "/login"; }, 1500);
      } else {
        setErrorMsg(result.message || "Có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch {
      setErrorMsg("Không thể kết nối đến máy chủ.");
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
        <div
          className={`relative z-20 max-w-xl transition-all duration-1000 transform ${
            isMounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 flex items-center justify-center">
              <span className="text-sm">🏆</span>
            </div>
            <span className="text-[#9A7B0A] text-xs font-bold uppercase tracking-widest">HorseRacing Pro</span>
          </div>
          <h1 className="font-display text-5xl font-black text-gray-900 mb-4 leading-tight tracking-tight">
            Gia nhập Cộng đồng
            <br />
            <span className="text-gold-gradient">Thể thao tốc độ</span>
          </h1>
          <p className="text-gray-600 text-base leading-relaxed">
            Tạo tài khoản để trải nghiệm toàn bộ tính năng của hệ sinh thái quản lý giải đua ngựa hàng đầu.
          </p>
        </div>
      </div>

      {/* ── Right column — form ── */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 relative z-10 shadow-[-20px_0_50px_rgba(10,14,26,0.8)]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

        <div
          className={`w-full max-w-md rounded-2xl p-8 border relative z-10 transition-all duration-700 delay-150 transform ${
            isMounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          } max-h-[92vh] overflow-y-auto`}
          style={{
            background: "#FFFFFF",
            borderColor: "rgba(212,175,55,0.22)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.08), 0 0 32px rgba(212,175,55,0.07), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 mb-4 flex items-center justify-center">
              <span className="text-2xl select-none">🏇</span>
            </div>
            <h2 className="font-display text-2xl font-black text-gray-900 tracking-tight">Đăng ký tài khoản</h2>
            <p className="text-gray-500 text-sm mt-1.5 text-center">Điền thông tin bên dưới để bắt đầu</p>
          </div>

          {errorMsg && (
            <div className="mb-4 flex items-center gap-3 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-center gap-3 p-3.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Username */}
            <div className="space-y-1.5 group">
              <Label htmlFor="username" className="text-gray-500 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37] transition-colors">
                Tài khoản
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" size={16} />
                <Input id="username" type="text" placeholder="Tên đăng nhập" className={inputCls}
                  value={formData.username} onChange={handleChange} required />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 group">
              <Label htmlFor="password" className="text-gray-500 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37] transition-colors">
                Mật khẩu
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" size={16} />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  className={`${inputCls} pr-11 tracking-wider`}
                  value={formData.password} onChange={handleChange} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Full name */}
            <div className="space-y-1.5 group">
              <Label htmlFor="fullName" className="text-gray-500 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37] transition-colors">
                Họ và tên
              </Label>
              <div className="relative">
                <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" size={16} />
                <Input id="fullName" type="text" placeholder="Ví dụ: Nguyễn Văn A" className={inputCls}
                  value={formData.fullName} onChange={handleChange} required />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5 group">
              <Label htmlFor="email" className="text-gray-500 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37] transition-colors">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" size={16} />
                <Input id="email" type="email" placeholder="email@example.com" className={inputCls}
                  value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5 group">
              <Label htmlFor="phone" className="text-gray-500 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37] transition-colors">
                Số điện thoại
              </Label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" size={16} />
                <Input id="phone" type="tel" placeholder="0901234567" className={inputCls}
                  value={formData.phone} onChange={handleChange} />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-[#0A0E1A] font-bold text-base relative overflow-hidden btn-gold btn-gold-glow transition-all duration-300 mt-2"
              style={{ background: "linear-gradient(135deg, #D4AF37 0%, #c9a227 50%, #B8860B 100%)" }}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang xử lý...</>
              ) : "ĐĂNG KÝ TÀI KHOẢN"}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-3">
            <p className="text-sm text-gray-500">
              Đã có tài khoản?{" "}
              <a href="/login" className="text-[#D4AF37] hover:text-[#9A7B0A] font-semibold hover:underline underline-offset-2 transition-all">
                Đăng nhập ngay
              </a>
            </p>
            <p className="text-sm text-gray-400">
              Hoặc{" "}
              <a href="/races" className="text-[#D4AF37] hover:text-[#9A7B0A] font-semibold hover:underline underline-offset-2 transition-all">
                xem lịch đua không cần đăng nhập
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
