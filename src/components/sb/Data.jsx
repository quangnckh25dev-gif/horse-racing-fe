// Bảng, tab, ô thống kê — dùng chung cho các trang quản trị.

export function SbStatTile({ icon: Icon, label, value, sub, accent = "emerald", onClick }) {
  const accents = {
    emerald: "text-sb-emerald-ink bg-sb-emerald-soft border-sb-emerald-bd",
    gold:    "text-sb-gold-2 bg-sb-gold-soft border-sb-gold-bd",
    plain:   "text-sb-tx-2 bg-sb-s2 border-sb-border",
  };
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick}
      className={`flex items-center gap-3.5 p-4 rounded-2xl bg-sb-s1 border border-sb-border text-left w-full transition-all ${
        onClick ? "hover:border-sb-border-2 hover:-translate-y-0.5" : ""
      }`}>
      {Icon && (
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${accents[accent] || accents.plain}`}>
          <Icon size={17} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest">{label}</p>
        <p className="text-sb-tx text-xl font-black tabular-nums leading-tight">{value ?? "—"}</p>
        {sub && <p className="text-sb-tx-3 text-[11px] mt-0.5">{sub}</p>}
      </div>
    </Tag>
  );
}

export function SbTabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-sb-s2 border border-sb-border w-fit">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            active === t.id
              ? "bg-sb-s1 text-sb-tx border border-sb-border"
              : "text-sb-tx-3 hover:text-sb-tx-2 border border-transparent"
          }`}>
          {t.emoji && <span>{t.emoji}</span>}
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Bọc bảng: bảng rộng cuộn ngang trong khung, trang không bao giờ tràn ngang
export function SbTable({ head, children }) {
  return (
    <div className="rounded-2xl border border-sb-border bg-sb-s1 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="bg-sb-s2 border-b border-sb-border">
              {head.map((h, i) => (
                <th key={i}
                  className={`px-5 py-3 text-[10px] font-bold text-sb-tx-3 uppercase tracking-widest ${
                    h.align === "center" ? "text-center" : h.align === "right" ? "text-right" : "text-left"
                  }`}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function SbTr({ children, onClick }) {
  return (
    <tr onClick={onClick}
      className={`border-b border-sb-border last:border-0 transition-colors ${
        onClick ? "cursor-pointer hover:bg-sb-s2" : "hover:bg-sb-s2/60"
      }`}>
      {children}
    </tr>
  );
}

export function SbPageHeader({ eyebrow, title, icon: Icon, stats, actions }) {
  return (
    <div className="relative overflow-hidden border-b border-sb-border bg-sb-s1 px-6 py-5">
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <div className="flex items-center gap-2 mb-1.5">
              {Icon && (
                <div className="w-7 h-7 rounded-lg bg-sb-emerald-soft border border-sb-emerald-bd flex items-center justify-center">
                  <Icon size={13} className="text-sb-emerald-ink" />
                </div>
              )}
              <span className="text-[10px] font-bold text-sb-tx-3 uppercase tracking-widest">{eyebrow}</span>
            </div>
          )}
          <h1 className="text-2xl font-black text-sb-tx leading-tight truncate">{title}</h1>
          {stats?.length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {stats.map((s, i) => (
                <span key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sb-s2 border border-sb-border text-xs text-sb-tx-2">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
