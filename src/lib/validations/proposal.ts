import { z } from "zod";

export const proposalCreateSchema = z
  .object({
    title: z.string().trim().min(3, "Give the proposal a title").max(160),
    clientId: z.string().cuid().optional().or(z.literal("")),
    templateId: z.string().cuid().optional().or(z.literal("")),
    currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD"]).default("USD"),
    validUntil: z.string().optional().or(z.literal("")),
    brief: z.string().trim().max(12000).optional().or(z.literal("")),
    facts: z.string().trim().max(4000).optional().or(z.literal("")),
    useAi: z.enum(["on", "true"]).optional(),
    paymentEnabled: z.enum(["on", "true"]).optional(),
    paymentMode: z.enum(["FULL", "DEPOSIT", "FIXED"]).optional().or(z.literal("")),
    amount: z.string().optional().or(z.literal("")),
    depositPercent: z.string().optional().or(z.literal("")),
    followUpOptIn: z.enum(["on", "true"]).optional(),
  })
  .strict();

export const rewriteSelectionSchema = z.object({
  proposalId: z.string().cuid(),
  sectionId: z.string().cuid(),
  selectedText: z.string().trim().min(1).max(8000),
  mode: z.enum(["rewrite", "shorten", "expand", "tone", "persuasive", "humanize"]),
});

export const proposalUpdateSchema = z
  .object({
    title: z.string().trim().min(3).max(160).optional(),
    clientId: z.string().cuid().optional().nullable(),
    status: z
      .enum([
        "DRAFT",
        "REVIEW",
        "SENT",
        "ARCHIVED",
        "DECLINED",
        "ACCEPTED",
      ])
      .optional(),
    currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD"]).optional(),
    validUntil: z.string().datetime().optional().nullable(),
  })
  .strict();

export const proposalSectionSchema = z
  .object({
    id: z.string().cuid(),
    title: z.string().trim().min(1).max(160),
    type: z.string().min(1).max(40),
    content: z.record(z.string(), z.unknown()),
    sortOrder: z.number().int().min(0),
  })
  .strict();

export const proposalGenerateSchema = z
  .object({
    proposalId: z.string().cuid(),
    brief: z.string().trim().min(20, "Add a brief so the model has facts to use").max(12000),
    facts: z.array(z.string().trim().min(1)).max(80).optional(),
  })
  .strict();

export type ProposalCreateInput = z.infer<typeof proposalCreateSchema>;
