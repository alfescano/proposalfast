import { z } from "zod";

export const onboardingSchema = z
  .object({
    businessName: z.string().trim().min(2).max(80),
    industry: z.string().trim().min(2).max(80),
    website: z
      .string()
      .trim()
      .max(200)
      .optional()
      .or(z.literal(""))
      .transform((value) => value || undefined),
    tagline: z.string().trim().max(160).optional().or(z.literal("")),
    defaultCurrency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD"]),
    brandColor: z
      .string()
      .regex(/^#([0-9a-fA-F]{6})$/, "Use a hex color like #1B3A4B")
      .optional()
      .or(z.literal("")),
  })
  .strict();

export const settingsSchema = onboardingSchema.extend({
  emailFromName: z.string().trim().max(80).optional().or(z.literal("")),
  emailReplyTo: z
    .string()
    .trim()
    .email("Enter a valid reply-to email")
    .optional()
    .or(z.literal("")),
  defaultValidDays: z.coerce.number().int().min(1).max(365),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
