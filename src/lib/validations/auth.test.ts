import { describe, expect, it } from "vitest";
import { changePasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "./auth";

describe("registerSchema", () => {
  it("accepts a complete registration", () => {
    const parsed = registerSchema.parse({
      name: "Alex Rivera",
      email: "Alex@ProposalFast.com",
      password: "StrongPass1",
      organizationName: "Northline Studio",
    });
    expect(parsed.email).toBe("alex@proposefast.com");
  });

  it("rejects a short or weak password", () => {
    const result = registerSchema.safeParse({
      name: "Alex",
      email: "alex@proposefast.com",
      password: "short",
      organizationName: "Northline",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires an email and password", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
    expect(
      loginSchema.safeParse({ email: "alex@proposefast.com", password: "anything" }).success,
    ).toBe(true);
  });
});

describe("changePasswordSchema", () => {
  it("requires the current password and a strong replacement", () => {
    expect(
      changePasswordSchema.safeParse({ currentPassword: "", password: "StrongPass1" }).success,
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({ currentPassword: "OldPassword1", password: "weak" }).success,
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "OldPassword1",
        password: "NewPassword1",
      }).success,
    ).toBe(true);
  });
});

describe("resetPasswordSchema", () => {
  it("requires a token and a strong password", () => {
    expect(
      resetPasswordSchema.safeParse({ token: "abc", password: "StrongPass1" }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({
        token: "a-very-long-reset-token",
        password: "StrongPass1",
      }).success,
    ).toBe(true);
  });
});
