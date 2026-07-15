import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { authService } from "../services/auth";
import AuthShell from "../components/auth/AuthShell";

const inputCls =
  "w-full h-11 pl-11 pr-11 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx text-sm " +
  "placeholder:text-sb-tx-3 outline-none focus:border-sb-emerald focus:ring-1 focus:ring-sb-emerald/40 transition-all";

function PasswordField({ id, label, placeholder, value, show, onToggle, onChange }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sb-tx-3" size={16} />
        <input id={id} type={show ? "text" : "password"} placeholder={placeholder}
          className={inputCls} value={value} onChange={onChange} required />
        <button type="button" onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sb-tx-3 hover:text-sb-tx transition-colors">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
    <AuthShell title="Đổi mật khẩu" subtitle="Nhập mật khẩu hiện tại và mật khẩu mới">
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField id="oldPassword"     label="Mật khẩu hiện tại"  placeholder="••••••••"              value={formData.oldPassword}     show={show.old}     onToggle={() => setShow((s) => ({ ...s, old: !s.old }))}         onChange={handleChange} />
        <PasswordField id="newPassword"     label="Mật khẩu mới"       placeholder="Tối thiểu 6 ký tự"     value={formData.newPassword}     show={show.new}     onToggle={() => setShow((s) => ({ ...s, new: !s.new }))}         onChange={handleChange} />
        <PasswordField id="confirmPassword" label="Xác nhận mật khẩu"  placeholder="Nhập lại mật khẩu mới" value={formData.confirmPassword} show={show.confirm} onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))} onChange={handleChange} />

        <button type="submit" disabled={isLoading}
          className="w-full h-12 rounded-xl bg-sb-emerald text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Đang xử lý…</> : "CẬP NHẬT MẬT KHẨU"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-sb-border text-center">
        <button onClick={() => navigate("/dashboard")}
          className="text-sm text-sb-emerald-ink font-semibold hover:underline">
          ← Quay về Dashboard
        </button>
      </div>
    </AuthShell>
  );
}
