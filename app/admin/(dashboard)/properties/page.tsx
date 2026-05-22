import Link from "next/link";
import Image from "next/image";
import { Pencil, Plus, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PropertyRowActions } from "@/components/admin/PropertyRowActions";
import { fetchAgentRosterForAdmin } from "@/lib/agents/fetch-agent-roster";
import { formatZAR } from "@/lib/format/currency";
import { formatRelative } from "@/lib/format/date";
import type {
  PropertyStatus,
  PropertyType,
} from "@/lib/supabase/types";

type Row = {
  id: string;
  title: string;
  slug: string;
  suburb: string;
  status: PropertyStatus;
  property_type: PropertyType;
  price: number;
  bedrooms: number;
  bathrooms: number;
  updated_at: string;
  sourced_by_user_id: string | null;
  property_images: Array<{
    image_url: string;
    is_primary: boolean;
    display_order: number;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PropertiesListPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("properties")
    .select(
      `id, title, slug, suburb, status, property_type, price, bedrooms, bathrooms, updated_at, sourced_by_user_id,
       property_images ( image_url, is_primary, display_order )`,
    )
    .order("updated_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  const sourcedIds = [
    ...new Set(
      rows
        .map((r) => r.sourced_by_user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const sourcingLabelByUserId = new Map<string, string>();
  if (sourcedIds.length > 0) {
    const { agents: sourcingAgents } = await fetchAgentRosterForAdmin();
    for (const a of sourcingAgents) {
      if (!sourcedIds.includes(a.user_id)) continue;
      const label =
        a.display_name?.trim() || a.email?.trim() || a.user_id.slice(0, 8);
      sourcingLabelByUserId.set(a.user_id, label);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} listing{rows.length === 1 ? "" : "s"} total.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/properties/new">
            <Plus className="size-4" />
            New property
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
          <h2 className="text-lg font-semibold">No properties yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first listing to get started.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/properties/new">
              <Plus className="size-4" />
              Add your first property
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Sourcing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="hidden sm:table-cell">Updated</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const primary =
                  row.property_images.find((i) => i.is_primary) ??
                  row.property_images.sort(
                    (a, b) => a.display_order - b.display_order,
                  )[0];
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      {primary ? (
                        <div className="relative size-10 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={primary.image_url}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <Eye className="size-3.5" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{row.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.suburb} · {row.bedrooms} bed, {row.bathrooms} bath
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[10rem] truncate text-sm text-muted-foreground md:table-cell">
                      {row.sourced_by_user_id
                        ? (sourcingLabelByUserId.get(row.sourced_by_user_id) ??
                          "—")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="capitalize">
                      {row.property_type}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatZAR(Number(row.price))}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                      {formatRelative(row.updated_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {row.status === "published" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            title="View listing"
                          >
                            <Link
                              href={`/property/${row.slug}`}
                              target="_blank"
                            >
                              <ExternalLink className="size-4" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-11 shrink-0 sm:size-9"
                          asChild
                          title="Edit"
                        >
                          <Link
                            href={`/admin/properties/${row.id}/edit`}
                            prefetch={false}
                          >
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <PropertyRowActions
                          id={row.id}
                          status={row.status}
                          title={row.title}
                          allowSoldPriceCapture
                          listingPrice={Number(row.price)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
