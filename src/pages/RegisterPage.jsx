import { useState, useEffect, useMemo } from "react";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Type,
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
    return [...Array(40)].map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (errorMsg) setErrorMsg("");
    if (successMsg) setSuccessMsg("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const API_URL = "http://localhost:8080/api/auth/register";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMsg("Đăng ký thành công! Đang chuyển hướng...");
        // Đợi 1.5 giây cho người ta đọc thông báo rồi mới đá về trang Login
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } else {
        setErrorMsg(result.message || "Có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch (error) {
      setErrorMsg("Không thể kết nối đến máy chủ.");
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

      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="golden-particle absolute rounded-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]"
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

      {/* CỘT TRÁI */}
      <div
        className="hidden lg:flex w-1/2 flex-col justify-end p-16 bg-cover bg-center bg-no-repeat relative z-10"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(10, 14, 26, 0.4), rgba(10, 14, 26, 1)), url('/bg-horse.png')`,
        }}
      >
        <div
          className={`relative z-20 max-w-xl transition-all duration-1000 transform ${isMounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight tracking-wide drop-shadow-lg">
            Gia nhập Cộng đồng
            <br />
            <span className="text-[#D4AF37]">Thể thao tốc độ</span>
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed drop-shadow-md">
            Tạo tài khoản để trải nghiệm toàn bộ tính năng của hệ sinh thái quản
            lý giải đua ngựa hàng đầu.
          </p>
        </div>
      </div>

      {/* CỘT PHẢI */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 relative z-10 shadow-[-20px_0_50px_rgba(10,14,26,0.8)]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div
          className={`w-full max-w-md bg-[#111827]/90 backdrop-blur-xl rounded-2xl p-8 border border-gray-800/60 shadow-2xl relative z-10 transition-all duration-700 delay-150 transform ${isMounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} max-h-[90vh] overflow-y-auto custom-scrollbar`}
        >
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-2xl font-bold text-white tracking-wide">
              Đăng ký tài khoản
            </h2>
            <p className="text-gray-400 text-sm mt-2 text-center">
              Điền thông tin bên dưới để bắt đầu
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-red-950/50 border border-red-900 text-red-200 text-sm">
              <AlertCircle size={18} className="text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-green-950/50 border border-green-900 text-green-200 text-sm">
              <AlertCircle size={18} className="text-green-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Tên đăng nhập */}
            <div className="space-y-1.5 group">
              <Label
                htmlFor="username"
                className="text-gray-400 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37]"
              >
                Tài khoản
              </Label>
              <div className="relative">
                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37]"
                  size={18}
                />
                <Input
                  id="username"
                  type="text"
                  placeholder="Tên đăng nhập"
                  className="pl-11 h-11 bg-[#0A0E1A]/80 border-gray-700 text-white focus-visible:ring-[#D4AF37]"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div className="space-y-1.5 group">
              <Label
                htmlFor="password"
                className="text-gray-400 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37]"
              >
                Mật khẩu
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37]"
                  size={18}
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-11 pr-11 h-11 bg-[#0A0E1A]/80 border-gray-700 text-white focus-visible:ring-[#D4AF37]"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#D4AF37]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Họ và tên */}
            <div className="space-y-1.5 group">
              <Label
                htmlFor="fullName"
                className="text-gray-400 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37]"
              >
                Họ và tên
              </Label>
              <div className="relative">
                <Type
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37]"
                  size={18}
                />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="pl-11 h-11 bg-[#0A0E1A]/80 border-gray-700 text-white focus-visible:ring-[#D4AF37]"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5 group">
              <Label
                htmlFor="email"
                className="text-gray-400 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37]"
              >
                Email
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37]"
                  size={18}
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  className="pl-11 h-11 bg-[#0A0E1A]/80 border-gray-700 text-white focus-visible:ring-[#D4AF37]"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Số điện thoại */}
            <div className="space-y-1.5 group">
              <Label
                htmlFor="phone"
                className="text-gray-400 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37]"
              >
                Số điện thoại
              </Label>
              <div className="relative">
                <Phone
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37]"
                  size={18}
                />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0901234567"
                  className="pl-11 h-11 bg-[#0A0E1A]/80 border-gray-700 text-white focus-visible:ring-[#D4AF37]"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold text-base mt-4 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang xử
                  lý...
                </>
              ) : (
                "ĐĂNG KÝ TÀI KHOẢN"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-800/50 text-center">
            <p className="text-sm text-gray-400">
              Đã có tài khoản?{" "}
              <a
                href="/login"
                className="text-[#D4AF37] hover:text-[#f3cd57] font-semibold hover:underline"
              >
                Đăng nhập ngay
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
