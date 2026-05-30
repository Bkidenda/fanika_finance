import { createFileRoute, Navigate } from "@tanstack/react-router";

// The legacy "Income Streams" page has been merged with "Income Entries"
// (the only source that actually reconciles to account balances).
export const Route = createFileRoute("/_app/income")({
  component: () => <Navigate to="/income-entries" replace />,
});
