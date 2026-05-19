import Link from "next/link";
import { Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/public/SiteHeader";
import { SiteFooter } from "@/components/public/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
            404
          </span>
          <h1 className="font-heading text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Page not found
          </h1>
          <p className="text-balance text-muted-foreground">
            This address doesn&apos;t match anything on the site. If you were
            looking for a listing, it may have been removed or the link may be
            out of date.
          </p>
          <div className="pt-2">
            <Button asChild size="lg" className="gap-2">
              <Link href="/">
                <Home className="size-4" aria-hidden />
                Browse properties
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
