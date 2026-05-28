import { Link, useRouterState } from "@tanstack/react-router";
import { Sprout, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/stewardship-philosophy", label: "Stewardship" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-surface">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-card">
              <Sprout className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">Nuru Steward</span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`rounded-md px-3 py-1.5 text-sm transition ${path === n.to ? "bg-secondary font-medium text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <Button asChild size="sm"><Link to="/dashboard">Open app</Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
                <Button asChild size="sm"><Link to="/signup">Get started</Link></Button>
              </>
            )}
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
      <footer className="mt-24 border-t bg-card">
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
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Company</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About</Link></li>
              <li><Link to="/stewardship-philosophy" className="hover:text-foreground">Stewardship</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Get started</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/signup" className="hover:text-foreground">Create account</Link></li>
              <li><Link to="/login" className="hover:text-foreground">Sign in</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t py-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Nuru Steward</div>
      </footer>
    </div>
  );
}
