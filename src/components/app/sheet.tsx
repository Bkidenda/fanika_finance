import { useEffect } from "react";
import { X } from "lucide-react";

/** Mobile bottom sheet used for confirm/edit flows. */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-[28px] bg-card px-5 pb-6 pt-4 shadow-elevated" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}>
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {typeof title === "string" ? (
              <h3 className="truncate font-display text-xl leading-tight">{title}</h3>
            ) : (
              title
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-muted p-1.5 text-muted-foreground" aria-label="Close sheet">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
