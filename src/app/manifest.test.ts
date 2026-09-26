import { describe, expect, it } from "vitest";
import manifest from "./manifest";
import { siteConfig } from "@/lib/site";

describe("web app manifest", () => {
  it("describes an installable standalone ProposalFast app", () => {
    const data = manifest();

    expect(data.name).toBe("ProposalFast");
    expect(data.short_name).toBe("ProposalFast");
    expect(data.short_name?.length).toBeLessThanOrEqual(12);
    expect(data.start_url).toBe("/");
    expect(data.scope).toBe("/");
    expect(data.display).toBe("standalone");
    expect(data.theme_color).toBe(siteConfig.themeColor);
    expect(data.background_color).toBe(siteConfig.backgroundColor);
    expect(data.prefer_related_applications).toBe(false);

    const icons = data.icons ?? [];
    expect(icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192", purpose: "any", type: "image/png" }),
        expect.objectContaining({ sizes: "512x512", purpose: "any", type: "image/png" }),
        expect.objectContaining({ sizes: "192x192", purpose: "maskable", type: "image/png" }),
        expect.objectContaining({ sizes: "512x512", purpose: "maskable", type: "image/png" }),
      ]),
    );
  });
});
