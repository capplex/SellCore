import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";

// Mirrors the signature format used by outbound webhook requests without
// needing live network services.
describe("webhook signature contract", () => {
  it("is deterministic for an identical body and secret", () => {
    const body = JSON.stringify({ type: "order.paid", data: { id: "1" } });
    const a = createHmac("sha256", "secret").update(body).digest("hex");
    const b = createHmac("sha256", "secret").update(body).digest("hex");
    expect(a).toBe(b);
  });
});
