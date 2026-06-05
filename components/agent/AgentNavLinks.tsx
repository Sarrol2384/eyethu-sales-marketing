"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AGENT_NAV } from "@/components/agent/agent-portal-config";

export function AgentNavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("space-y-0.5", className)}>
      {AGENT_NAV.map(({ href, label, icon: Icon, exact }) => {
        const active =
          exact === true
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/70 hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-2.5">
              <Icon className="size-4 shrink-0" />
              {label}
            </span>
            {active && <ChevronRight className="size-3.5 opacity-70" />}
          </Link>
        );
      })}
    </nav>
  );
}
