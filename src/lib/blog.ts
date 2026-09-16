import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { absoluteUrl, siteConfig } from "@/lib/site";

/**
 * In-repo markdown blog (no CMS).
 *
 * To publish a new post:
 * 1. Add `content/blog/your-slug.md`. The filename is the URL: `/blog/your-slug`.
 * 2. Start the file with YAML frontmatter: `title`, `description`, `date` (YYYY-MM-DD).
 * 3. Optional: `updated` (YYYY-MM-DD) and `draft: true` to keep a file unpublished.
 * 4. Write CommonMark in the body. Site-relative links like `/pricing` and `/register` are fine.
 *
 * Sitemap, RSS (`/rss.xml`), and the `/blog` index pick up published posts automatically.
 */
export const BLOG_DIR = path.join(process.cwd(), "content/blog");

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated: string | null;
  draft: boolean;
  content: string;
};

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const BLOG_INDEX = {
  title: "Blog",
  description:
    "Notes for agencies and consultants on stalled proposals, fact-bound drafts, and client portals — without invented metrics or case studies.",
};

function parseFrontmatter(
  raw: string,
  slug: string,
): {
  data: Record<string, string>;
  content: string;
} {
  const match = raw.match(FRONTMATTER);
  if (!match) {
    throw new Error(
      `Blog post "${slug}" is missing YAML frontmatter (--- title/description/date ---).`,
    );
  }

  const data: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }

  return { data, content: match[2].trim() };
}

function requireField(
  data: Record<string, string>,
  key: string,
  slug: string,
): string {
  const value = data[key]?.trim();
  if (!value) {
    throw new Error(
      `Blog post "${slug}" is missing frontmatter field "${key}".`,
    );
  }
  return value;
}

function requireIsoDate(value: string, key: string, slug: string): string {
  if (!ISO_DATE.test(value)) {
    throw new Error(
      `Blog post "${slug}" has invalid ${key} "${value}" (use YYYY-MM-DD).`,
    );
  }
  return value;
}

function loadPostFile(filename: string): BlogPost {
  const slug = filename.replace(/\.md$/, "");
  const raw = readFileSync(path.join(BLOG_DIR, filename), "utf8");
  return parseBlogSource(slug, raw);
}

export function parseBlogSource(slug: string, raw: string): BlogPost {
  const { data, content } = parseFrontmatter(raw, slug);
  const date = requireIsoDate(requireField(data, "date", slug), "date", slug);
  const updated = data.updated
    ? requireIsoDate(data.updated, "updated", slug)
    : null;

  return {
    slug,
    title: requireField(data, "title", slug),
    description: requireField(data, "description", slug),
    date,
    updated,
    draft: data.draft === "true",
    content,
  };
}

function listMarkdownFiles(): string[] {
  return readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .sort();
}

export function getAllPosts({ includeDrafts = false } = {}): BlogPost[] {
  return listMarkdownFiles()
    .map(loadPostFile)
    .filter((post) => includeDrafts || !post.draft)
    .sort((a, b) => {
      if (a.date === b.date) return a.slug.localeCompare(b.slug);
      return a.date < b.date ? 1 : -1;
    });
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return undefined;
  return getAllPosts().find((post) => post.slug === slug);
}

export function formatBlogDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00.000Z`));
}

export function postUrl(slug: string): string {
  return absoluteUrl(`/blog/${slug}`);
}

export function postLastModified(post: BlogPost): Date {
  return new Date(`${post.updated ?? post.date}T00:00:00.000Z`);
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildRssXml(posts: BlogPost[] = getAllPosts()): string {
  const latest = posts[0];
  const lastBuild = latest
    ? new Date(`${latest.date}T12:00:00.000Z`).toUTCString()
    : new Date().toUTCString();

  const items = posts
    .map((post) => {
      const url = postUrl(post.slug);
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(`${post.date}T12:00:00.000Z`).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${siteConfig.name} Blog`)}</title>
    <link>${absoluteUrl("/blog")}</link>
    <description>${escapeXml(BLOG_INDEX.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${absoluteUrl("/rss.xml")}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}
