import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-[#152033] p-10 text-[#f6f1e8] lg:flex">
        <Link href="/">
          <Logo className="text-[#f6f1e8]" />
        </Link>
        <div>
          <p className="font-heading text-4xl leading-tight">A workspace that will not invent the fee.</p>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
            Sign in to draft from your facts, send a client portal, and let Stripe record the rest.
          </p>
        </div>
        <p className="text-xs text-white/40">ProposalFast</p>
      </div>
      <div className="flex flex-col justify-center px-6 py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
