import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/80 bg-muted/20">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-4 py-10 sm:px-6 lg:px-8">
        <Image
          src="/eyethu-logo.png"
          alt="Eyethu Property Group"
          width={240}
          height={96}
          className="h-auto max-h-14 w-auto max-w-[min(90vw,13rem)] object-contain opacity-80"
        />
        <p className="text-center text-xs text-muted-foreground">
          MJG Real Estate T/A Eyethu Property Group · Cape Town · Western Cape
        </p>
        <Link
          href="/privacy"
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Privacy
        </Link>
      </div>
    </footer>
  );
}
