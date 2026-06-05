import { Home, Users, type LucideIcon } from "lucide-react";

export const AGENT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3010";

export type AgentNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const AGENT_NAV: AgentNavItem[] = [
  { href: "/agent/properties", label: "My properties", icon: Home },
  { href: "/agent/leads", label: "My leads", icon: Users },
];
