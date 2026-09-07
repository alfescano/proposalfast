import type { PaymentMode } from "@prisma/client";

export function chargeAmountCents(input: {
  paymentEnabled: boolean;
  paymentMode: PaymentMode;
  amountCents: number | null;
  depositPercent: number | null;
}) {
  if (!input.paymentEnabled || !input.amountCents || input.amountCents <= 0) {
    return null;
  }
  if (input.paymentMode === "DEPOSIT") {
    const percent = Math.min(100, Math.max(1, input.depositPercent ?? 30));
    return Math.max(50, Math.round((input.amountCents * percent) / 100));
  }
  return input.amountCents;
}

export function paymentLabel(mode: PaymentMode, depositPercent: number | null) {
  if (mode === "DEPOSIT") return `${depositPercent ?? 30}% deposit`;
  if (mode === "FIXED") return "Fixed payment";
  return "Full payment";
}
