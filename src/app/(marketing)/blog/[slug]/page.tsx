import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCta } from "@/components/marketing/blog-cta";
import { BlogMarkdown } from "@/components/marketing/blog-markdown";
import {
  formatBlogDate,
  getAllPosts,
  getPostBySlug,
  postUrl,
} from "@/lib/blog";
import { siteConfig } from "@/lib/site";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Blog" };
  const url = postUrl(post.slug);
  return {
    title: post.title,
    description: post.description,
    authors: [{ name: siteConfig.founder.name }],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [siteConfig.founder.name],
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const others = getAllPosts().filter((item) => item.slug !== post.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: {
      "@type": "Person",
      name: siteConfig.founder.name,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    mainEntityOfPage: postUrl(post.slug),
    url: postUrl(post.slug),
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="text-accent text-xs tracking-[0.2em] uppercase">
        <Link href="/blog" className="hover:underline">
          Blog
        </Link>
      </p>
      <h1 className="font-heading mt-3 text-5xl text-balance">{post.title}</h1>
      <p className="text-muted-foreground mt-4 text-sm">
        <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
        {" · "}
        {siteConfig.founder.name}
      </p>
      <p className="text-muted-foreground mt-6 text-lg leading-7">
        {post.description}
      </p>

      <BlogMarkdown content={post.content} />

      <BlogCta />

      <nav className="mt-12" aria-label="More blog posts">
        <p className="text-accent text-xs tracking-[0.18em] uppercase">
          More notes
        </p>
        <ul className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap">
          <li>
            <Link
              href="/blog"
              className="hover:text-foreground underline underline-offset-4"
            >
              All posts
            </Link>
          </li>
          {others.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/blog/${item.slug}`}
                className="hover:text-foreground underline underline-offset-4"
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
