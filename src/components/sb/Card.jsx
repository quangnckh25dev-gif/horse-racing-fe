import { cn } from "@/lib/utils";

// Card nền sportsbook
export function SbCard({ className, ...props }) {
  return (
    <div
      className={cn(
        "bg-sb-s1 border border-sb-border rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,.06)]",
        className
      )}
      {...props}
    />
  );
}
