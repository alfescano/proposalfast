import { describe, expect, it } from "vitest";
import { isSentryEnabled } from "./sentry";

describe("optional Sentry", () => {
  it("is disabled when SENTRY_DSN is unset", () => {
    const previous = process.env.SENTRY_DSN;
    delete process.env.SENTRY_DSN;
    expect(isSentryEnabled()).toBe(false);
    if (previous !== undefined) process.env.SENTRY_DSN = previous;
  });
});
