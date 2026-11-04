import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/app/page-header";
import { Mail, Landmark, Smartphone } from "lucide-react";

export const Route = createFileRoute("/_app/onboarding")({
  head: () => ({
    meta: [
      { title: "Message detection — Fanika" },
      { name: "description", content: "Let Fanika draft log entries from your M-PESA and bank messages. Nothing is added until you confirm." },
      { property: "og:title", content: "Message detection — Fanika" },
      { property: "og:description", content: "Fanika drafts transactions from your messages — you confirm before anything is logged." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

function markDone() {
  window.localStorage.setItem("fanika:detection-onboarded", "1");
}

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [mpesa, setMpesa] = useState(true);
  const [bank, setBank] = useState(true);

  function finish() {
    markDone();
    void navigate({ to: "/dashboard" });
  }

  if (step === 1) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={finish}
          className="rounded-full bg-secondary px-3.5 py-1.5 text-sm font-semibold text-secondary-foreground"
        >
          Back
        </button>
        <h1 className="font-display text-[30px] leading-[1.1]">Let Fanika suggest your transactions</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          When an M-PESA or bank message arrives, Fanika can draft a log entry. Nothing is added until you confirm it.
        </p>
        <div className="rounded-3xl bg-card p-5 shadow-card">
          <div className="space-y-4 text-[15px] leading-relaxed">
            <div>
              <SectionLabel>What Fanika reads</SectionLabel>
              <p className="mt-1 text-foreground/90">Only messages from senders you choose, such as M-PESA or your bank.</p>
            </div>
            <div>
              <SectionLabel>What it extracts</SectionLabel>
              <p className="mt-1 text-foreground/90">Amount, date, who was paid or who paid you, type, account and reference.</p>
            </div>
            <div>
              <SectionLabel>Why</SectionLabel>
              <p className="mt-1 text-foreground/90">
                To save you typing. Fanika cannot move money or send messages. You can turn this off any time.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-2.5">
          <Button className="h-12 w-full rounded-full text-[15px]" onClick={() => setStep(2)}>
            Continue
          </Button>
          <Button variant="ghost" className="h-12 w-full rounded-full bg-secondary text-[15px] text-secondary-foreground hover:bg-secondary/80" onClick={finish}>
            Not now
          </Button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="rounded-full bg-secondary px-3.5 py-1.5 text-sm font-semibold text-secondary-foreground"
        >
          Back
        </button>
        <h1 className="font-display text-[30px] leading-[1.1]">Choose what to include</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Pick senders now; change them later in More → Message detection.
        </p>
        <div className="divide-y rounded-3xl bg-card shadow-card">
          <SourceRow
            icon={<Smartphone className="h-5 w-5" />}
            name="M-PESA"
            detail="Payments, deposits, Fuliza"
            enabled={mpesa}
            disabled={false}
            onToggle={() => setMpesa((v) => !v)}
          />
          <SourceRow
            icon={<Landmark className="h-5 w-5" />}
            name="Bank alerts"
            detail="Debit and credit alerts"
            enabled={bank}
            disabled={false}
            onToggle={() => setBank((v) => !v)}
          />
          <SourceRow
            icon={<Smartphone className="h-5 w-5" />}
            name="Airtel Money"
            detail="Not supported yet"
            enabled={false}
            disabled
            onToggle={() => {}}
          />
        </div>
        <div className="space-y-2.5">
          <Button
            className="h-12 w-full rounded-full text-[15px]"
            disabled={!mpesa && !bank}
            onClick={() => {
              window.localStorage.setItem(
                "fanika:detection-sources",
                JSON.stringify({ mpesa, bank }),
              );
              setStep(3);
            }}
          >
            Allow message access
          </Button>
          <Button
            variant="ghost"
            className="h-12 w-full rounded-full bg-secondary text-[15px] text-secondary-foreground hover:bg-secondary/80"
            onClick={() => setStep(4)}
          >
            Not now
          </Button>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Your bank not listed? Add transactions manually any time.
        </p>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="rounded-full bg-secondary px-3.5 py-1.5 text-sm font-semibold text-secondary-foreground"
        >
          Back
        </button>
        <span className="inline-flex rounded-full bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary">
          Message access is on
        </span>
        <h1 className="font-display text-[30px] leading-[1.1]">Forward a message, get a draft</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          On the web, Fanika reads messages you send it. Forward an M-PESA or bank alert into
          <span className="font-semibold text-foreground"> Review</span> — Fanika drafts the entry, and you confirm it
          before anything is logged.
        </p>
        <div className="rounded-3xl bg-card p-5 shadow-card">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <Mail className="h-5 w-5" />
            </span>
            <p className="text-[15px] leading-relaxed text-foreground/90">
              Your phone never shares anything on its own. Fanika cannot move money or send messages, and you can turn
              this off any time from More.
            </p>
          </div>
        </div>
        <div className="space-y-2.5">
          <Button
            className="h-12 w-full rounded-full text-[15px]"
            onClick={() => {
              markDone();
              void navigate({ to: "/review" });
            }}
          >
            Go to Review
          </Button>
          <Button
            variant="ghost"
            className="h-12 w-full rounded-full bg-secondary text-[15px] text-secondary-foreground hover:bg-secondary/80"
            onClick={finish}
          >
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-10 text-center">
      <span className="inline-flex rounded-full bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary">
        Message access is off
      </span>
      <h1 className="font-display text-[30px] leading-[1.15]">No problem, Fanika works without it</h1>
      <p className="mx-auto max-w-xs text-[15px] leading-relaxed text-muted-foreground">
        You can log transactions by hand, and turn on detection later from More.
      </p>
      <div className="space-y-2.5 pt-2 text-left">
        <Button
          className="h-12 w-full rounded-full text-[15px]"
          onClick={() => {
            markDone();
            void navigate({ to: "/transactions" });
          }}
        >
          Add a transaction
        </Button>
        <Button
          variant="ghost"
          className="h-12 w-full rounded-full bg-secondary text-[15px] text-secondary-foreground hover:bg-secondary/80"
          onClick={finish}
        >
          Back to home
        </Button>
      </div>
    </div>
  );
}

function SourceRow({
  icon,
  name,
  detail,
  enabled,
  disabled,
  onToggle,
}: {
  icon: React.ReactNode;
  name: string;
  detail: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`flex w-full items-center justify-between gap-3 p-4 text-left ${disabled ? "opacity-60" : "active:bg-muted/40"}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-subtle text-primary">{icon}</span>
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-sm text-muted-foreground">{detail}</div>
        </div>
      </div>
      <Toggle on={enabled} />
    </button>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${on ? "bg-primary" : "bg-muted-foreground/30"}`}
    >
      <span
        className={`absolute h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[26px]" : "left-1"}`}
      />
    </span>
  );
}
