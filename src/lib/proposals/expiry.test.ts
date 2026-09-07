import { describe, expect, it } from "vitest";
import { isProposalExpired, proposalExpiresAt, statusAfterExtend, statusAfterExpiry } from "./expiry";

describe("proposal expiry", () => {
  it("uses expiresAt over validUntil", () => {
    const expiresAt = new Date("2026-10-01T00:00:00Z");
    expect(
      proposalExpiresAt({ expiresAt, validUntil: new Date("2026-09-01T00:00:00Z") }),
    ).toEqual(expiresAt);
  });

  it("treats a past expiresAt as expired unless signed", () => {
    const past = new Date("2020-01-01T00:00:00Z");
    expect(
      isProposalExpired({ expiresAt: past, validUntil: null, status: "SENT", lockedAt: null }),
    ).toBe(true);
    expect(
      isProposalExpired({ expiresAt: past, validUntil: null, status: "SIGNED", lockedAt: null }),
    ).toBe(false);
  });

  it("does not expire when no date is set", () => {
    expect(
      isProposalExpired({ expiresAt: null, validUntil: null, status: "SENT", lockedAt: null }),
    ).toBe(false);
  });

  it("maps expiry and extend statuses", () => {
    expect(statusAfterExpiry("VIEWED")).toBe("EXPIRED");
    expect(statusAfterExpiry("SIGNED")).toBe("SIGNED");
    expect(statusAfterExtend({ status: "EXPIRED", viewedAt: new Date() })).toBe("VIEWED");
    expect(statusAfterExtend({ status: "EXPIRED", viewedAt: null })).toBe("SENT");
  });
});
