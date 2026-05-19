import Image from "next/image";
import Link from "next/link";
import { Shield, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StaffLandingHero() {
  return (
    <section className="relative flex min-h-[min(100dvh,900px)] flex-col">
      <Image
        src="/hero-cape-town.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/50 to-black/75"
        aria-hidden
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-16 text-center text-white sm:px-6">
        <Image
          src="/eyethu-logo.png"
          alt="Eyethu Property Group"
          width={320}
          height={128}
          className="mb-8 h-auto max-h-24 w-auto max-w-[min(85vw,18rem)] object-contain drop-shadow-lg sm:max-h-28"
          priority
        />

        <h1 className="font-heading max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          Eyethu Property Group
        </h1>
        <p className="mt-2 text-sm font-medium uppercase tracking-widest text-white/80">
          Staff portal
        </p>

        <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/90 sm:text-lg">
          Manage listings, upload photos, capture buyer enquiries, and track
          leads — built for our Western Cape team. Sign in below to open your
          dashboard.
        </p>

        <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="h-11 w-full gap-2 sm:w-auto sm:min-w-[10rem]"
            asChild
          >
            <Link href="/admin/login">
              <Shield className="size-4 shrink-0" aria-hidden />
              Admin sign in
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 w-full gap-2 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white sm:w-auto sm:min-w-[10rem]"
            asChild
          >
            <Link href="/agent/login">
              <UserCircle className="size-4 shrink-0" aria-hidden />
              Agent sign in
            </Link>
          </Button>
        </div>

        <p className="mt-10 max-w-sm text-xs text-white/60">
          For Eyethu staff only. Buyers browse listings at the public homepage.
        </p>
      </div>
    </section>
  );
}
