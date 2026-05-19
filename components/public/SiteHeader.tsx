import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <Image
            src="/eyethu-logo.png"
            alt="Eyethu Property Group"
            width={280}
            height={112}
            className="h-auto max-h-14 w-auto max-w-[min(55vw,12rem)] object-contain sm:max-h-16 sm:max-w-[14rem]"
            priority
          />
        </Link>
        <div className="hidden items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex">
          <MapPin className="size-3 shrink-0 text-primary" aria-hidden />
          Western Cape · South Africa
        </div>
      </div>
    </header>
  );
}
