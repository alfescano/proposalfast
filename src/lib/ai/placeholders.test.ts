import { describe, expect, it } from "vitest";
import { extractResultSchema, scoreDimensionsSchema } from "./schemas";
import { parseJsonAgainst } from "./service";
import {
  extractPlaceholders,
  localCompleteness,
  mergeScore,
  sanitizeInventedClaims,
} from "./placeholders";

describe("no-hallucination placeholder path", () => {
  it("leaves prices that appear in the brief", () => {
    const facts = [{ key: "fee", value: "$12,000", source: "user" as const }];
    const result = sanitizeInventedClaims("The fee is $12,000 as agreed.", facts);
    expect(result.body).toContain("$12,000");
    expect(result.invented).toHaveLength(0);
  });

  it("replaces invented prices with a placeholder", () => {
    const facts = [{ key: "scope", value: "brand system", source: "user" as const }];
    const result = sanitizeInventedClaims(
      "We typically charge $48,000 and guarantee a 40% increase.",
      facts,
    );
    expect(result.body).toContain("[PLACEHOLDER:");
    expect(result.body).not.toMatch(/\$48,000/);
    expect(result.body).not.toContain("40% increase");
    expect(result.invented.length).toBeGreaterThan(0);
    expect(extractPlaceholders(result.body).length).toBeGreaterThan(0);
  });

  it("scores completeness down when placeholders remain", () => {
    expect(localCompleteness(["Ready to start."])).toBe(100);
    expect(localCompleteness(["Fee: [PLACEHOLDER: pricing]"])).toBeLessThan(90);
  });

  it("merges model dimensions with local completeness", () => {
    const merged = mergeScore(
      {
        completeness: 80,
        fidelity: 100,
        clarity: 90,
        commercialReadiness: 70,
        notes: ["Need a fee"],
      },
      40,
    );
    expect(merged.completeness).toBe(60);
    expect(merged.overall).toBeGreaterThan(0);
    expect(merged.overall).toBeLessThanOrEqual(100);
  });
});

describe("stage JSON validation", () => {
  it("accepts a valid extract payload", () => {
    const parsed = parseJsonAgainst(
      extractResultSchema,
      JSON.stringify({
        facts: [{ key: "client", value: "Harbor", source: "user" }],
        missing: ["fee"],
      }),
    );
    expect(parsed.ok).toBe(true);
  });

  it("rejects invented score shapes so the pipeline can retry", () => {
    const parsed = parseJsonAgainst(scoreDimensionsSchema, `{"completeness":"high"}`);
    expect(parsed.ok).toBe(false);
  });
});
