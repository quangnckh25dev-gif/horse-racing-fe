import { useState, useEffect, useMemo } from "react";
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Tạo ra 40 hạt bụi vàng với vị trí và thời gian rơi ngẫu nhiên
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
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const result = await authService.login(formData);
      const { accessToken, user } = result.data;
      login(user, accessToken, rememberMe);
      window.location.href = "/dashboard";
    } catch (err) {
      setErrorMsg(err.message || "Tài khoản hoặc mật khẩu chưa chính xác.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0A0E1A] font-sans text-white overflow-hidden relative">
      {/* KHỐI CSS TẠO HIỆU ỨNG RƠI CHUẨN */}
      <style>{`
        @keyframes golden-fall {
          0% { transform: translateY(-10vh) scale(0.5); opacity: 0; }
          10% { opacity: var(--max-opacity); transform: translateY(0) scale(1); }
          90% { opacity: var(--max-opacity); }
          100% { transform: translateY(110vh) scale(0.5); opacity: 0; }
        }
        .golden-particle {
          animation: golden-fall linear infinite;
        }
      `}</style>

      {/* RENDER CÁC HẠT BỤI VÀNG RƠI LẢ TẢ */}
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

      {/* CỘT TRÁI: Ảnh nền tĩnh kết hợp hiệu ứng bụi vàng */}
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
            Equestrian & Racing
            <br />
            <span className="text-[#D4AF37]">Ecosystem</span>
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed drop-shadow-md">
            Nền tảng toàn diện kết nối Chủ ngựa, Nài ngựa chuyên nghiệp, Ban
            trọng tài và Cộng đồng đam mê thể thao tốc độ.
          </p>
        </div>
      </div>

      {/* CỘT PHẢI: Form Đăng Nhập */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 relative z-10 shadow-[-20px_0_50px_rgba(10,14,26,0.8)]">
        {/* Ánh sáng nền hắt ra từ form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div
          className={`w-full max-w-md bg-[#111827]/90 backdrop-blur-xl rounded-2xl p-8 border border-gray-800/60 shadow-2xl relative z-10 transition-all duration-700 delay-150 transform ${isMounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#0A0E1A] border-2 border-[#D4AF37] mb-5 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:rotate-12 transition-transform duration-500 cursor-pointer">
              <div className="w-8 h-4 border-t-4 border-[#D4AF37] rounded-t-full rotate-45"></div>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-wide">
              Truy cập hệ thống
            </h2>
            <p className="text-gray-400 text-sm mt-2 text-center">
              Đăng nhập để xem lịch thi đấu, quản lý hồ sơ và tham gia dự đoán
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 flex items-center gap-3 p-3.5 rounded-lg bg-red-950/50 border border-red-900 text-red-200 text-sm animate-pulse">
              <AlertCircle size={18} className="text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2 group">
              <Label
                htmlFor="username"
                className="text-gray-400 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37] transition-colors"
              >
                Tài khoản
              </Label>
              <div className="relative">
                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors duration-300"
                  size={18}
                />
                <Input
                  id="username"
                  type="text"
                  placeholder="Nhập tên tài khoản..."
                  className="pl-11 h-12 bg-[#0A0E1A]/80 border-gray-700 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-[#D4AF37] focus-visible:border-[#D4AF37] transition-all duration-300"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-gray-400 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37] transition-colors"
                >
                  Mật khẩu
                </Label>
                <a
                  href="/forgot-password"
                  className="text-xs text-[#D4AF37] hover:text-[#f3cd57] hover:underline underline-offset-2 transition-all"
                >
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors duration-300"
                  size={18}
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-11 pr-11 h-12 bg-[#0A0E1A]/80 border-gray-700 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-[#D4AF37] focus-visible:border-[#D4AF37] transition-all duration-300 tracking-wider"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#D4AF37] transition-colors duration-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-[#0A0E1A] text-[#D4AF37] focus:ring-[#D4AF37] focus:ring-offset-0 transition-all cursor-pointer"
                />
                <span className="text-gray-400 text-sm font-medium group-hover:text-gray-300 transition-colors">
                  Duy trì đăng nhập
                </span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold text-base transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:-translate-y-0.5 relative overflow-hidden group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang xử
                  lý...
                </>
              ) : (
                "ĐĂNG NHẬP"
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-800/50 text-center space-y-4">
            <p className="text-sm text-gray-400">
              Chưa có tài khoản?{" "}
              <a
                href="/register"
                className="text-[#D4AF37] hover:text-[#f3cd57] font-semibold hover:underline underline-offset-2 transition-all"
              >
                Đăng ký tham gia ngay
              </a>
            </p>
            <div className="flex justify-center items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-medium">
              <span>Admin</span> • <span>Owner</span> • <span>Jockey</span> •{" "}
              <span>Referee</span> • <span>Spectator</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
