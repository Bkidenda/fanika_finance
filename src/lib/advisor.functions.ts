import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AdvisorInput = z.object({
  period: z.string().min(1).max(20),
  context: z.object({
    currency: z.string(),
    titheEnabled: z.boolean().optional(),
    net: z.number(),
    disposable: z.number(),
    tithe: z.number(),
    customDeductions: z.number(),
    monthlySpend: z.number(),
    budgetTotal: z.number(),
    savingsRate: z.number(),
    debtRatio: z.number(),
    familySupportRatio: z.number(),
    subscriptionsMonthly: z.number(),
    debtsTotal: z.number(),
    portfolioValue: z.number(),
    topCategories: z.array(z.object({ category: z.string(), amount: z.number() })).max(15),
    incomeStreams: z.number(),
  }),
});

export const runAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AdvisorInput.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI advisor is not configured yet. Please try again later.");


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
Consider: family support obligations, subscription waste, debt risk, savings discipline, stewardship/giving.
${titheNote}
Tone: warm, direct, never preachy. Currency: ${data.context.currency}.`;

    const userMsg = `Period: ${data.period}

Current snapshot:
${JSON.stringify(data.context, null, 2)}

History (most recent first, up to 3 closed months):
${JSON.stringify(history, null, 2)}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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

    let parsed: { score: number; summary: string; recommendations: Array<{ kind: string; text: string }> };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("The advisor returned an unreadable report. Please try again.");
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
