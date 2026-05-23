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
            `Remove ${label} from the agent roster and delete their login? They will not be able to sign in again.`,
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
          toast.success("Agent and login removed");
          router.refresh();
        });
      }}
    >
      {pending ? "Removing…" : "Remove"}
    </Button>
  );
}
