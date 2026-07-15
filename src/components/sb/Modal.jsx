import { useEffect } from "react";
import { X } from "lucide-react";

const TONE = {
  default: "from-sb-emerald to-transparent",
  gold:    "from-sb-gold to-transparent",
  danger:  "from-sb-lose to-transparent",
};

export default function SbModal({ title, subtitle, tone = "default", size = "md", onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const maxW = size === "lg" ? "max-w-3xl" : size === "sm" ? "max-w-sm" : "max-w-lg";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className={`w-full ${maxW} max-h-[90vh] overflow-y-auto rounded-2xl bg-sb-s1 border border-sb-border shadow-2xl shadow-black/40 animate-scale-in`}
        role="dialog" aria-modal="true">
        <div className={`h-0.5 rounded-t-2xl bg-gradient-to-r ${TONE[tone] || TONE.default}`} />
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-sb-border">
          <div className="min-w-0">
            <h3 className="text-sb-tx font-bold truncate">{title}</h3>
            {subtitle && <p className="text-sb-tx-3 text-xs mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Đóng"
            className="p-1.5 rounded-lg text-sb-tx-3 hover:text-sb-tx hover:bg-sb-s2 transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
