import type { MetadataRoute } from "next";
import { getAllPosts, postLastModified } from "@/lib/blog";
import { COMPARISONS } from "@/lib/marketing/comparisons";
import { absoluteUrl } from "@/lib/site";

const routes = [
  "/",
  "/features",
  "/pricing",
  "/templates",
  "/about",
  "/compare",
  ...COMPARISONS.map((item) => `/compare/${item.slug}`),
  "/blog",
  "/contact",
  "/login",
  "/register",
  "/privacy",
  "/terms",
  "/cookie-policy",
  "/security",
  "/refund-policy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = routes.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" || path === "/blog" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/blog" ? 0.7 : 0.6,
  }));

  const posts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: postLastModified(post),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...pages, ...posts];
}
