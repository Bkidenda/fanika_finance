import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseMessage } from "@/lib/sms-parser";

describe("Airtel Money message parsing", () => {
  it("drafts incoming Airtel alerts with the sender and amount", () => {
    const result = parseMessage(
      "Airtel Money: You have received Ksh 1,200.00 from Jane Doe on 09/11/26 at 10:30 AM. Ref AT12345678",
    );

    assert.equal(result?.source, "Airtel Money");
    assert.equal(result?.direction, "in");
    assert.equal(result?.amount, 1200);
    assert.equal(result?.counterparty, "Jane Doe");
  });
});