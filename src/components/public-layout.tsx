import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, Facebook, Linkedin, Youtube, Instagram, Sprout } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AIChatbot } from "@/components/ai-chatbot";

const NAV = [
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
] as const;

export const EMAIL = "bkidenda@gmail.com";
export const PHONE_DISPLAY = "+254 708 096 833";
export const DEMO_URL = "https://calendly.com/bkidenda/30min?back=1&month=2026-06";

/** Primary action — sage brand pill. */
export function BtnPrimary({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-card transition hover:bg-primary-dark ${className}`}
    >
      {children}
    </span>
  );
}

/** Secondary action — soft sage pill. */
export function BtnSecondary({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary hover:text-secondary-foreground ${className}`}
    >
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold tracking-wide text-secondary-foreground">
      {children}
    </span>
  );
}

export function SectionHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-3xl font-semibold tracking-tight md:text-[2.6rem] md:leading-[1.1] ${className}`}>{children}</h2>;
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Sprout className="h-4 w-4" />
      </span>
      <span className="text-base font-semibold tracking-tight">Fanika</span>
    </span>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode; dark?: boolean }) {
  const { user } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 md:px-6">
          <Link to="/" aria-label="Fanika home"><Wordmark /></Link>

          <nav className="hidden items-center gap-1 rounded-full border border-border bg-card/70 p-1 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  path === n.to
                    ? "bg-secondary font-semibold text-secondary-foreground"
                    : "font-medium text-muted-foreground hover:text-foreground"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {!user && (
              <Link to="/login">
                <span className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
                  Sign in
                </span>
              </Link>
            )}
            <Link to={user ? "/dashboard" : "/signup"}>
              <BtnPrimary className="px-5 py-2.5">{user ? "Open app" : "Get started free"}</BtnPrimary>
            </Link>
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-border/60 bg-background px-5 py-3 md:hidden">
            <nav className="flex flex-col">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-2 py-2.5 text-sm font-medium text-muted-foreground"
                >
                  {n.label}
                </Link>
              ))}
              <div className="mt-3 flex gap-2 border-t border-border/60 pt-3">
                {user ? (
                  <Link to="/dashboard" className="flex-1" onClick={() => setOpen(false)}>
                    <BtnPrimary className="w-full">Open app</BtnPrimary>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
                      <BtnSecondary className="w-full">Sign in</BtnSecondary>
                    </Link>
                    <Link to="/signup" className="flex-1" onClick={() => setOpen(false)}>
                      <BtnPrimary className="w-full">Get started</BtnPrimary>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer id="contact" className="mt-24 border-t border-border/60 bg-surface-soft">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-2 md:px-6">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Personal finance for African households — clear, calm and always reconciled.
            </p>
            <div className="mt-8 flex items-center gap-3 text-muted-foreground">
              {[
                { href: "https://facebook.com", label: "Facebook", Icon: Facebook },
                { href: "https://linkedin.com", label: "LinkedIn", Icon: Linkedin },
                { href: "https://youtube.com", label: "YouTube", Icon: Youtube },
                { href: "https://instagram.com", label: "Instagram", Icon: Instagram },
              ].map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card transition hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <div className="text-sm font-semibold">Product</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link to="/features" className="hover:text-foreground">Features</Link></li>
                <li><Link to="/how-it-works" className="hover:text-foreground">How it works</Link></li>
                <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold">Get started</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link to="/signup" className="hover:text-foreground">Create account</Link></li>
                <li><Link to="/login" className="hover:text-foreground">Sign in</Link></li>
                <li><a href={DEMO_URL} className="hover:text-foreground">Book a demo</a></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold">Company</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground">About</Link></li>
                <li><a href={`mailto:${EMAIL}`} className="break-all hover:text-foreground">{EMAIL}</a></li>
                <li><a href="tel:+254708096833" className="hover:text-foreground">{PHONE_DISPLAY}</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Fanika. All rights reserved.
        </div>
      </footer>
      <AIChatbot />
    </div>
  );
}

/** Contact form — opens the visitor's mail client with a prefilled enquiry. */
export function ContactForm() {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = `${msg}\n\n— ${first} ${last} (${email})`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Enquiry from Fanika")}&body=${encodeURIComponent(body)}`;
  }

  const field =
    "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary";

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold">First name</span>
          <input required value={first} onChange={(e) => setFirst(e.target.value)} placeholder="Jane" className={`mt-1.5 ${field}`} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold">Last name</span>
          <input value={last} onChange={(e) => setLast(e.target.value)} placeholder="Smitherton" className={`mt-1.5 ${field}`} />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-semibold">Email address</span>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className={`mt-1.5 ${field}`} />
      </label>
      <label className="block">
        <span className="text-xs font-semibold">Your message</span>
        <textarea required rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Enter your question or message" className={`mt-1.5 ${field}`} />
      </label>
      <button type="submit" className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-dark">
        Submit
      </button>
    </form>
  );
}
