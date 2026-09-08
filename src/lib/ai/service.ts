import OpenAI from "openai";
import type { ZodType } from "zod";
import { prisma } from "@/lib/db";
import { isWithinLimit, PLAN_CATALOG } from "@/lib/plans";
import { PlanLimitError } from "@/lib/rbac";
import { PlanTier } from "@prisma/client";
import { chatCompletionSampling } from "./sampling";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type CompleteArgs = {
  messages: ChatMessage[];
  purpose: string;
  organizationId: string;
  userId: string;
  fast?: boolean;
  json?: boolean;
};

/**
 * Single entry point for every model call. Records token usage against the org
 * and refuses to invent a fallback completion when the API key is missing.
 */
export class AIService {
  private client: OpenAI;

  constructor(apiKey = process.env.OPENAI_API_KEY) {
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set. ProposalFast will not fabricate AI output.",
      );
    }
    this.client = new OpenAI({ apiKey });
  }

  model(fast = false) {
    return fast
      ? (process.env.OPENAI_MODEL_FAST ?? "gpt-4.1-mini")
      : (process.env.OPENAI_MODEL ?? "gpt-4.1");
  }

  async complete(args: CompleteArgs) {
    await assertAiQuota(args.organizationId);

    const model = this.model(args.fast);
    const response = await this.client.chat.completions.create({
      model,
      messages: args.messages,
      ...chatCompletionSampling(model),
      ...(args.json ? { response_format: { type: "json_object" } } : {}),
    });

    const choice = response.choices[0]?.message?.content;
    if (!choice) {
      throw new Error("The model returned an empty completion.");
    }

    await prisma.aIUsage.create({
      data: {
        organizationId: args.organizationId,
        userId: args.userId,
        model,
        purpose: args.purpose,
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      },
    });

    return {
      text: choice,
      model,
      usage: response.usage,
    };
  }

  /**
   * Parse model JSON through Zod. On a schema miss, retry once with the
   * validator error — never invent a stand-in object.
   */
  async completeJson<T>(schema: ZodType<T>, args: CompleteArgs): Promise<T> {
    const first = await this.complete({ ...args, json: true });
    const parsed = parseJsonAgainst(schema, first.text);
    if (parsed.ok) return parsed.data;

    const retry = await this.complete({
      ...args,
      json: true,
      purpose: `${args.purpose}:retry`,
      messages: [
        ...args.messages,
        { role: "assistant", content: first.text },
        {
          role: "user",
          content: `Your JSON failed validation: ${parsed.error}. Return only valid JSON that matches the requested schema. Do not invent facts.`,
        },
      ],
    });

    const second = parseJsonAgainst(schema, retry.text);
    if (!second.ok) {
      throw new Error(`Model JSON failed validation after retry: ${second.error}`);
    }
    return second.data;
  }
}

export function parseJsonAgainst<T>(
  schema: ZodType<T>,
  text: string,
): { ok: true; data: T } | { ok: false; error: string } {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) {
      return { ok: false, error: "Response did not contain a JSON object." };
    }
    const raw = JSON.parse(text.slice(start, end + 1)) as unknown;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues.map((issue) => issue.message).join("; ") };
    }
    return { ok: true, data: parsed.data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid JSON" };
  }
}

export async function assertAiQuota(organizationId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });
  const tier = (subscription?.plan.tier ?? "FREE") as PlanTier;
  const limit = PLAN_CATALOG[tier].limits.maxAiGenerationsPerMonth;
  const since = new Date();
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);

  const used = await prisma.aIUsage.count({
    where: { organizationId, createdAt: { gte: since } },
  });

  if (!isWithinLimit(used, limit)) {
    throw new PlanLimitError(
      `This workspace has used its ${tier} AI generation quota for the month.`,
    );
  }
}

export function getAIService() {
  return new AIService();
}
