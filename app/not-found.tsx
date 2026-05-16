import Link from "next/link";
import { Home, ArrowRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
          404
        </span>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Page not found
        </h1>
        <p className="text-balance text-muted-foreground">
          This address doesn&apos;t match anything on the site. If you were
          looking for a listing, it may have been removed or the link may be
          out of date.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="size-4" />
              Browse properties
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/admin/login">
              <LogIn className="size-4" />
              Admin sign in
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
