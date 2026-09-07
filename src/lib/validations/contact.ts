import { z } from "zod";

export const contactSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(254),
    company: z.string().trim().max(80).optional().or(z.literal("")),
    message: z.string().trim().min(20, "Tell us a bit more — 20 characters minimum").max(4000),
  })
  .strict();

export type ContactInput = z.infer<typeof contactSchema>;
