import Link from "next/link";
import { Home, Users, Eye, TrendingUp, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/format/date";
import { formatZAR } from "@/lib/format/currency";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalListings,
    publishedListings,
    leadsThisMonth,
    hotLeads,
    recentLeads,
    monthLeadsForRanking,
    monthViewsForRanking,
  ] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString()),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("lead_category", "hot")
      .eq("contacted", false),
    supabase
      .from("leads")
      .select(
        "id, full_name, lead_category, lead_score, created_at, properties:property_id (title, suburb)",
      )
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("leads")
      .select("property_id, properties:property_id (title, suburb, price)")
      .gte("created_at", startOfMonth.toISOString()),
    supabase
      .from("page_views")
      .select("property_id, properties:property_id (title, suburb)")
      .gte("viewed_at", startOfMonth.toISOString()),
  ]);

  const topByLeads = monthLeadsForRanking.data ?? [];
  const topByViews = monthViewsForRanking.data ?? [];

  const leadsByProperty = aggregateByProperty(
    topByLeads as unknown as Array<{
      property_id: string | null;
      properties: { title: string; suburb: string; price: number } | null;
    }>,
  );
  const viewsByProperty = aggregateByProperty(
    topByViews as unknown as Array<{
      property_id: string | null;
      properties: { title: string; suburb: string } | null;
    }>,
  );

  const recentLeadRows = (recentLeads.data ?? []) as unknown as Array<{
    id: string;
    full_name: string;
    lead_category: "hot" | "warm" | "cold" | null;
    lead_score: number | null;
    created_at: string;
    properties: { title: string; suburb: string } | null;
  }>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Activity overview for your Eyethu Property Group listings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Home}
          label="Total listings"
          value={totalListings.count ?? 0}
          subtitle={`${publishedListings.count ?? 0} published`}
        />
        <StatTile
          icon={Users}
          label="Leads this month"
          value={leadsThisMonth.count ?? 0}
          subtitle="Since the 1st"
        />
        <StatTile
          icon={Flame}
          label="Hot leads (uncontacted)"
          value={hotLeads.count ?? 0}
          subtitle={
            (hotLeads.count ?? 0) > 0 ? "Needs attention" : "All caught up"
          }
          highlight={(hotLeads.count ?? 0) > 0}
        />
        <StatTile
          icon={Eye}
          label="Page views this month"
          value={viewsByProperty.total}
          subtitle="Across all listings"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLeadRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No leads yet. They&apos;ll appear here as people enquire.
              </p>
            ) : (
              recentLeadRows.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {lead.full_name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {lead.properties
                        ? `${lead.properties.title} · ${lead.properties.suburb}`
                        : "General enquiry"}{" "}
                      · {formatRelative(lead.created_at)}
                    </div>
                  </div>
                  {lead.lead_category && (
                    <CategoryBadge category={lead.lead_category} />
                  )}
                </div>
              ))
            )}
            <div className="pt-1 text-right">
              <Link
                href="/admin/leads"
                className="text-sm text-primary hover:underline"
              >
                View all leads →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-primary" />
              Top listings (this month)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Section
              title="By leads"
              empty="No leads yet this month."
              rows={leadsByProperty.top.map((r) => ({
                key: r.id,
                label: r.title,
                sub:
                  r.suburb +
                  (r.price ? ` · ${formatZAR(Number(r.price))}` : ""),
                count: r.count,
                countLabel: "lead",
              }))}
            />
            <Section
              title="By page views"
              empty="No views yet this month."
              rows={viewsByProperty.top.map((r) => ({
                key: r.id,
                label: r.title,
                sub: r.suburb,
                count: r.count,
                countLabel: "view",
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  subtitle,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  subtitle?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary/40 bg-primary/5" : undefined}>
      <CardContent className="flex items-start gap-3 pt-6">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold leading-none tabular-nums">
            {value}
          </div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          {subtitle && (
            <div className="mt-0.5 text-xs text-muted-foreground/80">
              {subtitle}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryBadge({ category }: { category: "hot" | "warm" | "cold" }) {
  if (category === "hot") {
    return (
      <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-200">
        Hot
      </Badge>
    );
  }
  if (category === "warm") {
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200">
        Warm
      </Badge>
    );
  }
  return <Badge variant="secondary">Cold</Badge>;
}

function Section({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: Array<{
    key: string;
    label: string;
    sub: string;
    count: number;
    countLabel: string;
  }>;
  empty: string;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.key}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{r.label}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {r.sub}
                </div>
              </div>
              <Badge variant="outline" className="shrink-0">
                {r.count} {r.countLabel}
                {r.count === 1 ? "" : "s"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function aggregateByProperty<
  T extends {
    property_id: string | null;
    properties: { title: string; suburb: string; price?: number } | null;
  },
>(rows: T[]) {
  const counts = new Map<
    string,
    { id: string; title: string; suburb: string; price?: number; count: number }
  >();
  let total = 0;
  for (const row of rows) {
    if (!row.property_id || !row.properties) continue;
    total++;
    const existing = counts.get(row.property_id);
    if (existing) {
      existing.count++;
    } else {
      counts.set(row.property_id, {
        id: row.property_id,
        title: row.properties.title,
        suburb: row.properties.suburb,
        price: row.properties.price,
        count: 1,
      });
    }
  }
  const top = Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  return { top, total };
}
