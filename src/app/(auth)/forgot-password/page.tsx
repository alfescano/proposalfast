import type { Metadata } from "next";
import { forgotPasswordAction } from "@/actions/auth";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your ProposalFast password.",
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="font-heading text-4xl">Reset your password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        If the email exists, we send a one-hour reset link. We do not reveal whether the account is
        registered.
      </p>
      <div className="mt-8">
        <ForgotForm action={forgotPasswordAction} />
      </div>
    </div>
  );
}
