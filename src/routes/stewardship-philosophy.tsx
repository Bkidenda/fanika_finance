import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/stewardship-philosophy")({
  beforeLoad: () => {
    throw redirect({ to: "/about" });
  },
});
