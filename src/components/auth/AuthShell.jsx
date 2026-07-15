import { Link } from "react-router-dom";

// Vỏ chung cho Login/Register/Forgot/ChangePassword — nền video ngựa + card tối
export default function AuthShell({ title, subtitle, children, wide = false }) {
  return (
    <div className="dark relative min-h-screen flex items-center justify-center p-4 bg-sb-bg text-sb-tx overflow-hidden">
      {/* Nền video ngựa (tái dùng asset landing) */}
      <div className="absolute inset-0 bg-[#05070A]" />
      <video className="absolute inset-0 w-full h-full object-cover opacity-35" autoPlay muted loop playsInline poster="/bg-horse.png">
        <source src="/horse.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/70 via-[#05070A]/40 to-[#05070A]/90" />

      <div className={`relative z-10 w-full ${wide ? "max-w-xl" : "max-w-md"}`}>
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-6 group">
          <div className="w-9 h-9 rounded-xl bg-sb-emerald-soft border border-sb-emerald-bd flex items-center justify-center text-lg">🏇</div>
          <div className="text-left">
            <p className="text-sb-tx font-bold text-sm tracking-widest uppercase leading-none group-hover:text-sb-emerald-ink transition-colors">HorseRacing VN</p>
            <p className="text-sb-tx-3 text-[9px] tracking-widest uppercase mt-0.5">Season 2026</p>
          </div>
        </Link>

        <div className="rounded-2xl bg-sb-s1/95 backdrop-blur border border-sb-border shadow-2xl shadow-black/50 p-7">
          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-sb-tx">{title}</h2>
            {subtitle && <p className="text-sb-tx-3 text-sm mt-1">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
