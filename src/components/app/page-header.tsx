import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  showBack = false,
  right,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <header className="pt-1">
      {showBack && (
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate({ to: "/dashboard" }) : navigate({ to: "/dashboard" }))}
          className="mb-3 inline-flex items-center gap-1 rounded-full bg-secondary px-3.5 py-1.5 text-sm font-semibold text-secondary-foreground active:scale-95 transition"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] leading-tight tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {right && <div className="shrink-0 pt-1">{right}</div>}
      </div>
    </header>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </div>
  );
}

/** Round tan avatar with the first letter of a name. */
export function PartyAvatar({ name }: { name: string }) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-base font-semibold text-secondary-foreground">
      {letter}
    </span>
  );
}
