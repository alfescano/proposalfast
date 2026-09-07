"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertPlanCapacity, requireWritableOrg } from "@/lib/org";
import { writeAuditLog } from "@/lib/audit";
import { deleteClientForOrg, updateClientForOrg } from "@/lib/clients/write";
import { clientSchema } from "@/lib/validations/client";

export async function createClientAction(formData: FormData) {
  const ctx = await requireWritableOrg();
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    phone: formData.get("phone"),
    website: formData.get("website"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  await assertPlanCapacity(ctx.organization.id, "clients");

  const client = await prisma.client.create({
    data: {
      organizationId: ctx.organization.id,
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company || null,
      phone: parsed.data.phone || null,
      website: parsed.data.website || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
    },
  });

  await writeAuditLog({
    organizationId: ctx.organization.id,
    userId: ctx.user.id,
    action: "client.created",
    entityType: "Client",
    entityId: client.id,
  });

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { ok: true as const, id: client.id };
}

export async function updateClientAction(clientId: string, formData: FormData) {
  const ctx = await requireWritableOrg();
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    phone: formData.get("phone"),
    website: formData.get("website"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  await updateClientForOrg(ctx.organization.id, clientId, parsed.data);
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { ok: true as const };
}

export async function deleteClientAction(clientId: string) {
  const ctx = await requireWritableOrg();
  await deleteClientForOrg(ctx.organization.id, clientId, ctx.user.id);
  revalidatePath("/clients");
  return { ok: true as const };
}
