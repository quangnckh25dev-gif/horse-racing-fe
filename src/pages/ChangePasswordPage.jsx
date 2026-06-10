import { useState, useEffect, useMemo } from "react";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { authService } from "../services/auth";

function PasswordField({ id, label, showKey, placeholder, value, show, onToggle, onChange }) {
  return (
    <div className="space-y-1.5 group">
      <Label
        htmlFor={id}
        className="text-gray-400 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37]"
      >
        {label}
      </Label>
      <div className="relative">
        <Lock
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37]"
          size={18}
        />
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          className="pl-11 pr-11 h-11 bg-[#0A0E1A]/80 border-gray-700 text-white focus-visible:ring-[#D4AF37] [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
          value={value}
          onChange={onChange}
          required
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#D4AF37]"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (errorMsg) setErrorMsg("");
    if (successMsg) setSuccessMsg("");
  };

  const validate = () => {
    if (!formData.oldPassword) return "Vui lòng nhập mật khẩu hiện tại.";
    if (formData.newPassword.length < 6) return "Mật khẩu mới phải có ít nhất 6 ký tự.";
    if (formData.newPassword === formData.oldPassword) return "Mật khẩu mới phải khác mật khẩu cũ.";
    if (formData.newPassword !== formData.confirmPassword) return "Xác nhận mật khẩu không khớp.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setErrorMsg(validationError); return; }

    setIsLoading(true);
    try {
      await authService.changePassword({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });
      setSuccessMsg("Đổi mật khẩu thành công!");
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setErrorMsg(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
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

      <div className="flex w-full items-center justify-center p-8 relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />
        <div
          className={`w-full max-w-md bg-[#111827]/90 backdrop-blur-xl rounded-2xl p-8 border border-gray-800/60 shadow-2xl relative z-10 transition-all duration-700 transform ${isMounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          <div className="flex flex-col items-center mb-8">
            <h2 className="text-2xl font-bold text-white tracking-wide">Đổi mật khẩu</h2>
            <p className="text-gray-400 text-sm mt-2 text-center">
              Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField id="oldPassword"     label="Mật khẩu hiện tại" placeholder="••••••••"            value={formData.oldPassword}     show={show.old}     onToggle={() => setShow((s) => ({ ...s, old: !s.old }))}     onChange={handleChange} />
            <PasswordField id="newPassword"     label="Mật khẩu mới"      placeholder="Tối thiểu 6 ký tự"  value={formData.newPassword}     show={show.new}     onToggle={() => setShow((s) => ({ ...s, new: !s.new }))}     onChange={handleChange} />
            <PasswordField id="confirmPassword" label="Xác nhận mật khẩu" placeholder="Nhập lại mật khẩu mới" value={formData.confirmPassword} show={show.confirm} onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))} onChange={handleChange} />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold text-base mt-2 transition-all"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang xử lý...</>
              ) : "CẬP NHẬT MẬT KHẨU"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-800/50 text-center">
            <a href="/dashboard" className="text-sm text-[#D4AF37] hover:text-[#f3cd57] font-semibold hover:underline">
              ← Quay về Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
