import { createFileRoute, Outlet, Navigate, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/app/bottom-nav";
import { AIChatbot } from "@/components/ai-chatbot";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [desktopBlocked, setDesktopBlocked] = useState(false);
  const [ready, setReady] = useState(false);

  // Fanika is a mobile app: on large screens show the "get the app" notice.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () =>
      setDesktopBlocked(mq.matches && !window.sessionStorage.getItem("fanika:desktop-allowed"));
    update();
    setReady(true);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // One-time message-detection onboarding after sign-in.
  useEffect(() => {
    if (!user || !ready) return;
    if (path.startsWith("/onboarding")) return;
    if (!window.localStorage.getItem("fanika:detection-onboarded")) {
      void navigate({ to: "/onboarding" });
    }
  }, [user, ready, path, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-page-warm">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;

  if (ready && desktopBlocked) return <DesktopNotice onAllow={() => setDesktopBlocked(false)} />;

  return (
    <div className="min-h-dvh bg-page-warm">
      <main
        className="mx-auto w-full max-w-md px-4 pt-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 112px)" }}
      >
        <Outlet />
      </main>
      <BottomNav />
      <AIChatbot />
    </div>
  );
}

function DesktopNotice({ onAllow }: { onAllow: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-page-warm px-6">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary">
          {/* seedling mark */}
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 20v-7" />
            <path d="M12 13c0-3 2.5-5 6-5 0 3-2.5 5-6 5z" />
            <path d="M12 11C12 8.2 9.8 6 6.5 6c0 2.8 2.2 5 5.5 5z" />
          </svg>
        </div>
        <h1 className="mt-5 font-display text-2xl">Fanika lives on your phone</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The full experience — budgeting, message detection and reports — is designed for mobile.
          Open Fanika on your phone, or explore the website.
        </p>
        <div className="mt-6 space-y-2">
          <Button asChild className="w-full rounded-full">
            <a href="/">Go to the website</a>
          </Button>
          <Button variant="outline" className="w-full rounded-full" onClick={onAllow}>
            Continue on this screen anyway
          </Button>
        </div>
      </div>
    </div>
  );
}
