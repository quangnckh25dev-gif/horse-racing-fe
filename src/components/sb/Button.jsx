import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Nút sportsbook — variant: bet (emerald) · gold · ghost · outline · danger
const sbButton = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all cursor-pointer select-none disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sb-emerald/60",
  {
    variants: {
      variant: {
        bet: "bg-sb-emerald text-[#04241B] shadow-[0_6px_20px_rgba(16,185,129,.35)] hover:-translate-y-0.5 hover:brightness-110",
        gold: "bg-sb-gold text-[#2A2005] shadow-[0_6px_18px_rgba(224,166,42,.28)] hover:-translate-y-0.5 hover:brightness-110",
        ghost: "bg-sb-s3 text-sb-tx border border-sb-border-2 hover:border-sb-emerald",
        outline: "bg-transparent text-sb-tx-2 border border-sb-border-2 hover:text-sb-tx hover:border-sb-tx-3",
        danger: "bg-sb-lose/10 text-sb-lose border border-sb-lose/30 hover:bg-sb-lose/20",
      },
      size: {
        sm: "text-xs px-3 py-2",
        md: "text-sm px-4 py-3",
        lg: "text-[15px] px-6 py-3.5",
      },
    },
    defaultVariants: { variant: "bet", size: "md" },
  }
);

export function SbButton({ className, variant, size, ...props }) {
  return <button className={cn(sbButton({ variant, size }), className)} {...props} />;
}
