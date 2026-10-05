import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { extractJson } from "@/lib/advisor.server";

// Lenient numeric: tolerates NaN/Infinity/strings from client-side maths.
const num = z.preprocess((v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; }, z.number());

const AdvisorInput = z.object({
  period: z.string().min(1).max(20),
  context: z.object({
    currency: z.string().default("KES"),
    titheEnabled: z.boolean().optional(),
    net: num,
    disposable: num,
    tithe: num.optional(),
    giving: num.optional(),
    customDeductions: num,
    monthlySpend: num,
    budgetTotal: num,
    savingsRate: num,
    debtRatio: num,
    familySupportRatio: num,
    subscriptionsMonthly: num,
    debtsTotal: num,
    portfolioValue: num,
    topCategories: z.array(z.object({ category: z.string(), amount: num })).max(30).transform((a) => a.slice(0, 15)),
    incomeStreams: num,
  }).passthrough().transform((c) => ({ ...c, tithe: Number(c.tithe ?? c.giving ?? 0) })),
});

export const runAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AdvisorInput.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env['LOVABLE_API_KEY'];




    const { supabase, userId } = context;

    // Pull last 3 closed-month snapshots for trend analysis.
    const { data: closures } = await supabase
      .from("month_closures")
      .select("period, snapshot")
      .eq("user_id", userId)
      .order("period", { ascending: false })
      .limit(3);

    const history = (closures ?? []).map((c) => ({ period: c.period, snapshot: c.snapshot }));

    const titheNote = data.context.titheEnabled
      ? `Tithe is enabled at ~${((data.context.tithe / Math.max(1, data.context.net)) * 100).toFixed(1)}% of net.`
      : `Tithe is NOT enabled — do not assume any giving allocation unless it appears in topCategories.`;

    const system = `You are Fanika — a calm, practical personal finance advisor.
You analyze the user's CURRENT month snapshot plus their last 3 closed-month snapshots and return:
(1) a 0-100 financial health score,
(2) a 2-3 sentence narrative summary that references TRENDS (e.g. "spending up vs prior 3-month average"),
(3) 4-7 specific, actionable recommendations.
Consider: family support obligations, subscription waste, debt risk, savings discipline, and planned giving commitments.
${titheNote}
Tone: warm, direct, never preachy. Currency: ${data.context.currency}.`;

    const userMsg = `Period: ${data.period}

Current snapshot:
${JSON.stringify(data.context, null, 2)}

History (most recent first, up to 3 closed months):
${JSON.stringify(history, null, 2)}`;

    let parsed: { score: number; summary: string; recommendations: Array<{ kind: string; text: string }> };
    try {
    if (!apiKey) throw new Error("no-key");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",

        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report",
              description: "Return structured financial advisory report.",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "integer", minimum: 0, maximum: 100 },
                  summary: { type: "string" },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        kind: { type: "string", enum: ["warn", "good", "info", "action"] },
                        text: { type: "string" },
                      },
                      required: ["kind", "text"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["score", "summary", "recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report" } },
      }),
    });

    if (res.status === 429) throw new Error("The advisor is busy right now — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Top up usage to run new reports.");
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("AI advisor gateway error", res.status, detail.slice(0, 500));
      throw new Error("The advisor could not complete this analysis. Please try again.");
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | null; tool_calls?: Array<{ function: { arguments: string } }> } }>;
    };
    const msg = json.choices?.[0]?.message;
    const raw = msg?.tool_calls?.[0]?.function?.arguments ?? extractJson(msg?.content ?? "");
    if (!raw) throw new Error("The advisor returned an empty report. Please try again.");

    parsed = JSON.parse(raw);
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      if (/busy|credits/i.test(m)) throw err;
      console.error("AI advisor fallback:", m);
      parsed = ruleBasedReport(data.context);
    }
    parsed.score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
    parsed.summary = String(parsed.summary ?? "").slice(0, 2000) || "No summary available.";
    parsed.recommendations = (Array.isArray(parsed.recommendations) ? parsed.recommendations : [])
      .filter((r) => r && typeof r.text === "string")
      .map((r) => ({ kind: ["warn", "good", "info", "action"].includes(r.kind) ? r.kind : "info", text: r.text }))
      .slice(0, 8);


    const { data: row, error } = await supabase
      .from("ai_insights")
      .insert({
        user_id: userId,
        kind: "monthly",
        period: data.period,
        score: parsed.score,
        summary: parsed.summary,
        recommendations: parsed.recommendations,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return row;
  });

// Built-in analysis used when the AI service is unavailable.
function ruleBasedReport(c: { net: number; disposable: number; monthlySpend: number; budgetTotal: number; savingsRate: number; debtRatio: number; familySupportRatio: number; subscriptionsMonthly: number; debtsTotal: number; currency: string }) {
  const recs: Array<{ kind: string; text: string }> = [];
  let score = 60;
  const f = (n: number) => `${c.currency} ${Math.round(n).toLocaleString()}`;
  if (c.savingsRate >= 0.2) { score += 15; recs.push({ kind: "good", text: `You are saving ${(c.savingsRate * 100).toFixed(0)}% of net income — keep it up.` }); }
  else { score -= 10; recs.push({ kind: "action", text: "Aim to save at least 20% of net income; automate a transfer on payday." }); }
  if (c.debtRatio > 0.4) { score -= 20; recs.push({ kind: "warn", text: `Debt repayments take ${(c.debtRatio * 100).toFixed(0)}% of income. Prioritise the highest-interest loan first.` }); }
  else if (c.debtsTotal > 0) recs.push({ kind: "info", text: `Outstanding debt is ${f(c.debtsTotal)}. Keep repayments on schedule.` });
  if (c.budgetTotal > 0 && c.monthlySpend > c.budgetTotal) { score -= 10; recs.push({ kind: "warn", text: `Spending (${f(c.monthlySpend)}) is above your budget (${f(c.budgetTotal)}).` }); }
  if (c.subscriptionsMonthly > 0) recs.push({ kind: "info", text: `Subscriptions cost ${f(c.subscriptionsMonthly)} a month — cancel any you rarely use.` });
  if (c.familySupportRatio > 0.25) recs.push({ kind: "info", text: "Family support is a large share of income; agree a fixed monthly amount." });
  if (recs.length < 4) recs.push({ kind: "action", text: "Build an emergency fund covering 3–6 months of expenses." });
  score = Math.max(0, Math.min(100, score));
  return { score, summary: `Net income ${f(c.net)}, spending ${f(c.monthlySpend)}, disposable ${f(c.disposable)}. This is a quick built-in review based on your figures.`, recommendations: recs };
}
