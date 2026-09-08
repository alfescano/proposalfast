import type { Metadata } from "next";
import { loginAction } from "@/actions/auth";
import { AuthForm, AuthSwitch, Field } from "@/components/auth/auth-form";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { GoogleButton } from "@/components/auth/google-button";
import { ErrorState } from "@/components/states/error-state";
import { messageForAuthJsError } from "@/lib/auth/next-redirect";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your ProposalFast workspace.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const { next, error } = await searchParams;
  const redirectedError = error ? messageForAuthJsError(error) : null;

  return (
    <div>
      <h1 className="font-heading text-4xl">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">Use the email and password for your workspace.</p>
      <div className="mt-8 space-y-6">
        {redirectedError ? <ErrorState title="Could not sign in" description={redirectedError} /> : null}
        {googleEnabled ? <GoogleButton /> : null}
        <AuthForm
          action={loginAction}
          submitLabel="Log in"
          pendingLabel="Signing in…"
          extra={<AuthSwitch href="/register" prompt="New here?" label="Create a workspace" />}
        >
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <Field name="email" label="Email" type="email" autoComplete="email" required />
          <Field
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
          />
          <AuthSwitch href="/forgot-password" prompt="" label="Forgot password?" />
        </AuthForm>
        <ResendVerificationForm />
      </div>
    </div>
  );
}
