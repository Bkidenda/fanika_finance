import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, Facebook, Linkedin, Youtube, Instagram } from "lucide-react";
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

/** Editorial primary button (template style: solid near-black). */
export function BtnPrimary({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 ${className}`}>
      {children}
    </span>
  );
}

/** Editorial secondary button (template style: light grey). */
export function BtnSecondary({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center justify-center gap-2 rounded-lg bg-muted px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-border ${className}`}>
      {children}
    </span>
  );
}

export function SectionHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-3xl font-bold tracking-tight md:text-4xl ${className}`}>{children}</h2>;
}

export function PublicLayout({ children }: { children: React.ReactNode; dark?: boolean }) {
  const { user } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-base font-bold tracking-tight">Fanika</Link>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`text-sm transition ${path === n.to ? "font-semibold text-foreground" : "font-medium text-muted-foreground hover:text-foreground"}`}
              >
                {n.label}
              </Link>
            ))}
            <Link to={user ? "/dashboard" : "/signup"}>
              <BtnPrimary className="px-4 py-2">{user ? "Open app" : "Get started"}</BtnPrimary>
            </Link>
          </nav>

          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-border/60 bg-background px-6 py-3 md:hidden">
            <nav className="flex flex-col">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2 text-sm font-medium text-muted-foreground">
                  {n.label}
                </Link>
              ))}
              <div className="mt-3 flex gap-2 border-t border-border/60 pt-3">
                {user ? (
                  <Link to="/dashboard" className="flex-1" onClick={() => setOpen(false)}><BtnPrimary className="w-full">Open app</BtnPrimary></Link>
                ) : (
                  <>
                    <Link to="/login" className="flex-1" onClick={() => setOpen(false)}><BtnSecondary className="w-full">Sign in</BtnSecondary></Link>
                    <Link to="/signup" className="flex-1" onClick={() => setOpen(false)}><BtnPrimary className="w-full">Get started</BtnPrimary></Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer id="contact" className="mt-24 border-t border-border/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-2">
          <div>
            <div className="text-base font-bold tracking-tight">Fanika</div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Personal finance, made clear and actionable.
            </p>
            <div className="mt-8 flex items-center gap-4 text-muted-foreground">
              <a href="https://facebook.com" aria-label="Facebook" className="hover:text-foreground"><Facebook className="h-4 w-4" /></a>
              <a href="https://linkedin.com" aria-label="LinkedIn" className="hover:text-foreground"><Linkedin className="h-4 w-4" /></a>
              <a href="https://youtube.com" aria-label="YouTube" className="hover:text-foreground"><Youtube className="h-4 w-4" /></a>
              <a href="https://instagram.com" aria-label="Instagram" className="hover:text-foreground"><Instagram className="h-4 w-4" /></a>
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
                <li><a href={`mailto:${EMAIL}`} className="hover:text-foreground">{EMAIL}</a></li>
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

/** Template contact form — emails the team via the visitor's mail client. */
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

  const field = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground";

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
      <button type="submit" className="w-full rounded-lg bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90">
        Submit
      </button>
    </form>
  );
}
