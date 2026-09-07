import { afterEach, describe, expect, it } from "vitest";
import { isPlatformAdminUser, platformAdminEmails } from "./platform-admin";

describe("platform admin gate", () => {
  const previous = process.env.PLATFORM_ADMIN_EMAILS;

  afterEach(() => {
    if (previous === undefined) delete process.env.PLATFORM_ADMIN_EMAILS;
    else process.env.PLATFORM_ADMIN_EMAILS = previous;
  });

  it("treats the platformAdmin flag as sufficient", () => {
    process.env.PLATFORM_ADMIN_EMAILS = "";
    expect(isPlatformAdminUser({ platformAdmin: true, email: "member@studio.com" })).toBe(true);
    expect(isPlatformAdminUser({ platformAdmin: false, email: "member@studio.com" })).toBe(false);
  });

  it("allows listed emails even without the flag", () => {
    process.env.PLATFORM_ADMIN_EMAILS = "ops@proposefast.com,  second@proposefast.com";
    expect(platformAdminEmails()).toEqual(["ops@proposefast.com", "second@proposefast.com"]);
    expect(isPlatformAdminUser({ platformAdmin: false, email: "ops@proposefast.com" })).toBe(true);
  });

  it("does not treat org Admin as platform admin", () => {
    process.env.PLATFORM_ADMIN_EMAILS = "";
    expect(isPlatformAdminUser({ platformAdmin: false, email: "admin@client-org.com" })).toBe(false);
  });
});
