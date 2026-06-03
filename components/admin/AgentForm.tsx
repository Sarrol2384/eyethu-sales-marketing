"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAgent } from "@/lib/actions/agents";
import type { CreateAgentFormInput } from "@/lib/validation/agent";

export function AgentForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CreateAgentFormInput, string>>
  >({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    const form = e.currentTarget;
    const fd = new FormData(form);
    const input: CreateAgentFormInput = {
      display_name: String(fd.get("display_name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      password: String(fd.get("password") ?? ""),
      password_confirm: String(fd.get("password_confirm") ?? ""),
      default_commission_percent: (() => {
        const raw = String(fd.get("default_commission_percent") ?? "").trim();
        if (raw === "") return undefined;
        const n = Number(raw);
        return Number.isNaN(n) ? undefined : n;
      })(),
    };

    startTransition(() => {
      void (async () => {
        try {
          const res = await createAgent(input);
          if (!res.ok) {
            if (res.fieldErrors) setFieldErrors(res.fieldErrors);
            toast.error(res.error ?? "Could not create agent");
            return;
          }
          toast.success("Agent created. They can sign in at /agent/login.");
          router.push("/admin/agents");
          router.refresh();
        } catch {
          toast.error(
            "Could not reach the server. Check your connection and try again.",
          );
        }
      })();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          name="display_name"
          required
          autoComplete="name"
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
          aria-invalid={!!fieldErrors.email}
        />
        {fieldErrors.email && (
          <p className="text-xs text-destructive">{fieldErrors.email}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+27 82 555 0123"
          aria-invalid={!!fieldErrors.phone}
        />
        {fieldErrors.phone && (
          <p className="text-xs text-destructive">{fieldErrors.phone}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="default_commission_percent">
          Default commission % (optional)
        </Label>
        <Input
          id="default_commission_percent"
          name="default_commission_percent"
          type="number"
          min={0}
          max={100}
          step={0.01}
          placeholder="e.g. 2.5"
          aria-invalid={!!fieldErrors.default_commission_percent}
        />
        <p className="text-xs text-muted-foreground">
          Percentage of sale price. Can be overridden per listing later.
        </p>
        {fieldErrors.default_commission_percent && (
          <p className="text-xs text-destructive">
            {fieldErrors.default_commission_percent}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          aria-invalid={!!fieldErrors.password}
        />
        {fieldErrors.password && (
          <p className="text-xs text-destructive">{fieldErrors.password}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password_confirm">Confirm password</Label>
        <Input
          id="password_confirm"
          name="password_confirm"
          type="password"
          required
          autoComplete="new-password"
          aria-invalid={!!fieldErrors.password_confirm}
        />
        {fieldErrors.password_confirm && (
          <p className="text-xs text-destructive">
            {fieldErrors.password_confirm}
          </p>
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create agent"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => router.push("/admin/agents")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
