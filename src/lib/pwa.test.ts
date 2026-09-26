import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isInstallHintPath, isMarketingPath } from "./pwa";

describe("install hint paths", () => {
  it("shows on marketing and workspace pages", () => {
    expect(isInstallHintPath("/")).toBe(true);
    expect(isInstallHintPath("/pricing")).toBe(true);
    expect(isInstallHintPath("/dashboard")).toBe(true);
    expect(isInstallHintPath("/proposals/new")).toBe(true);
    expect(isInstallHintPath("/settings")).toBe(true);
  });

  it("stays off auth, admin, and the public client portal", () => {
    expect(isInstallHintPath("/login")).toBe(false);
    expect(isInstallHintPath("/register")).toBe(false);
    expect(isInstallHintPath("/invite/abc")).toBe(false);
    expect(isInstallHintPath("/admin")).toBe(false);
    expect(isInstallHintPath("/p/public-id")).toBe(false);
  });

  it("does not treat pricing or proposals as the public portal", () => {
    expect(isInstallHintPath("/pricing")).toBe(true);
    expect(isInstallHintPath("/proposals")).toBe(true);
  });
});

describe("marketing paths", () => {
  it("matches pages that render the cookie banner", () => {
    expect(isMarketingPath("/")).toBe(true);
    expect(isMarketingPath("/blog/how-to-write")).toBe(true);
    expect(isMarketingPath("/compare/proposalfast-vs-panda")).toBe(true);
    expect(isMarketingPath("/dashboard")).toBe(false);
    expect(isMarketingPath("/login")).toBe(false);
  });
});

describe("service worker", () => {
  it("passes API, auth, and document navigations through without caching", () => {
    const source = readFileSync(path.join(process.cwd(), "public/sw.js"), "utf8");
    expect(source).toContain('path.startsWith("/api/")');
    expect(source).toContain('request.mode === "navigate"');
    expect(source).toContain("function networkFirst");
    expect(source).not.toContain("cache.addAll");
  });
});
