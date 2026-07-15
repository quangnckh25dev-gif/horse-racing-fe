const base =
  "w-full rounded-xl bg-sb-s2 border border-sb-border text-sb-tx text-sm px-3 py-2.5 " +
  "placeholder:text-sb-tx-3 transition-all outline-none " +
  "focus:border-sb-emerald focus:ring-1 focus:ring-sb-emerald/40 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export function SbLabel({ children, required }) {
  return (
    <label className="block text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-1.5">
      {children}
      {required && <span className="text-sb-lose ml-0.5">*</span>}
    </label>
  );
}

export function SbField({ label, required, hint, children }) {
  return (
    <div>
      {label && <SbLabel required={required}>{label}</SbLabel>}
      {children}
      {hint && <p className="text-sb-tx-3 text-[11px] mt-1">{hint}</p>}
    </div>
  );
}

export function SbInput(props) {
  return <input {...props} className={`${base} ${props.className || ""}`} />;
}

export function SbSelect({ children, ...props }) {
  return (
    <select {...props} className={`${base} ${props.className || ""}`}>
      {children}
    </select>
  );
}

export function SbTextarea(props) {
  return <textarea {...props} className={`${base} resize-none ${props.className || ""}`} />;
}
