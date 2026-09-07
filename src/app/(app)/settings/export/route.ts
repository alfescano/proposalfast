import { NextResponse } from "next/server";
import { exportWorkspaceData } from "@/lib/account";
import { getCurrentOrgContext } from "@/lib/org";
import { canManageBilling } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getCurrentOrgContext();
  if (!ctx || !canManageBilling(ctx.role)) {
    return NextResponse.json({ error: "Only the workspace owner can export." }, { status: 403 });
  }

  const payload = await exportWorkspaceData(ctx.organization.id, ctx.user.id);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="proposalfast-${ctx.organization.slug}.json"`,
    },
  });
}
