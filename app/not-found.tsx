import Link from "next/link";
import { Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
          404
        </span>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          That listing has flown the coop
        </h1>
        <p className="text-balance text-muted-foreground">
          It might have been sold, taken off the market, or moved. Have a look
          at what we have available right now.
        </p>
        <Button asChild size="lg">
          <Link href="/">
            <Home className="size-4" />
            Browse all properties
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </main>
  );
}
