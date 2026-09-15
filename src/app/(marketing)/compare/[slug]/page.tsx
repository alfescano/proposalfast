import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComparePage } from "@/components/marketing/compare-layout";
import { COMPARISONS, getComparison } from "@/lib/marketing/comparisons";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return COMPARISONS.map((item) => ({ slug: item.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const comparison = getComparison(slug);
  if (!comparison) return { title: "Compare" };
  return {
    title: comparison.title,
    description: comparison.description,
  };
}

export default async function ComparisonPage({ params }: PageProps) {
  const { slug } = await params;
  const comparison = getComparison(slug);
  if (!comparison) notFound();
  return <ComparePage comparison={comparison} />;
}
