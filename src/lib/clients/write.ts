import { prisma } from "@/lib/db";
import { TenantError } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";

export type ClientWriteInput = {
  name: string;
  email?: string;
  company?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  notes?: string | null;
};

export async function getClientForOrg(organizationId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId, deletedAt: null },
  });
  if (!client) throw new TenantError();
  return client;
}

export async function updateClientForOrg(
  organizationId: string,
  clientId: string,
  data: ClientWriteInput,
) {
  await getClientForOrg(organizationId, clientId);
  return prisma.client.update({
    where: { id: clientId },
    data: {
      name: data.name,
      email: data.email,
      company: data.company || null,
      phone: data.phone || null,
      website: data.website || null,
      address: data.address || null,
      notes: data.notes || null,
    },
  });
}

export async function deleteClientForOrg(
  organizationId: string,
  clientId: string,
  userId?: string,
) {
  await getClientForOrg(organizationId, clientId);
  await prisma.client.update({
    where: { id: clientId },
    data: { deletedAt: new Date() },
  });
  await writeAuditLog({
    organizationId,
    userId,
    action: "client.deleted",
    entityType: "Client",
    entityId: clientId,
  });
}
