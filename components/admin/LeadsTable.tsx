"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  MessageCircle,
  Phone,
  Mail,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatSAPhoneDisplay,
  telUrl,
  whatsappUrl,
} from "@/lib/format/phone";
import { formatRelative, formatSADateTime } from "@/lib/format/date";
import { MOVE_TIMELINE_LABELS } from "@/lib/validation/lead";
import type { LeadCategory, MoveTimeline } from "@/lib/supabase/types";
import type { LeadAgentPart } from "@/lib/leads/agent-attribution-types";
import { markLeadContacted } from "@/lib/actions/properties";

export type AdminLead = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  message: string | null;
  is_first_time_buyer: boolean;
  move_timeline: MoveTimeline | null;
  lead_score: number | null;
  lead_category: LeadCategory | null;
  ai_summary: string | null;
  contacted: boolean;
  contacted_at: string | null;
  created_at: string;
  properties: {
    id: string;
    title: string;
    slug: string;
    suburb: string;
  } | null;
  /** Combined agent label for table display. */
  agent_label: string | null;
  /** Per-role breakdown for expanded row. */
  agent_parts: LeadAgentPart[];
};

type Props = {
  leads: AdminLead[];
  currentSort: string;
  currentDir: string;
  /** Base path for sort links (default admin leads). */
  listBasePath?: string;
};

export function LeadsTable({
  leads,
  currentSort,
  currentDir,
  listBasePath = "/admin/leads",
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleSort(key: "created_at" | "score") {
    const next = new URLSearchParams(params.toString());
    if (currentSort === key) {
      next.set("dir", currentDir === "asc" ? "desc" : "asc");
    } else {
      next.set("sort", key);
      next.set("dir", "desc");
    }
    router.replace(`${listBasePath}?${next.toString()}`);
  }

  function handleMarkContacted(id: string, contacted: boolean) {
    startTransition(async () => {
      const res = await markLeadContacted(id, contacted);
      if (!res.ok) {
        toast.error(res.error ?? "Could not update");
        return;
      }
      toast.success(contacted ? "Marked as contacted" : "Marked as new");
      router.refresh();
    });
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
        <h2 className="text-lg font-semibold">No leads yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          As people enquire about your listings, they&apos;ll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Property</TableHead>
            <TableHead className="hidden sm:table-cell">Agent</TableHead>
            <TableHead>
              <button
                type="button"
                className="inline-flex items-center gap-1 font-medium"
                onClick={() => toggleSort("score")}
              >
                Score
                <ArrowUpDown className="size-3.5" />
              </button>
            </TableHead>
            <TableHead>
              <button
                type="button"
                className="inline-flex items-center gap-1 font-medium"
                onClick={() => toggleSort("created_at")}
              >
                Received
                <ArrowUpDown className="size-3.5" />
              </button>
            </TableHead>
            <TableHead className="w-[180px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              expanded={expanded === lead.id}
              onToggle={() =>
                setExpanded((prev) => (prev === lead.id ? null : lead.id))
              }
              onMarkContacted={handleMarkContacted}
              busy={isPending}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LeadRow({
  lead,
  expanded,
  onToggle,
  onMarkContacted,
  busy,
}: {
  lead: AdminLead;
  expanded: boolean;
  onToggle: () => void;
  onMarkContacted: (id: string, contacted: boolean) => void;
  busy: boolean;
}) {
  return (
    <>
      <TableRow
        className={`cursor-pointer ${lead.contacted ? "opacity-70" : ""}`}
        onClick={onToggle}
      >
        <TableCell>
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <div>
              <div className="font-medium">{lead.full_name}</div>
              <div className="text-xs text-muted-foreground">
                {formatSAPhoneDisplay(lead.phone)}
              </div>
            </div>
            {lead.lead_category === "hot" && !lead.contacted && (
              <Flame className="size-4 text-rose-500" />
            )}
          </div>
        </TableCell>
        <TableCell>
          {lead.properties ? (
            <div>
              <div className="line-clamp-1 text-sm">
                {lead.properties.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {lead.properties.suburb}
              </div>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              General enquiry
            </span>
          )}
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          {lead.agent_label ? (
            <div className="line-clamp-2 text-sm">{lead.agent_label}</div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell>
          <ScoreBar score={lead.lead_score} category={lead.lead_category} />
        </TableCell>
        <TableCell>
          <div className="text-sm" title={formatSADateTime(lead.created_at)}>
            {formatRelative(lead.created_at)}
          </div>
        </TableCell>
        <TableCell
          className="text-right"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant={lead.contacted ? "outline" : "default"}
            onClick={() => onMarkContacted(lead.id, !lead.contacted)}
            disabled={busy}
          >
            {lead.contacted ? (
              <>
                <CheckCircle2 className="size-3.5" />
                Contacted
              </>
            ) : (
              <>
                <Circle className="size-3.5" />
                Mark contacted
              </>
            )}
          </Button>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell></TableCell>
          <TableCell colSpan={6}>
            <div className="space-y-3 py-2">
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={telUrl(lead.phone)}>
                    <Phone className="size-3.5" />
                    Call
                  </a>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
                >
                  <a
                    href={whatsappUrl(
                      lead.phone,
                      `Hi ${lead.full_name.split(" ")[0]}, this is ${lead.properties ? "regarding " + lead.properties.title : "from Eyethu Property Group"}.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="size-3.5" />
                    WhatsApp
                  </a>
                </Button>
                {lead.email && (
                  <Button asChild size="sm" variant="outline">
                    <a href={`mailto:${lead.email}`}>
                      <Mail className="size-3.5" />
                      Email
                    </a>
                  </Button>
                )}
                {lead.properties && (
                  <Button asChild size="sm" variant="ghost">
                    <Link
                      href={`/property/${lead.properties.slug}`}
                      target="_blank"
                    >
                      <ExternalLink className="size-3.5" />
                      View listing
                    </Link>
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow
                  label="First-time buyer"
                  value={lead.is_first_time_buyer ? "Yes" : "No"}
                />
                <DetailRow
                  label="Move timeline"
                  value={
                    lead.move_timeline
                      ? MOVE_TIMELINE_LABELS[lead.move_timeline]
                      : "Not specified"
                  }
                />
                <DetailRow label="Email" value={lead.email ?? "—"} />
                <DetailRow
                  label="Contacted at"
                  value={
                    lead.contacted_at
                      ? formatSADateTime(lead.contacted_at)
                      : "Not yet"
                  }
                />
                {lead.agent_label && (
                  <DetailRow label="Agents" value={lead.agent_label} />
                )}
                {lead.agent_parts.length > 0 && (
                  <div className="sm:col-span-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Agent breakdown
                    </div>
                    <ul className="mt-1 space-y-0.5 text-sm">
                      {lead.agent_parts.map((part) => (
                        <li key={`${part.userId}-${part.role}`}>
                          {part.name}{" "}
                          <span className="text-muted-foreground">
                            ({part.role})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {lead.message && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Message
                  </div>
                  <p className="mt-1 whitespace-pre-wrap rounded-md bg-background p-3 text-sm">
                    {lead.message}
                  </p>
                </div>
              )}

              {lead.ai_summary && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Score reasons
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {lead.ai_summary}
                  </p>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function ScoreBar({
  score,
  category,
}: {
  score: number | null;
  category: LeadCategory | null;
}) {
  if (score === null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const cat = category ?? deriveCategory(score);
  const colour =
    cat === "hot"
      ? "bg-rose-500"
      : cat === "warm"
        ? "bg-amber-500"
        : "bg-slate-400";
  const label = cat === "hot" ? "Hot" : cat === "warm" ? "Warm" : "Cold";
  const badgeClass =
    cat === "hot"
      ? "bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-200"
      : cat === "warm"
        ? "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200"
        : "bg-slate-100 text-slate-800 hover:bg-slate-100 dark:bg-slate-900/30 dark:text-slate-200";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${colour}`}
          style={{ width: `${Math.max(4, score)}%` }}
        />
      </div>
      <Badge className={badgeClass}>
        {label} · {score}
      </Badge>
    </div>
  );
}

function deriveCategory(score: number): LeadCategory {
  if (score >= 75) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}
