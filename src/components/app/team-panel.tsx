"use client";

import { useState } from "react";
import type { Role } from "@prisma/client";
import {
  inviteMemberAction,
  removeMemberAction,
  revokeInviteAction,
  updateMemberRoleAction,
} from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/states/error-state";

type Member = {
  id: string;
  role: Role;
  email: string;
  name: string | null;
  isSelf: boolean;
};

type Invite = {
  id: string;
  email: string;
  role: Role;
  expiresAt: Date | string;
};

export function TeamPanel({
  members,
  invites,
  canManage,
  isOwner,
}: {
  members: Member[];
  invites: Invite[];
  canManage: boolean;
  isOwner: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function invite(formData: FormData) {
    setError(null);
    const result = await inviteMemberAction(formData);
    if (!result.ok) setError(result.error);
    else setMessage("Invite sent. The link also appears in the server log if Resend is unset.");
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="font-heading text-2xl">Team</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Owner, Admin, Member, and Viewer are enforced on the server — not only hidden in the UI.
        </p>
      </div>
      {error ? <ErrorState description={error} /> : null}
      {message ? <p className="text-sm">{message}</p> : null}

      <ul className="divide-y divide-border rounded-xl border border-border">
        {members.map((member) => (
          <li key={member.id} className="flex flex-col gap-2 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">
                {member.name || member.email}
                {member.isSelf ? " (you)" : ""}
              </p>
              <p className="text-xs text-muted-foreground">{member.email}</p>
            </div>
            {canManage && !member.isSelf ? (
              <div className="flex gap-2">
                <select
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  defaultValue={member.role}
                  aria-label={`Role for ${member.email}`}
                  onChange={async (event) => {
                    const role = event.target.value as Role;
                    const result = await updateMemberRoleAction(member.id, role);
                    if (result && "error" in result && result.error) setError(result.error);
                  }}
                >
                  {isOwner ? <option value="OWNER">Owner</option> : null}
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Member</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeMemberAction(member.id)}>
                  Remove
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{member.role}</p>
            )}
          </li>
        ))}
      </ul>

      {invites.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium">Pending invites</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between">
                <span>
                  {invite.email} · {invite.role}
                </span>
                {canManage ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => revokeInviteAction(invite.id)}>
                    Revoke
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {canManage ? (
        <form action={invite} className="grid gap-3 sm:grid-cols-[1fr_8rem_auto]">
          <div className="space-y-1">
            <Label htmlFor="invite-email">Invite by email</Label>
            <Input id="invite-email" name="email" type="email" required placeholder="teammate@studio.com" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              name="role"
              defaultValue="MEMBER"
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
            >
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="h-9 px-4">
              Send invite
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
