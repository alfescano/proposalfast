import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations/contact";
import { getEmailAdapter, mail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { siteConfig } from "@/lib/site";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "anon";
  const limited = rateLimit({ key: `contact:${ip}`, limit: 5, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many messages. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form." },
      { status: 400 },
    );
  }

  await prisma.supportRequest.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.company ? `Contact: ${parsed.data.company}` : "Marketing contact",
      message: parsed.data.message,
      status: "open",
    },
  });

  const template = mail.templates.contactNotificationEmail(parsed.data);
  await getEmailAdapter().send({
    to: siteConfig.email,
    replyTo: parsed.data.email,
    ...template,
  });

  return NextResponse.json({ ok: true });
}
