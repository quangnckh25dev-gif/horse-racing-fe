import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  User, Lock, Eye, EyeOff, Loader2, AlertCircle,
  Mail, Phone, Type, CheckCircle2, ShieldCheck,
} from "lucide-react";
import { authService } from "../services/auth";
import AuthShell from "../components/auth/AuthShell";

// value = enum BE (GET /api/auth/register-roles). Admin is NOT selectable here.
const ROLE_OPTIONS = [
  { value: "Spectator",  label: "Spectator" },
  { value: "HorseOwner", label: "Horse Owner" },
  { value: "Jockey",     label: "Jockey" },
  { value: "Referee",    label: "Referee" },
  { value: "Organizer",  label: "Organizer" },
];

// ── Yup: validation rules for each field (Formik checks them automatically) ──
const RegisterSchema = Yup.object({
  username: Yup.string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .matches(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscore are allowed")
    .required("Username is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  fullName: Yup.string()
    .trim()
    .min(2, "Full name is too short")
    .required("Full name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  phone: Yup.string()
    .matches(/^0\d{9}$/, { message: "Phone must be 10 digits starting with 0", excludeEmptyString: true }),
  role: Yup.string().required("Please select a role"),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const formik = useFormik({
    initialValues: { username: "", password: "", fullName: "", email: "", phone: "", role: "" },
    validationSchema: RegisterSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError(""); setSuccessMsg("");
      try {
        // BE reads roleName (not role)
        const { role, ...rest } = values;
        await authService.register({ ...rest, roleName: role });
        // Spectator is auto-approved; other roles must wait for Admin approval
        setSuccessMsg(
          role === "Spectator"
            ? "Registration successful! Your Spectator account is auto-approved. You can log in now. Redirecting..."
            : "Registration successful! Your account needs Admin approval before you can log in. Redirecting..."
        );
        setTimeout(() => navigate("/login"), 1900);
      } catch (err) {
        setServerError(err.message || "Registration failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const inputCls =
    "w-full h-11 pl-11 pr-4 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx text-sm " +
    "placeholder:text-sb-tx-3 outline-none focus:border-sb-emerald focus:ring-1 focus:ring-sb-emerald/40 transition-all";
  const iconCls = "absolute left-3.5 top-1/2 -translate-y-1/2 text-sb-tx-3";
  const labelCls = "block text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-1.5";

  // Field error shows only after the user has touched that field
  const fieldError = (name) => formik.touched[name] && formik.errors[name];
  const clsOf = (name) => inputCls + (fieldError(name) ? " border-sb-lose focus:border-sb-lose focus:ring-sb-lose/40" : "");
  const ErrText = ({ name }) =>
    fieldError(name) ? (
      <p className="text-sb-lose text-xs mt-1 flex items-center gap-1">
        <AlertCircle size={12} className="shrink-0" /> {formik.errors[name]}
      </p>
    ) : null;

  return (
    <AuthShell title="Create Account" subtitle="Fill in your information to get started" wide>
      {serverError && (
        <div className="mb-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm">
          <AlertCircle size={16} className="shrink-0" /> <span>{serverError}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-sb-emerald-soft border border-sb-emerald-bd text-sb-emerald-ink text-sm">
          <CheckCircle2 size={16} className="shrink-0" /> <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="username" className={labelCls}>Username</label>
            <div className="relative">
              <User className={iconCls} size={16} />
              <input id="username" name="username" placeholder="username" className={clsOf("username")}
                value={formik.values.username} onChange={formik.handleChange} onBlur={formik.handleBlur}
                autoComplete="username" />
            </div>
            <ErrText name="username" />
          </div>
          <div>
            <label htmlFor="password" className={labelCls}>Password</label>
            <div className="relative">
              <Lock className={iconCls} size={16} />
              <input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                className={clsOf("password") + " pr-11"} value={formik.values.password}
                onChange={formik.handleChange} onBlur={formik.handleBlur} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sb-tx-3 hover:text-sb-tx transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <ErrText name="password" />
          </div>
        </div>

        <div>
          <label htmlFor="fullName" className={labelCls}>Full Name</label>
          <div className="relative">
            <Type className={iconCls} size={16} />
            <input id="fullName" name="fullName" placeholder="John Doe" className={clsOf("fullName")}
              value={formik.values.fullName} onChange={formik.handleChange} onBlur={formik.handleBlur} />
          </div>
          <ErrText name="fullName" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className={labelCls}>Email</label>
            <div className="relative">
              <Mail className={iconCls} size={16} />
              <input id="email" name="email" type="email" placeholder="email@gmail.com" className={clsOf("email")}
                value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            </div>
            <ErrText name="email" />
          </div>
          <div>
            <label htmlFor="phone" className={labelCls}>Phone Number</label>
            <div className="relative">
              <Phone className={iconCls} size={16} />
              <input id="phone" name="phone" type="tel" placeholder="0901234567" className={clsOf("phone")}
                value={formik.values.phone} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            </div>
            <ErrText name="phone" />
          </div>
        </div>

        <div>
          <label htmlFor="role" className={labelCls}>Role <span className="text-sb-lose">*</span></label>
          <div className="relative">
            <ShieldCheck className={iconCls + " z-10"} size={16} />
            <select id="role" name="role" value={formik.values.role}
              onChange={formik.handleChange} onBlur={formik.handleBlur}
              className={clsOf("role") + " appearance-none cursor-pointer"}>
              <option value="" disabled>— Select Role —</option>
              {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <ErrText name="role" />
        </div>

        <button type="submit" disabled={formik.isSubmitting}
          className="w-full h-12 rounded-xl bg-sb-emerald text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          {formik.isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</> : "CREATE ACCOUNT"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-sb-border text-center space-y-2">
        <p className="text-sm text-sb-tx-3">
          Already have an account?{" "}
          <Link to="/login" className="text-sb-emerald-ink font-semibold hover:underline">Login now</Link>
        </p>
        <p className="text-sm text-sb-tx-3">
          Or <Link to="/" className="text-sb-emerald-ink font-semibold hover:underline">view the race schedule without logging in</Link>
        </p>
      </div>
    </AuthShell>
  );
}
