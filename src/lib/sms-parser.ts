// Parsing of transaction messages (M-PESA, Airtel Money, bank alerts) into
// draft entries. Pure functions — safe on client and server.

export type ParsedDirection = "in" | "out";

export type ParsedMessage = {
  source: "M-PESA" | "Airtel Money" | "Bank alert" | "Unknown";
  direction: ParsedDirection;
  amount: number;
  counterparty: string;
  kind: string;
  reference: string | null;
  occurredAt: string | null;
  fee: number;
  accountHint: string | null;
  categoryGuess: string | null;
  confidence: "high" | "low";
};

const CATEGORY_RULES: [RegExp, string][] = [
  [/naivas|carrefour|quickmart|supermarket|greenies|chandarana|market|dukani|kiosk/i, "Groceries"],
  [/uber|bolt|little cab|matatu|psv|fuel|shell|rubis|total engen|totalenergies|oil(libya|kenya)?|stima docc|parking/i, "Transport"],
  [/kenya power|kplc|token|zuku|go tv|gotv|dstv|startimes|water bill|nairobi water|garbage|rent/i, "Bills"],
  [/safaricom|airtel|fibre|bundles|airtime/i, "Bills"],
  [/java|artcaffe|restaurant|cafe|kfc|mcdonald|burger|pizza|hotel|chicken inn|galito's|kitchen/i, "Eating out"],
  [/school|college|university|tuition|school fee/i, "Education"],
  [/hospital|clinic|pharmacy|medical|chemists|goodlife|dc lab|lancet/i, "Health"],
  [/salary|payroll|wages|invoice|consultancy|freelance|payment for/i, "Income"],
  [/loan|fuliza|m-?shwari|kcb m-?pesa|overdraft/i, "Debt"],
  [/insurance|jab/i, "Insurance"],
  [/church|tithe|offering|giving|donate|charity|harambee/i, "Giving"],
  [/withdraw|atm|agent.*cash|cash.*agent/i, "Cash"],
];

function guessCategory(counterparty: string, kind: string): string | null {
  for (const [re, cat] of CATEGORY_RULES) {
    if (re.test(counterparty) || re.test(kind)) return cat;
  }
  return null;
}

/** Normalise "Ksh1,234.00" / "KES 1,234" / "1,234.00" to a number. */
function parseAmount(raw: string): number {
  return Number(raw.replace(/[,\s]/g, "").replace(/\.00$/, "")) || 0;
}

/** Convert "3/11/26, 6:42 PM" or "3/11/2026" into an ISO timestamp when possible. */
function parseWhen(day: string, month: string, year: string, time?: string): string | null {
  const y = Number(year) < 100 ? 2000 + Number(year) : Number(year);
  const d = Number(day);
  const m = Number(month);
  if (!d || !m || m > 12) return null;
  let hours = 12;
  let minutes = 0;
  if (time) {
    const t = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
    if (t) {
      hours = Number(t[1]);
      minutes = Number(t[2]);
      if (t[3] && /pm/i.test(t[3]) && hours < 12) hours += 12;
      if (t[3] && /am/i.test(t[3]) && hours === 12) hours = 0;
    }
  }
  const dt = new Date(y, m - 1, d, hours, minutes);
  return dt.toISOString();
}

export function parseMessage(text: string): ParsedMessage | null {
  const body = text.replace(/\s+/g, " ").trim();
  if (!body || body.length < 12) return null;

  const source: ParsedMessage["source"] = /m-?pesa/i.test(body)
    ? "M-PESA"
    : /airtel money|airtel/i.test(body)
      ? "Airtel Money"
      : /debit|credit|account|a\/c/i.test(body)
        ? "Bank alert"
        : "Unknown";

  let direction: ParsedDirection | null = null;
  let amount = 0;
  let counterparty = "";
  let kind = "";
  let occurredAt: string | null = null;
  let reference: string | null = null;
  let fee = 0;

  const when = body.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?:,?\s*(\d{1,2}:\d{2})\s*(AM|PM|am|pm)?)?/);
  if (when) occurredAt = parseWhen(when[1], when[2], when[3], when[4]);

  const refMatch =
    body.match(/\b(?:Ref(?:erence)?\.?|Confirmation)\s*[:.]?\s*([A-Z0-9]{6,15})\b/i) ||
    body.match(/\b([A-Z0-9]{10})\. (?=New M-PESA balance|Available)/);

  // M-PESA: sent to / paid to / gave (outgoing)
  const mpesaOut = body.match(/Ksh\.?\s*([\d,]+(?:\.\d{1,2})?)(?:\/-)?\s*(?:sent to|paid to|paid|gave|used)\s+(.+?)(?:\s+on\s+|\s+for\s+|\.$|$)/i);
  // M-PESA: received from (incoming)
  const mpesaIn = body.match(/(?:received|You have received)\s*Ksh\.?\s*([\d,]+(?:\.\d{1,2})?)(?:\/-)?\s*from\s+(.+?)(?:\s+on\s+|\.$|$)/i);
  // M-PESA withdrawal: "Ksh1,000.00 Withdraw Cash at AGENT on ..."
  const mpesaWithdraw = body.match(/Ksh\.?\s*([\d,]+(?:\.\d{1,2})?)\s*(?:withdrawn|withdraw)/i);
  // Bank: "debited by KES X" / "credited with KES X"
  const bankOut = body.match(/(?:debited|charged)\s*(?:by|with|for)?\s*(?:KES|Ksh\.?|Kshs\.?)\s*([\d,]+(?:\.\d{1,2})?)/i);
  const bankIn = body.match(/(?:credited|deposited)\s*(?:with|by)?\s*(?:KES|Ksh\.?|Kshs\.?)\s*([\d,]+(?:\.\d{1,2})?)/i);
  // Airtel: "You have sent Ksh X to NAME" / "You have received Ksh X from NAME"
  const airtelOut = body.match(/(?:You have sent|sent)\s*Ksh\.?\s*([\d,]+(?:\.\d{1,2})?)\s*to\s+(.+?)(?:\s+on\s+|\.$|$)/i);
  const airtelIn = body.match(/(?:You have received|received)\s*Ksh\.?\s*([\d,]+(?:\.\d{1,2})?)\s*from\s+(.+?)(?:\s+on\s+|\.$|$)/i);
  const genericIn = body.match(/(?:received|deposit(?:ed)?|credited)\s*(?:KES|Ksh\.?|Kshs\.?)\s*([\d,]+(?:\.\d{1,2})?)/i);
  const genericOut = body.match(/(?:paid|spent|purchase(?:d)?|bought)\s*(?:KES|Ksh\.?|Kshs\.?)\s*([\d,]+(?:\.\d{1,2})?)/i);

  const feeMatch = body.match(/(?:transaction fee|fee|charges? of)\s*(?:of\s*)?(?:KES|Ksh\.?|Kshs\.?)\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (feeMatch) fee = parseAmount(feeMatch[1]);

  if (mpesaIn) {
    direction = "in"; amount = parseAmount(mpesaIn[1]); counterparty = cleanParty(mpesaIn[2]); kind = "Received";
  } else if (bankIn) {
    direction = "in"; amount = parseAmount(bankIn[1]); kind = "Deposit"; counterparty = bankCounterparty(body) || "Deposit";
  } else if (airtelOut) {
    direction = "out"; amount = parseAmount(airtelOut[1]); counterparty = cleanParty(airtelOut[2]); kind = "Sent";
  } else if (airtelIn) {
    direction = "in"; amount = parseAmount(airtelIn[1]); counterparty = cleanParty(airtelIn[2]); kind = "Received";
  } else if (mpesaOut) {
    direction = "out"; amount = parseAmount(mpesaOut[1]); counterparty = cleanParty(mpesaOut[2]); kind = kindForMpesa(body);
  } else if (mpesaWithdraw) {
    direction = "out"; amount = parseAmount(mpesaWithdraw[1]); kind = "Withdrawal"; counterparty = "Cash (agent)";
  } else if (bankOut) {
    direction = "out"; amount = parseAmount(bankOut[1]); kind = "Debit"; counterparty = bankCounterparty(body) || "Debit";
  } else if (genericIn) {
    direction = "in"; amount = parseAmount(genericIn[1]); kind = "Received"; counterparty = "Incoming";
  } else if (genericOut) {
    direction = "out"; amount = parseAmount(genericOut[1]); kind = "Payment"; counterparty = "Payment";
  }

  if (direction && amount > 0) {
    if (refMatch) reference = refMatch[1].toUpperCase();
    const category = guessCategory(counterparty, kind);
    const accountHint = /m-?pesa/i.test(body) ? "M-PESA" : /airtel money/i.test(body) ? "Airtel Money" : /a\/c|account/i.test(body) ? (body.match(/a\/c\.?\s*(?:no\.?\s*)?([X\d*]{4,})/i)?.[1] ?? null) : null;
    return {
      source,
      direction,
      amount,
      counterparty: counterparty || (direction === "in" ? "Incoming" : "Payment"),
      kind,
      reference,
      occurredAt,
      fee,
      accountHint,
      categoryGuess: direction === "in" ? (category === "Income" || /salary|invoice|payment for/i.test(body) ? "Income" : null) : category,
      confidence: /m-?pesa/i.test(body) || /bank/i.test(source) ? "high" : "low",
    };
  }
  return null;
}

function cleanParty(raw: string): string {
  return raw
    .replace(/\s+(?:on|for)\s+[\d/.:,\s]+(AM|PM)?$/i, "")
    .replace(/\s*\d{2}XX?\d*\s*$/i, "")
    .replace(/\.$/, "")
    .trim();
}

function kindForMpesa(body: string): string {
  if (/buy goods/i.test(body)) return "Buy Goods";
  if (/paybill/i.test(body)) return "Paybill";
  if (/fuliza/i.test(body)) return "Fuliza";
  if (/m-?shwari/i.test(body)) return "M-Shwari";
  if (/send money|sent to/i.test(body)) return "Send money";
  return "Payment";
}

function bankCounterparty(body: string): string | null {
  const to = body.match(/(?:to|for)\s+([A-Z][A-Za-z'&.\- ]{3,30})/);
  return to ? cleanParty(to[1]) : null;
}
