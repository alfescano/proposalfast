import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { isWithinLimit, PLAN_CATALOG } from "@/lib/plans";
import { PlanLimitError } from "@/lib/rbac";
import { PlanTier } from "@prisma/client";

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
      temperature: 0.2,
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
