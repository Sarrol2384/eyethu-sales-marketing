"use client";

import { useState, useTransition } from "react";
import { MoreVertical, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PropertyStatus } from "@/lib/supabase/types";
import { setPropertyStatus, deleteProperty } from "@/lib/actions/properties";

type Props = {
  id: string;
  status: PropertyStatus;
  title: string;
};

export function PropertyRowActions({ id, status, title }: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function changeStatus(next: PropertyStatus) {
    startTransition(async () => {
      const result = await setPropertyStatus(id, next);
      if (!result.ok) {
        toast.error(result.error ?? "Could not update");
      } else {
        toast.success(`Marked as ${next}`);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteProperty(id);
        // deleteProperty calls redirect() so the toast may not show — that's fine.
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
        setConfirmDelete(false);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MoreVertical className="size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {status !== "draft" && (
            <DropdownMenuItem onClick={() => changeStatus("draft")}>
              Move to draft
            </DropdownMenuItem>
          )}
          {status !== "published" && (
            <DropdownMenuItem onClick={() => changeStatus("published")}>
              Publish
            </DropdownMenuItem>
          )}
          {status !== "sold" && (
            <DropdownMenuItem onClick={() => changeStatus("sold")}>
              Mark as sold
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setConfirmDelete(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this listing?</DialogTitle>
            <DialogDescription>
              <strong>{title}</strong> will be permanently removed, along with
              its photos and any captured leads tied directly to it. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
