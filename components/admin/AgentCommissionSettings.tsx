"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAgentCommission } from "@/lib/actions/agents";

type Props = {
  userId: string;
  defaultCommissionPercent: number | null;
};

export function AgentCommissionSettings({
  userId,
  defaultCommissionPercent,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(
    defaultCommissionPercent != null
      ? String(defaultCommissionPercent)
      : "",
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateAgentCommission({
        user_id: userId,
        default_commission_percent:
          value.trim() === "" ? null : Number(value),
      });
      if (!res.ok) {
        toast.error(res.error ?? "Could not save commission rate");
        return;
      }
      toast.success("Default commission updated");
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border bg-card p-4 space-y-3 max-w-md"
    >
      <div>
        <h2 className="text-sm font-semibold">Default commission</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Percentage of sale price for this agent on sale listings. Can be
          overridden per property. If two agents share a listing, commission is
          split 50/50.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="default_commission_percent">Commission %</Label>
        <Input
          id="default_commission_percent"
          type="number"
          min={0}
          max={100}
          step={0.01}
          placeholder="e.g. 2.5"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save default"}
      </Button>
    </form>
  );
}
