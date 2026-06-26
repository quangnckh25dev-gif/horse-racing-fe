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
  const [failedCount, setFailedCount] = useState(0);
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
    if (errorMsg) { setErrorMsg(""); }
    if (e.target.id === "username") { setFailedCount(0); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const result = await authService.login(formData);
      const { accessToken, user } = result.data;
      setFailedCount(0);
      login(user, accessToken, rememberMe);
      window.location.href = "/dashboard";
    } catch (err) {
      const msg = err.message || "";
      const isLocked = msg.toLowerCase().includes("khoa") || msg.toLowerCase().includes("lock");
      if (isLocked) {
        setFailedCount(5);
        setErrorMsg("Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần.");
      } else {
        setFailedCount((prev) => {
          const next = Math.min(prev + 1, 5);
          setErrorMsg(`Sai tài khoản hoặc mật khẩu. (Lần ${next}/5)`);
          return next;
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full font-sans text-white overflow-hidden relative bg-mesh">
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

      {/* CỘT TRÁI */}
      <div
        className="hidden lg:flex w-1/2 flex-col justify-end p-16 bg-cover bg-center bg-no-repeat relative z-10"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(253,252,247,0.2), rgba(250,246,230,0.92)), url('/bg-horse.png')`,
        }}
      >
        <div
          className={`relative z-20 max-w-xl transition-all duration-1000 transform ${isMounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 flex items-center justify-center">
              <span className="text-sm">🏆</span>
            </div>
            <span className="text-[#9A7B0A] text-xs font-bold uppercase tracking-widest font-data">HorseRacing Pro</span>
          </div>
          <h1 className="font-display text-5xl font-black text-gray-900 mb-4 leading-tight tracking-tight">
            Equestrian &amp; Racing
            <br />
            <span className="text-gold-gradient">Ecosystem</span>
          </h1>
          <p className="text-gray-600 text-base leading-relaxed">
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
          className={`w-full max-w-md rounded-2xl p-8 border relative z-10 transition-all duration-700 delay-150 transform ${isMounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
          style={{ background: "#FFFFFF", borderColor: "rgba(212,175,55,0.22)", boxShadow: "0 16px 48px rgba(0,0,0,0.08), 0 0 32px rgba(212,175,55,0.07), inset 0 1px 0 rgba(255,255,255,0.9)" }}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 mb-5 flex items-center justify-center gold-glow-ring">
              <span className="text-2xl select-none">🏇</span>
            </div>
            <h2 className="font-display text-2xl font-black text-gray-900 tracking-tight">
              HorseRacing Pro
            </h2>
            <p className="text-gray-500 text-sm mt-1.5 text-center">
              Đăng nhập để quản lý hồ sơ và tham gia thi đấu
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
                className="text-gray-500 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37] transition-colors"
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
                  className="pl-11 h-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#D4AF37] focus-visible:border-[#D4AF37] transition-all duration-300"
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
                  className="text-gray-500 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37] transition-colors"
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
                  className="pl-11 pr-11 h-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#D4AF37] focus-visible:border-[#D4AF37] transition-all duration-300 tracking-wider"
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
                  className="w-4 h-4 rounded border-gray-300 bg-white text-[#D4AF37] focus:ring-[#D4AF37] focus:ring-offset-0 transition-all cursor-pointer"
                />
                <span className="text-gray-500 text-sm font-medium group-hover:text-gray-700 transition-colors">
                  Duy trì đăng nhập
                </span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-[#0A0E1A] font-bold text-base relative overflow-hidden btn-gold btn-gold-glow transition-all duration-300"
              style={{ background: "linear-gradient(135deg, #D4AF37 0%, #c9a227 50%, #B8860B 100%)" }}
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

          <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-4">
            <p className="text-sm text-gray-500">
              Chưa có tài khoản?{" "}
              <a
                href="/register"
                className="text-[#D4AF37] hover:text-[#9A7B0A] font-semibold hover:underline underline-offset-2 transition-all"
              >
                Đăng ký tham gia ngay
              </a>
            </p>
            <p className="text-sm text-gray-400">
              Hoặc{" "}
              <a href="/races" className="text-[#D4AF37] hover:text-[#9A7B0A] font-semibold hover:underline underline-offset-2 transition-all">
                xem lịch đua không cần đăng nhập
              </a>
            </p>
            <div className="flex justify-center items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest font-medium">
              <span>Admin</span> • <span>Owner</span> • <span>Jockey</span> •{" "}
              <span>Referee</span> • <span>Spectator</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
