import { describe, expect, it } from "vitest";
import { shouldSeedSampleData } from "./seed-policy";

describe("sample seed policy", () => {
  it("never seeds demo users in production, even if SEED_SAMPLE_DATA=true", () => {
    expect(
      shouldSeedSampleData({ NODE_ENV: "production", SEED_SAMPLE_DATA: "true" }),
    ).toBe(false);
    expect(
      shouldSeedSampleData({ VERCEL_ENV: "production", SEED_SAMPLE_DATA: "true" }),
    ).toBe(false);
  });

  it("seeds locally unless explicitly disabled", () => {
    expect(shouldSeedSampleData({ NODE_ENV: "development" })).toBe(true);
    expect(shouldSeedSampleData({ NODE_ENV: "test", SEED_SAMPLE_DATA: "true" })).toBe(true);
    expect(shouldSeedSampleData({ NODE_ENV: "development", SEED_SAMPLE_DATA: "false" })).toBe(
      false,
    );
  });
});
