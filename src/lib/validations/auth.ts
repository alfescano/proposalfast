import { z } from "zod";

/** HTML5 email (includes `+` aliases such as name+tag@gmail.com). */
const HTML5_EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const emailSchema = z
  .string()
  .trim()
  .min(3, "Enter a valid email")
  .max(254, "Enter a valid email")
  .regex(HTML5_EMAIL, "Enter a valid email")
  .transform((value) => value.toLowerCase());

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    email: emailSchema,
    password: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .max(128)
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[0-9]/, "Include a number"),
    organizationName: z
      .string()
      .trim()
      .min(2, "Workspace name must be at least 2 characters")
      .max(80),
  })
  .strict();

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(16),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .max(128)
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[0-9]/, "Include a number"),
  })
  .strict();

export const verifyEmailSchema = z
  .object({
    token: z.string().min(8),
    email: emailSchema,
  })
  .strict();

const passwordRules = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128)
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[0-9]/, "Include a number");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    password: passwordRules,
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
