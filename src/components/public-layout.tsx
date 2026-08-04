import { Link, useRouterState } from "@tanstack/react-router";
import { Sprout, Menu, X, Mail, Phone, MessageCircle, Calendar } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { AIChatbot } from "@/components/ai-chatbot";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/stewardship-philosophy", label: "Our Philosophy" },
  { to: "/pricing", label: "Pricing" },
] as const;

const EMAIL = "bkidenda@gmail.com";
const PHONE_DISPLAY = "+254 708 096 833";
const PHONE_TEL = "+254708096833";
const WHATSAPP_URL = "https://wa.me/254708096833";
const DEMO_MAILTO = "https://calendly.com/bkidenda/30min?back=1&month=2026-06";

export function PublicLayout({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  const { user } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className={`min-h-screen overflow-x-hidden ${dark ? "bg-ink text-ink-fg" : "bg-gradient-surface"}`}>


      {/* Fixed wordmark, top-left, NOT part of floating pill */}
      <div className="fixed left-6 top-5 z-50">
        <Link
          to="/"
          className={`magnetic flex items-center gap-2 rounded-2xl px-3 py-2 shadow-card ring-1 backdrop-blur ${dark ? "bg-ink-soft/90 ring-ink-line" : "bg-card/95 ring-border"}`}
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${dark ? "bg-gradient-to-br from-gold-soft to-gold text-ink" : "bg-gradient-primary text-primary-foreground"}`}>
            <Sprout className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">Fanika</span>
        </Link>
      </div>

      {/* Floating navbar — links left, CTAs far right */}
      <header className="fixed inset-x-0 top-4 z-40 px-3">
        <div className={`mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] items-center justify-between gap-3 rounded-full border px-3 py-2 shadow-elevated backdrop-blur-xl md:gap-6 md:ml-auto md:mr-6 ${dark ? "border-ink-line bg-ink-soft/80 text-ink-fg" : "border-white/15 bg-gradient-hero text-primary-foreground"}`}>
          <nav className="hidden items-center gap-1 lg:flex">

            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`magnetic rounded-full px-3 py-1.5 text-sm transition ${
                  path === n.to
                    ? dark ? "bg-gold/15 font-medium text-gold-soft" : "bg-white/20 font-medium"
                    : dark ? "text-ink-muted hover:bg-gold/10 hover:text-ink-fg" : "text-primary-foreground/85 hover:bg-white/10"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-1.5 lg:flex">
            <Button asChild size="sm" variant="ghost" className={dark ? "magnetic text-ink-fg hover:bg-gold/10 hover:text-gold-soft" : "magnetic text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"}>
              <a href={DEMO_MAILTO}><Calendar className="mr-1 h-3.5 w-3.5" /> Book demo</a>
            </Button>
            {user ? (
              <Button asChild size="sm" variant="secondary" className={dark ? "magnetic bg-gold text-ink hover:bg-gold-soft" : "magnetic"}><Link to="/dashboard">Open app</Link></Button>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost" className={dark ? "magnetic text-ink-fg hover:bg-gold/10 hover:text-gold-soft" : "magnetic text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"}><Link to="/login">Sign in</Link></Button>
                <Button asChild size="sm" variant="secondary" className={dark ? "magnetic bg-gold text-ink hover:bg-gold-soft" : "magnetic"}><Link to="/signup">Get started</Link></Button>
              </>
            )}
          </div>

          <button className="rounded-full px-3 py-1.5 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className={`mx-auto mt-2 max-w-3xl rounded-2xl border p-3 shadow-elevated lg:hidden ${dark ? "border-ink-line bg-ink-soft" : "bg-card"}`}>
            <nav className="flex flex-col gap-1">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className={`rounded-md px-3 py-2 text-sm ${path === n.to ? "bg-secondary font-medium text-primary" : "text-muted-foreground"}`}>
                  {n.label}
                </Link>
              ))}
              <a href={DEMO_MAILTO} className="rounded-md px-3 py-2 text-sm text-muted-foreground">Book a free demo</a>
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

      <div className="h-24" />

      <main>{children}</main>

      <footer id="contact" className={`mt-24 hidden border-t md:block ${dark ? "border-ink-line bg-ink-soft" : "bg-card"}`}>
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary"><Sprout className="h-4 w-4 text-primary-foreground" /></div>
              <span className="font-semibold">Fanika</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Personal finance, anchored in discipline.</p>
          </div>
          <div>
            <div className="text-sm font-semibold">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/features" className="hover:text-foreground">Features</Link></li>
              <li><Link to="/how-it-works" className="hover:text-foreground">How it works</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link to="/stewardship-philosophy" className="hover:text-foreground">Our Philosophy</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Get started</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/signup" className="hover:text-foreground">Create account</Link></li>
              <li><Link to="/login" className="hover:text-foreground">Sign in</Link></li>
              <li><a href={DEMO_MAILTO} className="hover:text-foreground">Book a free demo</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Contact</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href={`mailto:${EMAIL}`} className="flex items-center gap-2 hover:text-foreground"><Mail className="h-3.5 w-3.5" /> {EMAIL}</a></li>
              <li><a href={`tel:${PHONE_TEL}`} className="flex items-center gap-2 hover:text-foreground"><Phone className="h-3.5 w-3.5" /> {PHONE_DISPLAY}</a></li>
              <li><a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-foreground"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a></li>
            </ul>
            <ContactForm />
          </div>
        </div>
        <div className="border-t py-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Fanika</div>
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
    const body = `Hi Brian,%0D%0A%0D%0A${encodeURIComponent(msg)}%0D%0A%0D%0A— ${encodeURIComponent(name || "Fanika visitor")}`;
    window.location.href = `mailto:${EMAIL}?subject=Question%20from%20Fanika&body=${body}`;
  }
  return (
    <form onSubmit={submit} className="mt-4 space-y-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-md border bg-background px-2 py-1.5 text-xs" />
      <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Ask a question…" rows={3} className="w-full rounded-md border bg-background px-2 py-1.5 text-xs" />
      <button type="submit" className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">Send</button>
    </form>
  );
}
