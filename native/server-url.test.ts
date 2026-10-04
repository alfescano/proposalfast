import { afterEach, describe, expect, it } from "vitest";
import {
  CAPACITOR_APP_ID,
  CAPACITOR_APP_NAME,
  PRODUCTION_SERVER_URL,
  capacitorAllowNavigation,
  resolveCapacitorServerUrl,
} from "./server-url";

describe("capacitor server url", () => {
  const previous = process.env.CAPACITOR_SERVER_URL;

  afterEach(() => {
    if (previous === undefined) delete process.env.CAPACITOR_SERVER_URL;
    else process.env.CAPACITOR_SERVER_URL = previous;
  });

  it("uses the production origin and the store app id by default", () => {
    delete process.env.CAPACITOR_SERVER_URL;
    expect(resolveCapacitorServerUrl(undefined)).toBe(PRODUCTION_SERVER_URL);
    expect(CAPACITOR_APP_ID).toBe("ai.proposalfast.app");
    expect(CAPACITOR_APP_NAME).toBe("ProposalFast");
  });

  it("treats a blank env var as production and drops paths and queries", () => {
    expect(resolveCapacitorServerUrl("  ")).toBe(PRODUCTION_SERVER_URL);
    expect(
      resolveCapacitorServerUrl("https://proposalfast.ai/login?next=/"),
    ).toBe("https://proposalfast.ai");
    expect(resolveCapacitorServerUrl("https://staging.proposalfast.ai/")).toBe(
      "https://staging.proposalfast.ai",
    );
  });

  it("allows a Vercel preview origin for internal staging builds", () => {
    expect(
      resolveCapacitorServerUrl("https://proposalfast-git-main.vercel.app"),
    ).toBe("https://proposalfast-git-main.vercel.app");
  });

  it("rejects cleartext, credentials, and unrelated hosts", () => {
    expect(() => resolveCapacitorServerUrl("http://proposalfast.ai")).toThrow(
      /https/,
    );
    expect(() =>
      resolveCapacitorServerUrl("https://user:pw@proposalfast.ai"),
    ).toThrow(/credentials/);
    expect(() => resolveCapacitorServerUrl("https://example.com")).toThrow(
      /host must be/,
    );
    expect(() =>
      resolveCapacitorServerUrl("https://evilproposalfast.ai"),
    ).toThrow(/host must be/);
    expect(() =>
      resolveCapacitorServerUrl("https://proposalfast.ai.evil.com"),
    ).toThrow(/host must be/);
    expect(() => resolveCapacitorServerUrl("https://vercel.app")).toThrow(
      /host must be/,
    );
    expect(() => resolveCapacitorServerUrl("not a url")).toThrow(
      /not a valid URL/,
    );
  });

  it("keeps ProposalFast, Google sign-in, and Stripe inside the WebView", () => {
    const hosts = capacitorAllowNavigation("https://proposalfast.ai");
    expect(hosts).toContain("proposalfast.ai");
    expect(hosts).toContain("*.proposalfast.ai");
    expect(hosts).toContain("accounts.google.com");
    expect(hosts).toContain("google.com");
    expect(hosts).toContain("checkout.stripe.com");
    expect(hosts).toContain("billing.stripe.com");
    expect(hosts).toContain("stripe.com");
    expect(hosts).not.toContain("*.vercel.app");
  });

  it("adds the preview host when the shell points at Vercel", () => {
    const hosts = capacitorAllowNavigation(
      "https://proposalfast-git-main.vercel.app",
    );
    expect(hosts).toContain("proposalfast-git-main.vercel.app");
    expect(hosts).toContain("*.vercel.app");
  });
});
