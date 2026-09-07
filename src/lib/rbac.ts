import { Role } from "@prisma/client";

const RANK: Record<Role, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function hasRole(role: Role, minimum: Role) {
  return RANK[role] >= RANK[minimum];
}

export function canManageBilling(role: Role) {
  return hasRole(role, "OWNER");
}

export function canManageMembers(role: Role) {
  return hasRole(role, "ADMIN");
}

export function canWriteProposals(role: Role) {
  return hasRole(role, "MEMBER");
}

export function canViewOrg(role: Role) {
  return hasRole(role, "VIEWER");
}

export function canManageSettings(role: Role) {
  return hasRole(role, "ADMIN");
}

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export class TenantError extends Error {
  constructor(message = "That record is not in your workspace.") {
    super(message);
    this.name = "TenantError";
  }
}
