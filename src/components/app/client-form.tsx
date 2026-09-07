"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientAction, deleteClientAction, updateClientAction } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/states/error-state";

const fields = [
  { name: "name", label: "Name", required: true },
  { name: "email", label: "Email", type: "email" },
  { name: "company", label: "Company" },
  { name: "phone", label: "Phone" },
  { name: "website", label: "Website" },
  { name: "address", label: "Address" },
] as const;

export function ClientCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const result = await createClientAction(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/clients/${result.id}`);
  }

  return (
    <form action={onSubmit} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      {error ? <ErrorState description={error} /> : null}
      {fields.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            name={field.name}
            type={"type" in field ? field.type : "text"}
            required={"required" in field && field.required}
          />
        </div>
      ))}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} />
      </div>
      <Button type="submit" disabled={pending} className="h-9 px-4">
        {pending ? "Saving…" : "Add client"}
      </Button>
    </form>
  );
}

export function ClientEditForm({
  client,
}: {
  client: {
    id: string;
    name: string;
    email: string | null;
    company: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    notes: string | null;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const result = await updateClientAction(client.id, formData);
    setPending(false);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  return (
    <form action={onSubmit} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      {error ? <ErrorState description={error} /> : null}
      {fields.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            name={field.name}
            type={"type" in field ? field.type : "text"}
            defaultValue={client[field.name] ?? ""}
            required={"required" in field && field.required}
          />
        </div>
      ))}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={client.notes ?? ""} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="h-9 px-4">
          Save
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9"
          onClick={async () => {
            await deleteClientAction(client.id);
            router.push("/clients");
          }}
        >
          Delete
        </Button>
      </div>
    </form>
  );
}
