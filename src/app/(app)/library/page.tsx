import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/org";

export const metadata: Metadata = { title: "Templates" };

export default async function LibraryPage() {
  const ctx = await requireOrg();
  const templates = await prisma.proposalTemplate.findMany({
    where: {
      deletedAt: null,
      OR: [{ isSystem: true }, { organizationId: ctx.organization.id }],
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs tracking-[0.18em] text-accent uppercase">Templates</p>
      <h1 className="mt-2 font-heading text-4xl">Structures you can start from</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        System templates are seeded for every workspace. They already contain [PLACEHOLDER] tokens
        for fees and dates.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <article key={template.id} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs tracking-[0.14em] text-accent uppercase">
              {template.isSystem ? "System" : "Workspace"} · {template.category}
            </p>
            <h2 className="mt-2 font-heading text-2xl">{template.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{template.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
