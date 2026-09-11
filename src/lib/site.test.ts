import { afterEach, describe, expect, it, vi } from "vitest";

describe("siteConfig", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("uses proposalfast.ai as the public domain and support inbox", async () => {
    const { siteConfig } = await import("./site");
    expect(siteConfig.domain).toBe("proposalfast.ai");
    expect(siteConfig.supportEmail).toBe("support@proposalfast.ai");
    expect(siteConfig.email).toBe("support@proposalfast.ai");
  });

  it("builds Auth/Stripe/OG URLs from NEXT_PUBLIC_APP_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://proposalfast.ai");
    const { absoluteUrl } = await import("./site");
    expect(absoluteUrl("/api/webhooks/stripe")).toBe(
      "https://proposalfast.ai/api/webhooks/stripe",
    );
    expect(absoluteUrl("/settings?billing=success")).toBe(
      "https://proposalfast.ai/settings?billing=success",
    );
    expect(absoluteUrl("/pricing?billing=canceled")).toBe(
      "https://proposalfast.ai/pricing?billing=canceled",
    );
  });

  it("defaults url to https://proposalfast.ai when the env var is empty", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    const { siteConfig, absoluteUrl } = await import("./site");
    expect(siteConfig.url).toBe("https://proposalfast.ai");
    expect(absoluteUrl("/sitemap.xml")).toBe("https://proposalfast.ai/sitemap.xml");
  });
});
