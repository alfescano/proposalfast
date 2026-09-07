"use client";

import { switchOrganizationAction } from "@/actions/team";

export function OrgSwitcher({
  organizationId,
  organizations,
}: {
  organizationId: string;
  organizations: { id: string; name: string }[];
}) {
  return (
    <form>
      <label htmlFor="org-switch" className="sr-only">
        Switch workspace
      </label>
      <select
        id="org-switch"
        name="organizationId"
        defaultValue={organizationId}
        className="mb-3 h-8 w-full rounded-md border border-sidebar-border bg-sidebar px-2 text-xs"
        onChange={(event) => {
          void switchOrganizationAction(event.target.value);
        }}
      >
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </form>
  );
}
