import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, PartyAvatar, SectionLabel } from "@/components/app/page-header";
import { BottomSheet } from "@/components/app/sheet";
import { usePendingTransactions, ingestMessage, confirmPending, ignorePending, SAMPLE_MESSAGES, PENDING_KEY, type PendingTx } from "@/lib/pending";
import { useAccounts } from "@/lib/queries";
import { DEFAULT_BUDGET_CATEGORIES } from "@/lib/finance";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles, Inbox, MessageSquareText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/review")({
  head: () => ({
    meta: [
      { title: "To review — Fanika" },
      { name: "description", content: "Transactions detected from your messages. Nothing is logged until you confirm." },
      { property: "og:title", content: "To review — Fanika" },
      { property: "og:description", content: "Confirm, edit or ignore the transactions Fanika drafted from your messages." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Review,
});

const INCOME_CATEGORIES = ["Income"];

function Review() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const pending = usePendingTransactions();
  const accounts = useAccounts();
  const items = pending.data ?? [];

  const [pasteOpen, setPasteOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [ingesting, setIngesting] = useState(false);

  const [choose, setChoose] = useState<PendingTx | null>(null);
  const [edit, setEdit] = useState<PendingTx | null>(null);

  function invalidate() {
    void qc.invalidateQueries({ queryKey: PENDING_KEY });
    qc.invalidateQueries({ queryKey: ["expenses"] });
    qc.invalidateQueries({ queryKey: ["expenses-all"] });
    qc.invalidateQueries({ queryKey: ["income-entries"] });
    qc.invalidateQueries({ queryKey: ["income-entries-all"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }

  async function readMessage() {
    if (!messageText.trim()) return;
    setIngesting(true);
    try {
      const res = await ingestMessage(messageText);
      if (!res.ok) {
        toast.error(res.error ?? "Could not read that message");
      } else {
        toast.success("Draft added to review");
        setMessageText("");
        setPasteOpen(false);
        invalidate();
      }
    } finally {
      setIngesting(false);
    }
  }

  async function loadSamples() {
    setIngesting(true);
    try {
      for (const m of SAMPLE_MESSAGES) {
        await ingestMessage(m);
      }
      toast.success("Sample messages added to review");
      invalidate();
    } finally {
      setIngesting(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="To review"
        subtitle="Drafts from alerts you share. Nothing is logged until you confirm."
        right={
          <Button size="sm" className="rounded-full" onClick={() => setPasteOpen(true)}>
            <MessageSquareText className="mr-1 h-4 w-4" /> Message
          </Button>
        }
      />

      {pending.isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Checking for drafts…</p>
      ) : items.length === 0 ? (
        <EmptyReview loading={ingesting} onSamples={loadSamples} />
      ) : (
        <div className="space-y-3">
          {items.map((tx) => (
            <ReviewCard
              key={tx.id}
              tx={tx}
              currency="KES"
              onConfirm={() => {
                if (tx.direction === "in" || !tx.category) setChoose(tx);
                else void runConfirm(tx, { category: tx.category });
              }}
              onChoose={() => setChoose(tx)}
              onEdit={() => setEdit(tx)}
              onIgnore={async () => {
                await ignorePending(tx.id);
                invalidate();
                toast("Draft ignored");
              }}
            />
          ))}
        </div>
      )}

      {/* Paste / forward a message */}
      <BottomSheet open={pasteOpen} onClose={() => setPasteOpen(false)} title="Add from a message">
        <p className="mb-3 text-sm text-muted-foreground">
          Paste the text from an M-PESA, Airtel or bank alert. Fanika reads the amount, date, who was paid and the
          reference, then drafts it here.
        </p>
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          rows={5}
          placeholder="e.g. Ksh2,340.00 paid to NAIVAS SUPERMARKET on 3/11/26 at 6:42 PM…"
          className="w-full rounded-2xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Button className="mt-3 h-12 w-full rounded-full text-[15px]" onClick={readMessage} disabled={ingesting || !messageText.trim()}>
          {ingesting ? "Reading…" : "Read message"}
        </Button>
      </BottomSheet>

      {choose && (
        <ChooseCategorySheet
          tx={choose}
          accounts={accounts.data ?? []}
          onClose={() => setChoose(null)}
          onDone={() => {
            setChoose(null);
            invalidate();
          }}
        />
      )}
      {edit && (
        <EditDraftSheet
          tx={edit}
          accounts={accounts.data ?? []}
          onClose={() => setEdit(null)}
          onDone={() => {
            setEdit(null);
            invalidate();
          }}
        />
      )}
      {!user && null}
    </div>
  );
}

async function runConfirm(tx: PendingTx, opts: Parameters<typeof confirmPending>[1]) {
  try {
    await confirmPending(tx, opts);
    toast.success(`${tx.direction === "in" ? "Income" : "Expense"} logged`);
  } catch (e) {
    toast.error((e as Error).message);
  }
}

function ReviewCard({
  tx,
  currency,
  onConfirm,
  onChoose,
  onEdit,
  onIgnore,
}: {
  tx: PendingTx;
  currency: string;
  onConfirm: () => void;
  onChoose: () => void;
  onEdit: () => void;
  onIgnore: () => void;
}) {
  const time = tx.occurred_at
    ? new Date(tx.occurred_at).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })
    : new Date(tx.created_at).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
  const needsCategory = tx.direction === "out" && !tx.category;

  return (
    <article className="rounded-3xl bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <PartyAvatar name={tx.counterparty} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold leading-snug">{tx.counterparty}</h3>
          <p className="truncate text-[13px] text-muted-foreground">
            {tx.source} · {tx.kind} · {time}
          </p>
        </div>
        <div className={`shrink-0 text-right font-display text-lg leading-tight ${tx.direction === "in" ? "text-success" : ""}`}>
          {tx.direction === "in" ? "+" : ""}
          {currency} {fmt(tx.amount)}
        </div>
      </div>

      <div className="mt-2.5">
        {needsCategory ? (
          <span className="inline-flex rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning-foreground">
            Category needed
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary">
            Category: {tx.category ?? "Income"}
          </span>
        )}
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        {needsCategory
          ? "We could not tell what this payment was for. Please pick a category."
          : tx.reference
            ? `Matched from the message reference (${tx.reference}).`
            : "Matched from the message details."}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Button variant="secondary" className="h-10 rounded-full text-[13px] font-semibold text-secondary-foreground" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="secondary" className="h-10 rounded-full text-[13px] font-semibold text-secondary-foreground" onClick={onIgnore}>
          Ignore
        </Button>
        <Button className="h-10 rounded-full text-[13px]" onClick={needsCategory ? onChoose : onConfirm}>
          {needsCategory ? "Choose" : "Confirm"}
        </Button>
      </div>
    </article>
  );
}

function ChooseCategorySheet({
  tx,
  accounts,
  onClose,
  onDone,
}: {
  tx: PendingTx;
  accounts: { id: string; name: string }[];
  onClose: () => void;
  onDone: () => void;
}) {
  const isIncome = tx.direction === "in";
  const options = isIncome ? INCOME_CATEGORIES : DEFAULT_BUDGET_CATEGORIES;
  const [category, setCategory] = useState(tx.category && options.includes(tx.category) ? tx.category : "");
  const [accountId, setAccountId] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!isIncome && !category) return toast.error("Pick a category first");
    setSaving(true);
    try {
      await confirmPending(tx, { category: isIncome ? "Income" : category, accountId: accountId || null });
      toast.success("Saved and logged");
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate font-display text-xl leading-tight">{tx.counterparty}</h3>
          <span className="shrink-0 font-display text-lg">KES {fmt(tx.amount)}</span>
        </div>
      }
    >
      <p className="-mt-1 mb-3 text-[13px] text-muted-foreground">
        {tx.source} · {tx.kind}
        {tx.reference ? ` · Ref ${tx.reference}` : ""}
      </p>
      <SectionLabel>Category</SectionLabel>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              category === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <SectionLabel>Account (optional)</SectionLabel>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="mt-2 h-11 w-full rounded-2xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">No account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <Button className="mt-5 h-12 w-full rounded-full text-[15px]" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save and confirm"}
      </Button>
    </BottomSheet>
  );
}

function EditDraftSheet({
  tx,
  accounts,
  onClose,
  onDone,
}: {
  tx: PendingTx;
  accounts: { id: string; name: string }[];
  onClose: () => void;
  onDone: () => void;
}) {
  const isIncome = tx.direction === "in";
  const options = isIncome ? INCOME_CATEGORIES : DEFAULT_BUDGET_CATEGORIES;
  const [amount, setAmount] = useState(String(tx.amount));
  const [label, setLabel] = useState(tx.counterparty);
  const [category, setCategory] = useState(tx.category && options.includes(tx.category) ? tx.category : options[0]);
  const [accountId, setAccountId] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const amt = Number(amount.replace(/,/g, ""));
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    setSaving(true);
    try {
      await confirmPending(
        { ...tx, amount: amt, counterparty: label || tx.counterparty },
        { category: isIncome ? "Income" : category, accountId: accountId || null, description: label || undefined },
      );
      toast.success("Saved and logged");
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet open onClose={onClose} title="Edit draft">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{isIncome ? "Source" : "Paid to"}</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
        </div>
        {!isIncome && (
          <div className="space-y-1.5">
            <Label>Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 w-full rounded-2xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {options.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Account (optional)</Label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="h-11 w-full rounded-2xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">No account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <Button className="h-12 w-full rounded-full text-[15px]" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save and confirm"}
        </Button>
      </div>
    </BottomSheet>
  );
}

function EmptyReview({ loading, onSamples }: { loading: boolean; onSamples: () => void }) {
  return (
    <div className="rounded-3xl bg-card p-6 text-center shadow-card">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-subtle text-primary">
        <Inbox className="h-6 w-6" />
      </span>
      <h2 className="mt-3 font-display text-xl">Nothing waiting</h2>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
        Paste an M-PESA, Airtel or bank alert with the <span className="font-semibold">Message</span> button and Fanika will
        draft it here for you to confirm.
      </p>
      <Button variant="outline" className="mt-4 rounded-full" onClick={onSamples} disabled={loading}>
        <Sparkles className="mr-1.5 h-4 w-4" /> {loading ? "Adding…" : "Try sample messages"}
      </Button>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(n);
}
