import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { absoluteUrl } from "./site";
import {
  BLOG_INDEX,
  buildRssXml,
  escapeXml,
  formatBlogDate,
  getAllPosts,
  getPostBySlug,
  parseBlogSource,
} from "./blog";

const SEED_SLUGS = [
  "why-proposals-stall-after-send",
  "fact-bound-proposals-vs-invented-numbers",
  "proposal-portal-vs-pdf",
] as const;

const SAMPLE = `---
title: Sample title
description: Sample description for tests.
date: 2026-09-16
---

Body with a [pricing](/pricing) link.
`;

describe("blog catalog", () => {
  it("publishes the three seed posts with unique slugs", () => {
    const posts = getAllPosts();
    expect(posts.map((post) => post.slug).sort()).toEqual(
      [...SEED_SLUGS].sort(),
    );
    expect(new Set(posts.map((post) => post.slug)).size).toBe(3);
  });

  it("sorts newest first", () => {
    const dates = getAllPosts().map((post) => post.date);
    expect(dates).toEqual([...dates].sort((a, b) => (a < b ? 1 : -1)));
  });

  it("returns undefined for unknown or unsafe slugs", () => {
    expect(getPostBySlug("not-a-post")).toBeUndefined();
    expect(getPostBySlug("../about")).toBeUndefined();
    expect(getPostBySlug(SEED_SLUGS[0])?.title).toContain("stall");
  });

  it("formats dates in UTC so YYYY-MM-DD does not shift", () => {
    expect(formatBlogDate("2026-09-10")).toBe("September 10, 2026");
  });

  it("builds an RSS feed with canonical proposalfast.ai URLs", () => {
    const xml = buildRssXml();
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain(absoluteUrl("/blog"));
    expect(xml).toContain(absoluteUrl("/rss.xml"));
    for (const slug of SEED_SLUGS) {
      expect(xml).toContain(absoluteUrl(`/blog/${slug}`));
    }
  });

  it("escapes XML entities in RSS", () => {
    expect(escapeXml(`A & B <c> "d" 'e'`)).toBe(
      "A &amp; B &lt;c&gt; &quot;d&quot; &apos;e&apos;",
    );
  });

  it("includes /blog and each seed post in the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain(absoluteUrl("/blog"));
    for (const slug of SEED_SLUGS) {
      expect(urls).toContain(absoluteUrl(`/blog/${slug}`));
    }
  });
});

describe("blog honesty", () => {
  it("does not invent metrics, logos, or a Dry Run checkout", () => {
    const blob = getAllPosts()
      .map((post) => `${post.title}\n${post.description}\n${post.content}`)
      .concat(BLOG_INDEX.description)
      .join("\n")
      .toLowerCase();

    expect(blob).not.toContain("trusted by");
    expect(blob).not.toContain("testimonial");
    expect(blob).not.toContain("northline");
    expect(blob).not.toContain("dry run");
    expect(blob).not.toContain("$97");
    expect(blob).not.toMatch(/checkout\.stripe\.com/);
    expect(blob).not.toMatch(/\b\d{2,}%\b/);
    expect(blob).toContain("/pricing");
    expect(blob).toContain("/register");
  });

  it("keeps CTAs on site-relative marketing routes", () => {
    const content = getAllPosts()
      .map((post) => post.content)
      .join("\n");
    const hrefs = [...content.matchAll(/\]\(([^)]+)\)/g)].map(
      (match) => match[1],
    );
    expect(hrefs.length).toBeGreaterThan(8);
    for (const href of hrefs) {
      expect(
        href.startsWith("/") || href.startsWith("https://proposalfast.ai"),
      ).toBe(true);
      expect(href).not.toMatch(/stripe\.com/);
    }
  });
});

describe("frontmatter", () => {
  it("parses draft: true so unpublished files can live in-repo", () => {
    const post = parseBlogSource(
      "hello-draft",
      SAMPLE.replace("---\n\n", "draft: true\n---\n\n"),
    );
    expect(post.draft).toBe(true);
    expect(post.title).toBe("Sample title");
  });

  it("throws when a file is missing YAML frontmatter", () => {
    expect(() => parseBlogSource("x", "# Just a heading\n")).toThrow(
      /missing YAML frontmatter/,
    );
  });

  it("throws when date is missing or invalid", () => {
    expect(() =>
      parseBlogSource(
        "x",
        `---
title: Broken
description: Missing date on purpose.
---

Body
`,
      ),
    ).toThrow(/missing frontmatter field "date"/);

    expect(() =>
      parseBlogSource(
        "x",
        `---
title: Broken
description: Bad date on purpose.
date: 16 Sept 2026
---

Body
`,
      ),
    ).toThrow(/invalid date/);
  });
});
