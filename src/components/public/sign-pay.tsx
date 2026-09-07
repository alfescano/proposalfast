"use client";

import { useRef, useState } from "react";
import { signPublicProposalAction, startPublicPaymentAction } from "@/actions/public";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/states/error-state";

export function SignPayPanel({
  publicId,
  alreadySigned,
  paymentEnabled,
  amountLabel,
  signerDefaultName,
  signerDefaultEmail,
}: {
  publicId: string;
  alreadySigned: boolean;
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
    else setSigned(true);
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
      <div className="rounded-2xl border border-[#c9a227] bg-[#fffdf8] p-6 text-sm">
        <p className="font-medium">Signed</p>
        <p className="mt-2 text-muted-foreground">
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
    <form action={onSign} className="space-y-4 rounded-2xl border border-[#c9a227] bg-[#fffdf8] p-6">
      <h2 className="font-heading text-2xl">Sign this proposal</h2>
      {error ? <ErrorState description={error} /> : null}
      <div className="space-y-2">
        <Label htmlFor="signerName">Full name</Label>
        <Input
          id="signerName"
          name="signerName"
          required
          defaultValue={signerDefaultName}
          onChange={(event) => setTyped(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signerEmail">Email</Label>
        <Input
          id="signerEmail"
          name="signerEmail"
          type="email"
          required
          defaultValue={signerDefaultEmail}
        />
      </div>
      <div className="flex gap-2 text-sm">
        <Button type="button" variant={type === "TYPED" ? "default" : "outline"} onClick={() => setType("TYPED")}>
          Type
        </Button>
        <Button type="button" variant={type === "DRAWN" ? "default" : "outline"} onClick={() => setType("DRAWN")}>
          Draw
        </Button>
      </div>
      {type === "TYPED" ? (
        <p className="font-heading text-3xl italic">{typed || "Your name"}</p>
      ) : (
        <canvas
          ref={canvasRef}
          width={520}
          height={160}
          className="h-40 w-full touch-none rounded-xl border border-[#e0d4bf] bg-white"
          onPointerDown={startDraw}
          onPointerMove={moveDraw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
        />
      )}
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="consent" value="on" required className="mt-1" />
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
  );
}
