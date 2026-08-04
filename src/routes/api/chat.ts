import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(40),
});

const SYSTEM = `You are the Fanika assistant — a warm, concise helper for a personal finance app that starts from the user's NET take-home income (so it works in any country, in any currency).

What the app does:
- Budgets grouped by Essentials / Family / Lifestyle / Financial.
- Expenses logged against budget categories (or flagged as Emergency).
- Multi-account tracking: bank, mobile money (M-Pesa etc.), SACCO, cash. Net worth = accounts + investments − debts.
- Formal & informal debts (incl. loans from friends/family) with repayment plans.
- Subscriptions tracker.
- Tithing automated at 10% of net income.
- Monthly close & reconciliation, plus historical view.
- An AI Advisor that produces monthly health reports.
- Daily money insights: a short daily insight and motivation to keep financial habits on track.

Style:
- Reply in 2-5 short sentences unless asked for detail.
- Never invent statutory rules (we removed PAYE/NSSF/SHIF logic — the app is country-agnostic).
- If a question is outside personal finance or app help, politely redirect.
- For account help, point to the right page (e.g. "open Settings to set net income").

Contact when the user wants a human: bkidenda@gmail.com · +254 708 096 833 (also on WhatsApp).`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env['LOVABLE_API_KEY'];
        if (!apiKey) return new Response("AI gateway not configured", { status: 500 });

        let parsed;
        try {
          parsed = Schema.parse(await request.json());
        } catch (e) {
          return new Response(`Bad request: ${(e as Error).message}`, { status: 400 });
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.6-flash",

            messages: [
              { role: "system", content: SYSTEM },
              ...parsed.messages,
            ],
          }),
        });

        if (upstream.status === 429) return new Response("Rate limited — try again shortly.", { status: 429 });
        if (upstream.status === 402) return new Response("AI credits exhausted.", { status: 402 });
        if (!upstream.ok) return new Response(`Upstream error: ${upstream.status}`, { status: 502 });

        const json = (await upstream.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const reply = json.choices?.[0]?.message?.content?.trim() ?? "Sorry, I couldn't generate a reply.";
        return new Response(JSON.stringify({ reply }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
