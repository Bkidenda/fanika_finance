import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/statements")({
  beforeLoad: () => {
    throw redirect({ to: "/reports" });
  },
});
