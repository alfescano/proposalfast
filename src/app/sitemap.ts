import type { MetadataRoute } from "next";
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
  return routes.map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
