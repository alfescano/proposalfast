"use client";

import { useState } from "react";
import { deleteAccountAction } from "@/actions/account";
import { Button } from "@/components/ui/button";

export function PrivacyPanel() {
  const [confirm, setConfirm] = useState(false);

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
      <h2 className="font-heading text-2xl">Data & account</h2>
      <p className="text-sm text-muted-foreground">
        Export a JSON copy of this workspace (clients, proposals, account) or delete the owner
        account. Deleting the last owner archives the organization and its records.
      </p>
      <div className="flex flex-wrap gap-2">
        <a href="/settings/export">
          <Button type="button" variant="outline" className="h-9 px-4">
            Export JSON
          </Button>
        </a>
        {!confirm ? (
          <Button type="button" variant="ghost" className="h-9 px-4" onClick={() => setConfirm(true)}>
            Delete account
          </Button>
        ) : (
          <form action={deleteAccountAction}>
            <Button type="submit" variant="destructive" className="h-9 px-4">
              Delete my account and this workspace
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
