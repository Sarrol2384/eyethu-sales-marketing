"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatZAR } from "@/lib/format/currency";

type Props = {
  suburbs: string[];
};

const PROPERTY_TYPES = ["house", "townhouse", "apartment", "land"] as const;
const BEDROOM_OPTIONS = ["1", "2", "3", "4"];
const PRICE_OPTIONS = [
  500_000, 750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000,
];

export function FilterBar({ suburbs }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const applyParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value && value !== "any") next.set(key, value);
      else next.delete(key);
      startTransition(() => {
        router.replace(next.toString() ? `/?${next.toString()}` : "/");
      });
    },
    [params, router],
  );

  function clearAll() {
    startTransition(() => router.replace("/"));
  }

  const q = params.get("q") ?? "";
  const suburb = params.get("suburb") ?? "any";
  const type = params.get("type") ?? "any";
  const beds = params.get("beds") ?? "any";
  const priceMax = params.get("price_max") ?? "any";
  const gated = params.get("gated") === "true";

  const activeCount =
    [suburb, type, beds, priceMax].filter((v) => v !== "any").length +
    (gated ? 1 : 0) +
    (q ? 1 : 0);

  const Filters = (
    <div className="grid gap-4 sm:grid-cols-2">
      <FilterField label="Suburb">
        <Select value={suburb} onValueChange={(v) => applyParam("suburb", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any suburb</SelectItem>
            {suburbs.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Type">
        <Select value={type} onValueChange={(v) => applyParam("type", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any type</SelectItem>
            {PROPERTY_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Min bedrooms">
        <Select value={beds} onValueChange={(v) => applyParam("beds", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            {BEDROOM_OPTIONS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}+ beds
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Max price">
        <Select
          value={priceMax}
          onValueChange={(v) => applyParam("price_max", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">No max</SelectItem>
            {PRICE_OPTIONS.map((p) => (
              <SelectItem key={p} value={String(p)}>
                Up to {formatZAR(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
        <Checkbox
          checked={gated}
          onCheckedChange={(v) => applyParam("gated", v === true ? "true" : null)}
        />
        <span className="text-sm">Only gated communities / secure estates</span>
      </label>

      {activeCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearAll}
          className="sm:col-span-2"
        >
          <X className="size-4" />
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        action="/"
        className="relative flex-1 min-w-[200px]"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const value = (formData.get("q") as string) || "";
          applyParam("q", value || null);
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by suburb, estate, or title"
          className="pl-9"
        />
      </form>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline">
            <SlidersHorizontal className="size-4" />
            Filters
            {activeCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                {activeCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Filter properties</SheetTitle>
          </SheetHeader>
          <div className="mt-6 px-4 pb-6">{Filters}</div>
        </SheetContent>
      </Sheet>

      {isPending && (
        <span className="text-xs text-muted-foreground">Updating…</span>
      )}
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
