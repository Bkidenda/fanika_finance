import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type EmailReportInput = {
  type: string;
  period: string;
  title: string;
  summaryRows?: { label: string; value: string }[];
};

/**
 * Attempts to email the current user a copy of a generated report. This talks
 * to a transactional-email route that isn't wired up on the backend yet, so
 * failures (network errors or non-2xx responses) are swallowed and surfaced
 * as a friendly toast instead of crashing the report flow.
 */
export async function emailReport(input: EmailReportInput): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const email = sessionData.session?.user?.email;

    if (!token || !email) {
      toast.error("Sign in again to email this report.");
      return false;
    }

    const res = await fetch("/lovable/email/transactional/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        templateName: "financial-report",
        recipientEmail: email,
        idempotencyKey: `report-${input.type}-${input.period}-${Date.now()}`,
        templateData: {
          title: input.title,
          period: input.period,
          summaryRows: input.summaryRows ?? [],
        },
      }),
    });

    if (!res.ok) throw new Error(`Email send failed with status ${res.status}`);

    toast.success("Report emailed to you");
    return true;
  } catch (e) {
    console.error(e);
    toast("Email delivery isn't set up yet — your report is ready to download.");
    return false;
  }
}
