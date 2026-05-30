import { Link, useRouterState } from "@tanstack/react-router";
import { Sprout, Menu, X, Mail, Phone, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { AIChatbot } from "@/components/ai-chatbot";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/stewardship-philosophy", label: "Stewardship" },
  { to: "/pricing", label: "Pricing" },
] as const;

const EMAIL = "bkidenda@gmail.com";
const PHONE_DISPLAY = "+254 708 096 833";
const PHONE_TEL = "+254708096833";
const WHATSAPP_URL = "https://wa.me/254708096833";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-surface">
      <header className="sticky top-0 z-40 border-b border-primary/20 bg-gradient-to-r from-[oklch(0.45_0.12_180)] via-[oklch(0.52_0.12_175)] to-[oklch(0.58_0.13_185)] text-primary-foreground shadow-card backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
              <Sprout className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight text-primary-foreground">Nuru Steward</span>
          </Link>
          <div className="ml-auto hidden items-center gap-6 lg:flex">
            <nav className="flex items-center gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`rounded-md px-3 py-1.5 text-sm transition ${path === n.to ? "bg-white/20 font-medium text-primary-foreground" : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"}`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              {user ? (
                <Button asChild size="sm" variant="secondary"><Link to="/dashboard">Open app</Link></Button>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"><Link to="/login">Sign in</Link></Button>
                  <Button asChild size="sm" variant="secondary"><Link to="/signup">Get started</Link></Button>
                </>
              )}
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="border-t bg-background lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className={`rounded-md px-3 py-2 text-sm ${path === n.to ? "bg-secondary font-medium text-primary" : "text-muted-foreground"}`}>
                  {n.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-2 border-t pt-3">
                {user ? (
                  <Button asChild className="flex-1"><Link to="/dashboard">Open app</Link></Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="flex-1"><Link to="/login">Sign in</Link></Button>
                    <Button asChild className="flex-1"><Link to="/signup">Get started</Link></Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
      <main>{children}</main>
      <footer id="contact" className="mt-24 border-t bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary"><Sprout className="h-4 w-4 text-primary-foreground" /></div>
              <span className="font-semibold">Nuru Steward</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Personal finance, anchored in stewardship.</p>
          </div>
          <div>
            <div className="text-sm font-semibold">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/features" className="hover:text-foreground">Features</Link></li>
              <li><Link to="/how-it-works" className="hover:text-foreground">How it works</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link to="/stewardship-philosophy" className="hover:text-foreground">Stewardship</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Get started</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/signup" className="hover:text-foreground">Create account</Link></li>
              <li><Link to="/login" className="hover:text-foreground">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Contact</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 hover:text-foreground">
                  <Mail className="h-3.5 w-3.5" /> {EMAIL}
                </a>
              </li>
              <li>
                <a href={`tel:${PHONE_TEL}`} className="flex items-center gap-2 hover:text-foreground">
                  <Phone className="h-3.5 w-3.5" /> {PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-foreground">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
              </li>
            </ul>
            <ContactForm />
          </div>
        </div>
        <div className="border-t py-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Nuru Steward</div>
      </footer>
      <AIChatbot />
    </div>
  );
}

function ContactForm() {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = `Hi Brian,%0D%0A%0D%0A${encodeURIComponent(msg)}%0D%0A%0D%0A— ${encodeURIComponent(name || "Nuru visitor")}`;
    window.location.href = `mailto:${EMAIL}?subject=Question%20from%20Nuru%20Steward&body=${body}`;
  }
  return (
    <form onSubmit={submit} className="mt-4 space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
      />
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Ask a question…"
        rows={3}
        className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
      />
      <button type="submit" className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
        Send
      </button>
    </form>
  );
}
