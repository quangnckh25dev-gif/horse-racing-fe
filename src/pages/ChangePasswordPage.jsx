import { useState, useEffect, useMemo } from "react";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { authService } from "../services/auth";

const inputCls = "pl-11 pr-11 h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#D4AF37] focus-visible:border-[#D4AF37] transition-all duration-300 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden";

function PasswordField({ id, label, placeholder, value, show, onToggle, onChange }) {
  return (
    <div className="space-y-1.5 group">
      <Label htmlFor={id} className="text-gray-500 text-xs font-semibold uppercase tracking-widest group-focus-within:text-[#D4AF37] transition-colors">
        {label}
      </Label>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" size={16} />
        <Input id={id} type={show ? "text" : "password"} placeholder={placeholder}
          className={inputCls} value={value} onChange={onChange} required />
        <button type="button" onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition-colors">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
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
    const err = validate();
    if (err) { setErrorMsg(err); return; }
    setIsLoading(true);
    try {
      await authService.changePassword({ oldPassword: formData.oldPassword, newPassword: formData.newPassword });
      setSuccessMsg("Đổi mật khẩu thành công!");
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setErrorMsg(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full font-sans overflow-hidden relative bg-mesh">
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

      <div className="flex w-full items-center justify-center p-8 relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

        <div
          className={`w-full max-w-md rounded-2xl p-8 border relative z-10 transition-all duration-700 transform ${isMounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
          style={{
            background: "#FFFFFF",
            borderColor: "rgba(212,175,55,0.22)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.08), 0 0 32px rgba(212,175,55,0.07), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 mb-4 flex items-center justify-center">
              <Lock size={22} className="text-[#D4AF37]" />
            </div>
            <h2 className="font-display text-2xl font-black text-gray-900 tracking-tight">Đổi mật khẩu</h2>
            <p className="text-gray-500 text-sm mt-1.5 text-center">
              Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField id="oldPassword"     label="Mật khẩu hiện tại"    placeholder="••••••••"               value={formData.oldPassword}     show={show.old}     onToggle={() => setShow((s) => ({ ...s, old: !s.old }))}         onChange={handleChange} />
            <PasswordField id="newPassword"     label="Mật khẩu mới"         placeholder="Tối thiểu 6 ký tự"      value={formData.newPassword}     show={show.new}     onToggle={() => setShow((s) => ({ ...s, new: !s.new }))}         onChange={handleChange} />
            <PasswordField id="confirmPassword" label="Xác nhận mật khẩu"    placeholder="Nhập lại mật khẩu mới"  value={formData.confirmPassword} show={show.confirm} onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))} onChange={handleChange} />

            <Button type="submit" disabled={isLoading}
              className="w-full h-12 text-[#0A0E1A] font-bold text-base btn-gold btn-gold-glow transition-all duration-300 mt-2"
              style={{ background: "linear-gradient(135deg, #D4AF37 0%, #c9a227 50%, #B8860B 100%)" }}>
              {isLoading
                ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang xử lý...</>
                : "CẬP NHẬT MẬT KHẨU"}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <a href="/dashboard" className="text-sm text-[#D4AF37] hover:text-[#9A7B0A] font-semibold hover:underline underline-offset-2 transition-all">
              ← Quay về Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
