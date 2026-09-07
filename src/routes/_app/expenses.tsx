import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/expenses")({ head: () => ({ meta: [{ title: "Expenses — Fanika" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/transactions" });
  },
});
