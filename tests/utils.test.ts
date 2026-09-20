import { describe, expect, it } from "vitest";
import { formatMoney, slugify, uniqueById } from "../lib/utils";

describe("utility invariants", () => {
  it("deduplicates reviews and other records by stable id", () => {
    const input = [{ id: "a", text: "first" }, { id: "b", text: "second" }, { id: "a", text: "latest" }];
    expect(uniqueById(input)).toEqual([{ id: "a", text: "latest" }, { id: "b", text: "second" }]);
  });
  it("normalizes slugs", () => expect(slugify(" Sell Core / Pro ")).toBe("sell-core-pro"));
  it("formats minor currency units", () => expect(formatMoney(1299, "USD")).toContain("12.99"));
});
