import { z } from "zod";

export const clientSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(120),
    email: z
      .string()
      .trim()
      .email("Enter a valid email")
      .optional()
      .or(z.literal(""))
      .transform((value) => value || undefined),
    company: z.string().trim().max(120).optional().or(z.literal("")),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    website: z.string().trim().max(200).optional().or(z.literal("")),
    address: z.string().trim().max(240).optional().or(z.literal("")),
    notes: z.string().trim().max(4000).optional().or(z.literal("")),
  })
  .strict();

export type ClientInput = z.infer<typeof clientSchema>;
