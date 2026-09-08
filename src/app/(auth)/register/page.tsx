import type { Metadata } from "next";
import { registerAction } from "@/actions/auth";
import { AuthForm, AuthSwitch, Field } from "@/components/auth/auth-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = {
  title: "Create a workspace",
  description: "Register for ProposalFast with email and password.",
};

export default function RegisterPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <div>
      <h1 className="font-heading text-4xl">Create your workspace</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You become the Owner. Invite the rest of the team after you subscribe.
      </p>
      <div className="mt-8 space-y-6">
        {googleEnabled ? <GoogleButton label="Continue with Google" /> : null}
        <AuthForm
          action={registerAction}
          submitLabel="Create workspace"
          pendingLabel="Creating…"
          extra={<AuthSwitch href="/login" prompt="Already have an account?" label="Log in" />}
        >
          <Field name="name" label="Your name" autoComplete="name" required minLength={2} />
          <Field
            name="organizationName"
            label="Workspace / business name"
            autoComplete="organization"
            required
            minLength={2}
          />
          <Field name="email" label="Email" type="email" autoComplete="email" required />
          <Field
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
          />
          <p className="text-xs text-muted-foreground">
            10+ characters with upper, lower, and a number. Plus-aliases (you+tag@gmail.com) are
            valid. We send a verification email via Resend — if that fails, the form will show the
            reason so you can fix RESEND_FROM_EMAIL or resend from log in.
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
