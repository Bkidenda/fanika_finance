import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** Skeleton placeholder for a vertical list/grid while data loads. Never render a bare spinner. */
export function ListSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={className ?? "space-y-3"} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Empty state with icon, explanation, and an optional primary call to action. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center ${className ?? ""}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action && (
        <Button onClick={action.onClick} className="mt-1">
          {action.label}
        </Button>
      )}
    </div>
  );
}

/** AlertDialog wrapper for delete confirmations that name the affected record. */
export function ConfirmDelete({
  trigger,
  title,
  description,
  confirmLabel = "Delete",
  busy,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            aria-busy={busy}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={async (e) => {
              e.preventDefault();
              await onConfirm();
              setOpen(false);
            }}
          >
            {busy ? "Deleting…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
