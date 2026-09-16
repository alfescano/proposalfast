import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COMPARE_INDEX, COMPARISONS, getComparison } from "./comparisons";

describe("comparison catalog", () => {
  it("covers PandaDoc, Qwilr, and Proposify once each", () => {
    expect(COMPARISONS.map((item) => item.slug)).toEqual([
      "pandadoc",
      "qwilr",
      "proposify",
    ]);
    expect(new Set(COMPARISONS.map((item) => item.competitor)).size).toBe(3);
  });

  it("returns undefined for unknown slugs", () => {
    expect(getComparison("docu-sign")).toBeUndefined();
    expect(getComparison("pandadoc")?.competitor).toBe("PandaDoc");
  });

  it("does not invent competitor prices or a win-every-dimension claim", () => {
    const blob = JSON.stringify({ index: COMPARE_INDEX, pages: COMPARISONS });
    expect(blob).not.toMatch(/\$\d/);
    expect(blob.toLowerCase()).not.toContain("trusted by");
    expect(blob.toLowerCase()).not.toContain("better than");
    expect(blob.toLowerCase()).not.toContain("northline");
  });
});

describe("marketing honesty", () => {
  const files = [
    "src/app/(marketing)/page.tsx",
    "src/app/(marketing)/about/page.tsx",
    "src/app/(marketing)/compare/page.tsx",
    "src/app/(marketing)/compare/[slug]/page.tsx",
    "src/components/marketing/trust-section.tsx",
    "src/components/marketing/compare-layout.tsx",
    "src/components/marketing/header.tsx",
    "src/components/marketing/footer.tsx",
    "src/components/marketing/blog-cta.tsx",
    "src/app/(marketing)/blog/page.tsx",
    "src/app/(marketing)/blog/[slug]/page.tsx",
  ];

  it("does not ship fake logos, testimonials, or customer counts", () => {
    const source = files.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(source.toLowerCase()).not.toContain("trusted by");
    expect(source.toLowerCase()).not.toContain("testimonial");
    expect(source.toLowerCase()).not.toContain("customer logo");
    expect(source).not.toMatch(/\b\d{2,},\d{3}\+?\b/);
    expect(source).not.toContain("Northline Studio");
  });

  it("links About, Compare, and Blog from the marketing header and footer", () => {
    const header = readFileSync("src/components/marketing/header.tsx", "utf8");
    const footer = readFileSync("src/components/marketing/footer.tsx", "utf8");
    expect(header).toContain('href: "/about"');
    expect(header).toContain('href: "/compare"');
    expect(header).toContain('href: "/blog"');
    expect(footer).toContain('href: "/about"');
    expect(footer).toContain('href: "/compare"');
    expect(footer).toContain('href: "/blog"');
  });
});
