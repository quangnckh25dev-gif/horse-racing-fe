import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";

const TONES = {
  error:   { cls: "bg-sb-lose/10 border-sb-lose/30 text-sb-lose",             Icon: AlertCircle },
  success: { cls: "bg-sb-emerald-soft border-sb-emerald-bd text-sb-emerald-ink", Icon: CheckCircle2 },
  info:    { cls: "bg-sb-s2 border-sb-border text-sb-tx-2",                    Icon: Info },
  warn:    { cls: "bg-sb-gold-soft border-sb-gold-bd text-sb-gold-2",          Icon: AlertCircle },
};

export function SbAlert({ tone = "error", children }) {
  if (!children) return null;
  const { cls, Icon } = TONES[tone] || TONES.info;
  return (
    <div className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm ${cls}`}>
      <Icon size={15} className="shrink-0" />
      <span className="min-w-0">{children}</span>
    </div>
  );
}

export function SbSpinner({ size = 28, className = "" }) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <Loader2 size={size} className="animate-spin text-sb-emerald" />
    </div>
  );
}

export function SbEmpty({ icon = "📭", title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4 opacity-40">{icon}</div>
      <p className="text-sb-tx-2 font-semibold">{title}</p>
      {hint && <p className="text-sb-tx-3 text-sm mt-1">{hint}</p>}
    </div>
  );
}
