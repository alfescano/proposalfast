import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { sha256 } from "@/lib/crypto";
import { auth } from "@/auth";
import { AcceptInviteForm, InviteRegisterForm } from "@/components/auth/invite-forms";

export const metadata: Metadata = { title: "Team invite", robots: { index: false, follow: false } };

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await prisma.organizationInvite.findUnique({
    where: { tokenHash: sha256(token) },
    include: { organization: true },
  });
  if (!invite || invite.revokedAt || invite.acceptedAt || invite.expiresAt < new Date()) {
    notFound();
  }
  if (invite.organization.deletedAt) notFound();

  const session = await auth();
  const signedIn = Boolean(session?.user?.email);
  const emailMatches = session?.user?.email?.toLowerCase() === invite.email;

  return (
    <div className="mx-auto max-w-md">
      <p className="text-xs tracking-[0.18em] text-accent uppercase">Invite</p>
      <h1 className="mt-2 font-heading text-4xl">Join {invite.organization.name}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This invite was sent to <strong>{invite.email}</strong> as {invite.role.toLowerCase()}.
      </p>
      {signedIn && emailMatches ? (
        <div className="mt-8">
          <AcceptInviteForm token={token} />
        </div>
      ) : signedIn ? (
        <p className="mt-8 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          You are signed in as {session?.user?.email}. Sign out and use {invite.email} to accept.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          <InviteRegisterForm token={token} email={invite.email} />
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href={`/login?next=/invite/${token}`} className="underline">
              Sign in
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
