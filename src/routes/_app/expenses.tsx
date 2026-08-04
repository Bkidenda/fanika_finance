import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/expenses")({
  beforeLoad: () => {
    throw redirect({ to: "/transactions" });
  },
});
