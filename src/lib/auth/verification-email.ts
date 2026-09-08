import { prisma } from "@/lib/db";
import { generateToken, sha256 } from "@/lib/crypto";
import { sendTransactionalEmail } from "@/lib/email/send";
import { mail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";

export async function sendVerificationEmail(input: {
  email: string;
  name: string | null | undefined;
  token: string;
}) {
  const verifyUrl = absoluteUrl(
    `/verify-email?token=${input.token}&email=${encodeURIComponent(input.email)}`,
  );
  const template = mail.templates.verificationEmail(input.name ?? "there", verifyUrl);
  return sendTransactionalEmail({ to: input.email, ...template });
}

export async function issueVerificationToken(email: string) {
  const token = generateToken();
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: sha256(token),
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });
  return token;
}

export async function sendVerificationForAccount(input: {
  email: string;
  name: string | null | undefined;
}) {
  const token = await issueVerificationToken(input.email);
  return sendVerificationEmail({ email: input.email, name: input.name, token });
}

export async function findActiveUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true, email: true, name: true, emailVerified: true },
  });
}
