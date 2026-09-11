import { afterEach, describe, expect, it, vi } from "vitest";
import { AIService, parseJsonAgainst, assertAiQuota } from "./ai/service";
import { extractResultSchema } from "./ai/schemas";
import { getStripe, constructWebhookEvent } from "./stripe/client";
import { ConsoleEmailAdapter } from "./email/console";
import { getEmailAdapter } from "./email";
import { getStorage } from "./storage/s3";
import { rateLimit, assertRateLimit, RateLimitError } from "./rate-limit";
import { POST as stripeWebhook } from "@/app/api/webhooks/stripe/route";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { PlanLimitError } from "./rbac";

const prisma = new PrismaClient();

describe("AI refuses missing keys and bad JSON", () => {
  it("throws when OPENAI_API_KEY is absent", () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(() => new AIService()).toThrow(/OPENAI_API_KEY is not set/);
    if (previous !== undefined) process.env.OPENAI_API_KEY = previous;
  });

  it("rejects malformed model JSON so the pipeline can retry", () => {
    expect(parseJsonAgainst(extractResultSchema, "not-json").ok).toBe(false);
    expect(parseJsonAgainst(extractResultSchema, '{"facts":[]}').ok).toBe(true);
    expect(parseJsonAgainst(extractResultSchema, "prefix {\"facts\":[]} trailing").ok).toBe(true);
  });

  it("enforces monthly AI quota from AIUsage rows", async () => {
    const suffix = nanoid(8);
    const free = await prisma.plan.findUnique({ where: { tier: "FREE" } });
    if (!free) throw new Error("seed plans");
    const user = await prisma.user.create({
      data: {
        email: `quota-${suffix}@ai.test`,
        passwordHash: await bcrypt.hash("QuotaPass12", 10),
      },
    });
    const organization = await prisma.organization.create({
      data: {
        name: `Quota ${suffix}`,
        slug: `quota-${suffix}`,
        members: { create: { userId: user.id, role: "OWNER" } },
        subscription: { create: { planId: free.id, status: "ACTIVE" } },
      },
    });
    await prisma.aIUsage.createMany({
      data: Array.from({ length: 10 }, () => ({
        organizationId: organization.id,
        userId: user.id,
        model: "gpt-4.1-mini",
        purpose: "extract",
        inputTokens: 1,
        outputTokens: 1,
      })),
    });
    await expect(assertAiQuota(organization.id)).rejects.toBeInstanceOf(PlanLimitError);
    await prisma.organization.delete({ where: { id: organization.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});

describe("Stripe refuses unsigned or unconfigured events", () => {
  it("getStripe throws without STRIPE_SECRET_KEY", () => {
    const previous = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    expect(() => getStripe()).toThrow(/STRIPE_SECRET_KEY is not set/);
    if (previous !== undefined) process.env.STRIPE_SECRET_KEY = previous;
  });

  it("getStripe uses STRIPE_SECRET_KEY present at call time", () => {
    const previous = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = "sk_test_runtime_lookup";
    expect(() => getStripe()).not.toThrow();
    if (previous === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previous;
  });

  it("constructWebhookEvent throws without STRIPE_WEBHOOK_SECRET", () => {
    const previous = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect(() => constructWebhookEvent("{}", "t=1,v1=abc")).toThrow(/STRIPE_WEBHOOK_SECRET/);
    if (previous !== undefined) process.env.STRIPE_WEBHOOK_SECRET = previous;
  });

  it("rejects a forged signature when dummy Stripe keys are present", () => {
    const secret = process.env.STRIPE_SECRET_KEY;
    const webhook = process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy_not_live";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_dummy_not_live";
    expect(() => constructWebhookEvent("{}", "t=1,v1=deadbeef")).toThrow();
    if (secret === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = secret;
    if (webhook === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = webhook;
  });

  it("webhook route returns 400 without stripe-signature", async () => {
    const response = await stripeWebhook(
      new Request("http://127.0.0.1/api/webhooks/stripe", { method: "POST", body: "{}" }),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toMatch(/stripe-signature/i);
  });
});

describe("email and storage fail closed", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("console adapter throws in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const adapter = new ConsoleEmailAdapter();
    await expect(
      adapter.send({ to: "a@b.com", subject: "x", html: "<p>x</p>", text: "x" }),
    ).rejects.toThrow(/RESEND_API_KEY/);
  });

  it("getEmailAdapter throws in production without Resend", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => getEmailAdapter()).toThrow(/RESEND_API_KEY is required in production/);
  });

  it("getEmailAdapter throws on Vercel production without Resend", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(() => getEmailAdapter()).toThrow(/RESEND_API_KEY is required in production/);
  });

  it("getEmailAdapter throws when the key is set but FROM is invalid", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("RESEND_FROM_EMAIL", "ProposalFast");
    expect(() => getEmailAdapter()).toThrow(/RESEND_FROM_EMAIL/);
  });

  it("S3 adapter throws without bucket credentials", () => {
    const bucket = process.env.S3_BUCKET;
    const key = process.env.S3_ACCESS_KEY_ID;
    const secret = process.env.S3_SECRET_ACCESS_KEY;
    delete process.env.S3_BUCKET;
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
    expect(() => getStorage()).toThrow(/S3_BUCKET/);
    if (bucket !== undefined) process.env.S3_BUCKET = bucket;
    if (key !== undefined) process.env.S3_ACCESS_KEY_ID = key;
    if (secret !== undefined) process.env.S3_SECRET_ACCESS_KEY = secret;
  });
});

describe("in-process rate limit", () => {
  it("blocks a key after the window is exhausted", async () => {
    const key = `audit-${nanoid(8)}`;
    expect((await rateLimit({ key, limit: 2, windowMs: 60_000 })).ok).toBe(true);
    expect((await rateLimit({ key, limit: 2, windowMs: 60_000 })).ok).toBe(true);
    expect((await rateLimit({ key, limit: 2, windowMs: 60_000 })).ok).toBe(false);
    await expect(assertRateLimit(key, 2, 60_000)).rejects.toBeInstanceOf(RateLimitError);
  });
});
