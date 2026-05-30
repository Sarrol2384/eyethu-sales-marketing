"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatSAPhoneDisplay } from "@/lib/format/phone";
import { updateAgentProfile } from "@/lib/actions/agents";
import type { UpdateAgentProfileInput } from "@/lib/validation/agent";

type Props = {
  userId: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
};

export function AgentProfileSettings({
  userId,
  displayName,
  email,
  phone,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof UpdateAgentProfileInput, string>>
  >({});

  const phoneDisplay = phone ? formatSAPhoneDisplay(phone) : "";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    const form = e.currentTarget;
    const fd = new FormData(form);
    const input: UpdateAgentProfileInput = {
      user_id: userId,
      display_name: String(fd.get("display_name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
    };

    startTransition(async () => {
      const res = await updateAgentProfile(input);
      if (!res.ok) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        toast.error(res.error ?? "Could not save agent details");
        return;
      }
      toast.success("Agent details updated");
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-md space-y-4 rounded-xl border bg-card p-4"
    >
      <div>
        <h2 className="text-sm font-semibold">Contact & login</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Login email is used at{" "}
          <span className="font-mono text-[11px]">/agent/login</span>. Phone is
          used for WhatsApp on listings when you assign this agent to a property.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          name="display_name"
          required
          defaultValue={displayName ?? ""}
          aria-invalid={!!fieldErrors.display_name}
        />
        {fieldErrors.display_name && (
          <p className="text-xs text-destructive">{fieldErrors.display_name}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Login email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="off"
          defaultValue={email ?? ""}
          aria-invalid={!!fieldErrors.email}
        />
        {fieldErrors.email && (
          <p className="text-xs text-destructive">{fieldErrors.email}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone / WhatsApp</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+27 82 555 0123"
          defaultValue={phoneDisplay}
          aria-invalid={!!fieldErrors.phone}
        />
        {fieldErrors.phone && (
          <p className="text-xs text-destructive">{fieldErrors.phone}</p>
        )}
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}
