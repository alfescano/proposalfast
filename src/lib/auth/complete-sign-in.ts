import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { authJsErrorFromUrl } from "./next-redirect";

export type SignInFailure = { ok: false; error: string };

/**
 * Credentials sign-in that does not redirect to /login?error= (which remounts
 * the form with a blank state). Success still redirects via next/navigation.
 */
export async function completeCredentialsSignIn(input: {
  email: string;
  password: string;
  redirectTo: string;
}): Promise<SignInFailure> {
  const result = await signIn("credentials", {
    email: input.email,
    password: input.password,
    redirectTo: input.redirectTo,
    redirect: false,
  });

  const url = typeof result === "string" ? result : "";
  const authError = url ? authJsErrorFromUrl(url) : null;
  if (authError) {
    return { ok: false, error: authError };
  }
  if (!url) {
    return { ok: false, error: "Email or password is incorrect." };
  }

  redirect(url);
}
