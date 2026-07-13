import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Nhãn trạng thái sportsbook — live/open/sched/fin/win/lose
const sbBadge = cva(
  "inline-flex items-center gap-1.5 rounded-full text-[11px] font-extrabold px-2.5 py-1 leading-none",
  {
    variants: {
      variant: {
        live: "bg-sb-lose/12 text-sb-lose border border-sb-lose/35",
        open: "bg-sb-emerald-soft text-sb-emerald-ink border border-sb-emerald-bd",
        sched: "bg-sb-info/12 text-sb-info border border-sb-info/35",
        fin: "bg-sb-s3 text-sb-tx-2 border border-sb-border-2",
        win: "bg-sb-win/12 text-sb-win border border-sb-win/35",
        lose: "bg-sb-lose/12 text-sb-lose border border-sb-lose/35",
      },
    },
    defaultVariants: { variant: "open" },
  }
);

export function SbBadge({ className, variant, live = false, children, ...props }) {
  return (
    <span className={cn(sbBadge({ variant }), className)} {...props}>
      {live && <span className="w-1.5 h-1.5 rounded-full bg-sb-live live-dot" />}
      {children}
    </span>
  );
}
