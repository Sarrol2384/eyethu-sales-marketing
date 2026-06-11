import {
  Home,
  LayoutDashboard,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/properties", label: "Properties", icon: Home },
  { href: "/admin/agents", label: "Agents", icon: UserCog },
  { href: "/admin/leads", label: "Leads", icon: Users },
];
