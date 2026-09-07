"use client";

import { useRef, useState } from "react";
import {
  acceptPublicProposalAction,
  signPublicProposalAction,
  startPublicPaymentAction,
} from "@/actions/public";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/states/error-state";

export function SignPayPanel({
  publicId,
  alreadySigned,
  alreadyAccepted,
  paymentEnabled,
  amountLabel,
  signerDefaultName,
  signerDefaultEmail,
}: {
  publicId: string;
  alreadySigned: boolean;
  alreadyAccepted: boolean;
  paymentEnabled: boolean;
  amountLabel: string | null;
  signerDefaultName?: string;
  signerDefaultEmail?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [type, setType] = useState<"TYPED" | "DRAWN">("TYPED");
  const [typed, setTyped] = useState(signerDefaultName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [signed, setSigned] = useState(alreadySigned);
  const [accepted, setAccepted] = useState(alreadyAccepted);
  const [pending, setPending] = useState(false);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function startDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    const p = point(event);
    if (!ctx || !p) return;
    drawing.current = true;
    canvasRef.current?.setPointerCapture(event.pointerId);
    ctx.strokeStyle = "#152033";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function moveDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const p = point(event);
    if (!ctx || !p) return;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function endDraw() {
    drawing.current = false;
  }

  async function onAccept(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("publicId", publicId);
    const result = await acceptPublicProposalAction(formData);
    setPending(false);
    if (!result.ok) setError(result.error);
    else setAccepted(true);
  }

  async function onSign(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("publicId", publicId);
    formData.set("signatureType", type);
    if (type === "DRAWN") {
      const data = canvasRef.current?.toDataURL("image/png") ?? "";
      formData.set("signatureData", data);
    } else {
      formData.set("signatureData", `typed:${typed}`);
    }
    const result = await signPublicProposalAction(formData);
    setPending(false);
    if (!result.ok) setError(result.error);
    else {
      setSigned(true);
      setAccepted(true);
    }
  }

  async function onPay() {
    setPending(true);
    setError(null);
    const result = await startPublicPaymentAction(publicId);
    setPending(false);
    if (!result.ok) setError(result.error);
    else window.location.href = result.url;
  }

  if (signed) {
    return (
      <div className="rounded-2xl border border-[#8a7040] bg-[#fffdf8] p-6 text-sm text-[#152033]">
        <p className="font-medium">Signed</p>
        <p className="mt-2 text-[#3d4a5c]">
          This version is locked. A signed copy was emailed to you.
        </p>
        {paymentEnabled && amountLabel ? (
          <Button type="button" className="mt-4 h-10 px-4" onClick={onPay} disabled={pending}>
            Pay {amountLabel}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!accepted ? (
        <form action={onAccept} className="space-y-4 rounded-2xl border border-[#8a7040] bg-[#fffdf8] p-6">
          <h2 className="font-heading text-2xl text-[#152033]">Accept this proposal</h2>
          <p className="text-sm text-[#3d4a5c]">
            Acceptance records your intent. Signing in the next step locks the version.
          </p>
          {error ? <ErrorState description={error} /> : null}
          <div className="space-y-2">
            <Label htmlFor="acceptName" className="text-[#152033]">
              Your name
            </Label>
            <Input
              id="acceptName"
              name="signerName"
              required
              defaultValue={signerDefaultName}
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="acceptEmail" className="text-[#152033]">
              Email
            </Label>
            <Input
              id="acceptEmail"
              name="signerEmail"
              type="email"
              required
              defaultValue={signerDefaultEmail}
              autoComplete="email"
            />
          </div>
          <Button type="submit" disabled={pending} className="h-10 px-4">
            {pending ? "Accepting…" : "Accept"}
          </Button>
        </form>
      ) : (
        <p className="rounded-xl border border-[#8a7040] bg-[#fffdf8] px-4 py-3 text-sm text-[#152033]">
          Accepted. Sign below to lock this version.
        </p>
      )}

      <form action={onSign} className="space-y-4 rounded-2xl border border-[#8a7040] bg-[#fffdf8] p-6">
        <h2 className="font-heading text-2xl text-[#152033]">Sign this proposal</h2>
        {error ? <ErrorState description={error} /> : null}
        <div className="space-y-2">
          <Label htmlFor="signerName" className="text-[#152033]">
            Full name
          </Label>
          <Input
            id="signerName"
            name="signerName"
            required
            defaultValue={signerDefaultName}
            autoComplete="name"
            onChange={(event) => setTyped(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signerEmail" className="text-[#152033]">
            Email
          </Label>
          <Input
            id="signerEmail"
            name="signerEmail"
            type="email"
            required
            defaultValue={signerDefaultEmail}
            autoComplete="email"
          />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-[#152033]">Signature method</legend>
          <div className="flex gap-2 text-sm" role="radiogroup" aria-label="Signature method">
            <Button
              type="button"
              variant={type === "TYPED" ? "default" : "outline"}
              aria-pressed={type === "TYPED"}
              onClick={() => setType("TYPED")}
            >
              Type
            </Button>
            <Button
              type="button"
              variant={type === "DRAWN" ? "default" : "outline"}
              aria-pressed={type === "DRAWN"}
              onClick={() => setType("DRAWN")}
            >
              Draw
            </Button>
          </div>
        </fieldset>
        {type === "TYPED" ? (
          <p className="font-heading text-3xl italic text-[#152033]" aria-live="polite">
            {typed || "Your name"}
          </p>
        ) : (
          <div>
            <Label htmlFor="signature-pad" className="text-[#152033]">
              Draw your signature
            </Label>
            <canvas
              id="signature-pad"
              ref={canvasRef}
              width={520}
              height={160}
              role="img"
              aria-label="Signature drawing pad. Use a pointer or finger to sign."
              tabIndex={0}
              className="mt-2 h-40 w-full touch-none rounded-xl border border-[#c4b396] bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#152033]"
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
            />
          </div>
        )}
        <label className="flex items-start gap-2 text-sm text-[#152033]">
          <input type="checkbox" name="consent" value="on" required className="mt-1 size-4 accent-[#152033]" />
          <span>
            I agree that this typed or drawn signature is the legal equivalent of a handwritten
            signature and I intend to be bound by this proposal.
          </span>
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" disabled={pending} className="h-10 px-4">
            {pending ? "Signing…" : "Sign"}
          </Button>
          {paymentEnabled && amountLabel ? (
            <Button type="button" variant="outline" className="h-10 px-4" onClick={onPay} disabled={pending}>
              Pay {amountLabel} instead
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
