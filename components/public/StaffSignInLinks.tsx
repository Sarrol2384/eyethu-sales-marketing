import Link from "next/link";

/**
 * Muted footer links for staff — not primary CTAs for home buyers.
 */
export function StaffSignInLinks() {
  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
      aria-label="Staff and legal"
    >
      <Link
        href="/admin/login"
        className="underline-offset-2 hover:text-foreground hover:underline"
      >
        Admin sign in
      </Link>
      <span aria-hidden className="text-border">
        ·
      </span>
      <Link
        href="/agent/login"
        className="underline-offset-2 hover:text-foreground hover:underline"
      >
        Agent sign in
      </Link>
      <span aria-hidden className="text-border">
        ·
      </span>
      <Link
        href="/privacy"
        className="underline-offset-2 hover:text-foreground hover:underline"
      >
        Privacy
      </Link>
    </nav>
  );
}
