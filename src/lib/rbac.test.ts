import { describe, expect, it } from "vitest";
import {
  canManageBilling,
  canManageMembers,
  canViewOrg,
  canWriteProposals,
  hasRole,
} from "./rbac";

describe("rbac", () => {
  it("ranks Owner above Admin above Member above Viewer", () => {
    expect(hasRole("OWNER", "ADMIN")).toBe(true);
    expect(hasRole("VIEWER", "MEMBER")).toBe(false);
    expect(canManageBilling("OWNER")).toBe(true);
    expect(canManageBilling("ADMIN")).toBe(false);
    expect(canManageMembers("ADMIN")).toBe(true);
    expect(canWriteProposals("MEMBER")).toBe(true);
    expect(canWriteProposals("VIEWER")).toBe(false);
    expect(canViewOrg("VIEWER")).toBe(true);
  });
});
