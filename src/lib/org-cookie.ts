import { cookies } from "next/headers";

export const ORG_COOKIE = "pf_org";

export async function getPreferredOrgId() {
  const jar = await cookies();
  return jar.get(ORG_COOKIE)?.value ?? null;
}

export async function setActiveOrgCookie(organizationId: string) {
  const jar = await cookies();
  jar.set(ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearActiveOrgCookie() {
  const jar = await cookies();
  jar.delete(ORG_COOKIE);
}
