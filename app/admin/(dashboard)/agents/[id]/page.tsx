import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Eye, Pencil } from "lucide-react";
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
import { formatZAR } from "@/lib/format/currency";
import { formatRelative } from "@/lib/format/date";
import type {
  AgentAccountRow,
  PropertyStatus,
  PropertyType,
} from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  property_images: Array<{
    image_url: string;
    is_primary: boolean;
    display_order: number;
  }>;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminAgentPreviewPage({ params }: PageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: agent } = await supabase
    .from("agent_accounts")
    .select("user_id, display_name, email, phone")
    .eq("user_id", id)
    .maybeSingle();

  if (!agent) notFound();

  const agentRow = agent as Pick<
    AgentAccountRow,
    "user_id" | "display_name" | "email" | "phone"
  >;

  const { data } = await supabase
    .from("properties")
    .select(
      `id, title, slug, suburb, status, property_type, price, bedrooms, bathrooms, updated_at,
       property_images ( image_url, is_primary, display_order )`,
    )
    .or(`assigned_user_id.eq.${id},sourced_by_user_id.eq.${id}`)
    .order("updated_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];
  const label =
    agentRow.display_name ?? agentRow.email ?? agentRow.user_id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/admin/agents">
            <ArrowLeft className="size-4" />
            Agents
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Viewing portal as {label}
        </h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} listing{rows.length === 1 ? "" : "s"} this agent manages
          or sourced. This is an admin preview — edits open in the full admin
          editor.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
          <h2 className="text-lg font-semibold">No listings for this agent</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign them as manager or set them as sourcing agent from{" "}
            <Link className="text-primary underline" href="/admin/properties">
              Properties
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]"></TableHead>
                <TableHead>Title</TableHead>
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
                          asChild
                          title="Edit in admin"
                        >
                          <Link href={`/admin/properties/${row.id}/edit`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
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
