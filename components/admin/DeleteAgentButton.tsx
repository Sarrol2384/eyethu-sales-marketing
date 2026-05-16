"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteAgent } from "@/lib/actions/agents";

export function DeleteAgentButton({
  userId,
  label,
}: {
  userId: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            `Remove portal access for ${label}? Their login account stays — you can delete the user in Supabase Auth if needed.`,
          )
        ) {
          return;
        }
        startTransition(async () => {
          const r = await deleteAgent(userId);
          if (!r.ok) {
            toast.error(r.error ?? "Could not remove agent");
            return;
          }
          toast.success("Agent removed from portal");
          router.refresh();
        });
      }}
    >
      {pending ? "Removing…" : "Remove"}
    </Button>
  );
}
