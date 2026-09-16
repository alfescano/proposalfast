import type { Metadata } from "next";
import Link from "next/link";
import { BlogCta } from "@/components/marketing/blog-cta";
import { BLOG_INDEX, formatBlogDate, getAllPosts } from "@/lib/blog";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: BLOG_INDEX.title,
  description: BLOG_INDEX.description,
  alternates: {
    canonical: absoluteUrl("/blog"),
    types: {
      "application/rss+xml": absoluteUrl("/rss.xml"),
    },
  },
  openGraph: {
    type: "website",
    title: `${BLOG_INDEX.title} · ${siteConfig.name}`,
    description: BLOG_INDEX.description,
    url: absoluteUrl("/blog"),
  },
  twitter: {
    card: "summary_large_image",
    title: `${BLOG_INDEX.title} · ${siteConfig.name}`,
    description: BLOG_INDEX.description,
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-accent text-xs tracking-[0.2em] uppercase">Blog</p>
      <h1 className="font-heading mt-3 text-5xl text-balance">
        Notes on proposals that actually get finished
      </h1>
      <p className="text-muted-foreground mt-4 max-w-2xl text-lg leading-7">
        Written for agencies and consultants. No fake metrics, no invented case
        studies, no logo wall. RSS is at{" "}
        <Link href="/rss.xml" className="text-foreground underline">
          /rss.xml
        </Link>
        .
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="border-border bg-card flex flex-col rounded-2xl border p-6"
          >
            <time
              dateTime={post.date}
              className="text-accent text-xs tracking-[0.16em] uppercase"
            >
              {formatBlogDate(post.date)}
            </time>
            <h2 className="font-heading mt-2 text-2xl text-balance">
              <Link href={`/blog/${post.slug}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
            <p className="text-muted-foreground mt-3 flex-1 text-sm leading-6">
              {post.description}
            </p>
            <Link
              href={`/blog/${post.slug}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "mt-6 h-11 px-4",
              )}
            >
              Read the post
            </Link>
          </article>
        ))}
      </div>

      <BlogCta />
    </main>
  );
}
