import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AdvisorInput = z.object({
  period: z.string().min(1).max(20),
  context: z.object({
    currency: z.string(),
    gross: z.number(),
    netDisposable: z.number(),
    statutory: z.number(),
    paye: z.number(),
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
    if (!apiKey) throw new Error("AI gateway not configured");

    const system = `You are Nuru Steward — a calm, practical personal finance advisor for African households.
You analyze the user's monthly snapshot and return: (1) a 0-100 financial health score, (2) a 2-3 sentence narrative summary, (3) 4-7 specific, actionable recommendations.
Consider: Kenya statutory context (NSSF, SHIF, AHL, PAYE), family support obligations, subscription waste, debt risk, savings discipline, stewardship/tithing.
Tone: warm, direct, never preachy. Currency: ${data.context.currency}.`;

    const userMsg = `Period: ${data.period}\n\nSnapshot:\n${JSON.stringify(data.context, null, 2)}`;

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

    if (res.status === 429) throw new Error("Rate limited — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add funds in Settings → Workspace → Usage.");
    if (!res.ok) throw new Error(`AI gateway error: ${res.status}`);

    const json = await res.json();
    const call = json?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("AI returned no structured report");
    const parsed = JSON.parse(call.function.arguments) as {
      score: number;
      summary: string;
      recommendations: Array<{ kind: string; text: string }>;
    };

    const { supabase, userId } = context;
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
