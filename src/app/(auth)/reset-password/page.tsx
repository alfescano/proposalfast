import type { Metadata } from "next";
import { resetPasswordAction } from "@/actions/auth";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = {
  title: "Choose a new password",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div>
      <h1 className="font-heading text-4xl">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted-foreground">The link in your email expires after one hour.</p>
      <div className="mt-8">
        <ResetForm action={resetPasswordAction} token={token ?? ""} />
      </div>
    </div>
  );
}
