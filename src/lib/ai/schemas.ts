import { z } from "zod";

export const extractedFactSchema = z.object({
  key: z.string().min(1).max(80),
  value: z.string().min(1).max(2000),
  source: z.enum(["user", "missing"]),
});

export const extractResultSchema = z.object({
  facts: z.array(extractedFactSchema).max(80),
  missing: z.array(z.string().min(1).max(200)).max(40).default([]),
});

export const outlineItemSchema = z.object({
  title: z.string().min(1).max(160),
  type: z.enum([
    "cover",
    "introduction",
    "scope",
    "approach",
    "timeline",
    "pricing",
    "terms",
    "next_steps",
    "custom",
  ]),
  intent: z.string().min(1).max(400),
});

export const outlineResultSchema = z.object({
  outline: z.array(outlineItemSchema).min(1).max(16),
});

export const generatedSectionSchema = z.object({
  title: z.string().min(1).max(160),
  type: z.string().min(1).max(40),
  body: z.string().min(1).max(12000),
  placeholders: z.array(z.string().max(200)).max(40).default([]),
});

export const generateResultSchema = z.object({
  sections: z.array(generatedSectionSchema).min(1).max(16),
});

export const qcResultSchema = z.object({
  invented: z.array(z.string().max(400)).max(40),
  missing: z.array(z.string().max(400)).max(40),
  ok: z.boolean(),
});

export const scoreDimensionsSchema = z.object({
  completeness: z.number().min(0).max(100),
  fidelity: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  commercialReadiness: z.number().min(0).max(100),
  overall: z.number().min(0).max(100),
  notes: z.array(z.string().max(240)).max(12),
});

export const rewriteModeSchema = z.enum([
  "rewrite",
  "shorten",
  "expand",
  "tone",
  "persuasive",
  "humanize",
]);

export const rewriteResultSchema = z.object({
  text: z.string().min(1).max(12000),
  placeholders: z.array(z.string().max(200)).max(40).default([]),
});

export type ExtractResult = z.infer<typeof extractResultSchema>;
export type OutlineResult = z.infer<typeof outlineResultSchema>;
export type GenerateResult = z.infer<typeof generateResultSchema>;
export type QcResult = z.infer<typeof qcResultSchema>;
export type ScoreDimensions = z.infer<typeof scoreDimensionsSchema>;
export type RewriteMode = z.infer<typeof rewriteModeSchema>;
