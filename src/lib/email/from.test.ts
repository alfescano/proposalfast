import { describe, expect, it } from "vitest";
import { parseResendFromEmail } from "./from";
import { authJsErrorFromUrl, isNextRedirectError, messageForAuthJsError } from "@/lib/auth/next-redirect";

describe("parseResendFromEmail", () => {
  it("accepts a bare address and a display-name address", () => {
    expect(parseResendFromEmail("noreply@proposefast.com")).toEqual({
      ok: true,
      from: "noreply@proposefast.com",
    });
    expect(parseResendFromEmail("ProposalFast <noreply@proposefast.com>")).toEqual({
      ok: true,
      from: "ProposalFast <noreply@proposefast.com>",
    });
  });

  it("rejects empty, nameless, and header-injection values", () => {
    expect(parseResendFromEmail("").ok).toBe(false);
    expect(parseResendFromEmail("ProposalFast").ok).toBe(false);
    expect(parseResendFromEmail("ProposalFast <noreply@proposefast.com>\nBcc: a@b.com").ok).toBe(
      false,
    );
  });
});

describe("Auth.js login error URLs", () => {
  it("maps CredentialsSignin so the login form is not blank", () => {
    expect(authJsErrorFromUrl("/login?error=CredentialsSignin")).toBe(
      "Email or password is incorrect.",
    );
    expect(messageForAuthJsError("Configuration")).toMatch(/AUTH_SECRET/);
    expect(isNextRedirectError({ digest: "NEXT_REDIRECT;replace;/dashboard" })).toBe(true);
    expect(isNextRedirectError(new Error("nope"))).toBe(false);
  });
});
