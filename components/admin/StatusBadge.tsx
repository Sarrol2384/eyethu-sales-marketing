import { Badge } from "@/components/ui/badge";
import type { PropertyStatus } from "@/lib/supabase/types";

export function StatusBadge({ status }: { status: PropertyStatus }) {
  switch (status) {
    case "published":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200">
          Published
        </Badge>
      );
    case "draft":
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          Draft
        </Badge>
      );
    case "sold":
      return (
        <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-200">
          Sold
        </Badge>
      );
  }
}
