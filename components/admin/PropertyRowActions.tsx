"use client";

import { useState, useTransition } from "react";
import { MoreVertical, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  /** When false, hide delete (e.g. agent portal). */
  allowDelete?: boolean;
  /** When true, prompt for sold price before marking sold (admin). */
  allowSoldPriceCapture?: boolean;
  /** Listing price shown as placeholder in sold-price dialog. */
  listingPrice?: number;
};

export function PropertyRowActions({
  id,
  status,
  title,
  allowDelete = true,
  allowSoldPriceCapture = false,
  listingPrice,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSold, setConfirmSold] = useState(false);
  const [soldPrice, setSoldPrice] = useState("");

  function changeStatus(
    next: PropertyStatus,
    options?: { soldPrice?: number },
  ) {
    startTransition(async () => {
      const result = await setPropertyStatus(id, next, options);
      if (!result.ok) {
        toast.error(result.error ?? "Could not update");
      } else {
        toast.success(`Marked as ${next}`);
        setConfirmSold(false);
        setSoldPrice("");
      }
    });
  }

  function openSoldDialog() {
    setSoldPrice(
      listingPrice != null && listingPrice > 0 ? String(listingPrice) : "",
    );
    setConfirmSold(true);
  }

  function handleMarkSold() {
    if (allowSoldPriceCapture) {
      const parsed = soldPrice.trim() === "" ? undefined : Number(soldPrice);
      if (parsed != null && (Number.isNaN(parsed) || parsed < 0)) {
        toast.error("Enter a valid sold price");
        return;
      }
      changeStatus("sold", parsed != null ? { soldPrice: parsed } : undefined);
      return;
    }
    changeStatus("sold");
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteProperty(id);
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
            <DropdownMenuItem
              onClick={
                allowSoldPriceCapture ? openSoldDialog : () => changeStatus("sold")
              }
            >
              Mark as sold
            </DropdownMenuItem>
          )}
          {allowDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmDelete(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmSold} onOpenChange={setConfirmSold}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as sold</DialogTitle>
            <DialogDescription>
              Enter the final sale price for <strong>{title}</strong>. Leave
              blank to use the listing price.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor={`sold-price-${id}`}>Sold price (R)</Label>
            <Input
              id={`sold-price-${id}`}
              type="number"
              min={0}
              step={1000}
              placeholder={
                listingPrice != null ? String(listingPrice) : "Sale price"
              }
              value={soldPrice}
              onChange={(e) => setSoldPrice(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmSold(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleMarkSold} disabled={isPending}>
              {isPending ? "Saving…" : "Mark as sold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
