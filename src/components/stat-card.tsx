import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = false,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-3.5 md:p-5 shadow-card transition hover:shadow-elevated",
        accent && "bg-gradient-hero border-transparent text-primary-foreground",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div className="space-y-1">
          <div
            className={cn(
              "text-xs font-medium uppercase tracking-wider",
              accent ? "text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            {label}
          </div>
          <div className="text-xl md:text-2xl font-semibold tabular-nums">{value}</div>
          {hint && (
            <div
              className={cn(
                "text-xs",
                accent ? "text-primary-foreground/80" : "text-muted-foreground"
              )}
            >
              {hint}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl",
              accent ? "bg-white/15" : "bg-secondary text-primary"
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
