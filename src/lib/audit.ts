import { prisma } from "@/lib/db";

export async function writeAuditLog(input: {
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipHash?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      organizationId: input.organizationId ?? undefined,
      userId: input.userId ?? undefined,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? undefined,
      metadata: input.metadata as object | undefined,
      ipHash: input.ipHash ?? undefined,
    },
  });
}
