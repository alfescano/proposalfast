"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { deleteAccountCascade } from "@/lib/account";
import { requireOrg } from "@/lib/org";

export async function deleteAccountAction() {
  const ctx = await requireOrg("OWNER");
  await deleteAccountCascade({
    userId: ctx.user.id,
    organizationId: ctx.organization.id,
  });
  await signOut({ redirectTo: "/" });
  redirect("/");
}
