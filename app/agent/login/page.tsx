import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agent portal login",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ redirectTo?: string }>;

export default async function AgentLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { redirectTo } = await searchParams;
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-sm space-y-7">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/eyethu-logo.png"
            alt="Eyethu Property Group"
            width={320}
            height={128}
            className="h-auto w-full max-w-[min(100%,18rem)] max-h-28 object-contain"
            priority
          />
          <p className="text-center text-sm text-muted-foreground">
            Agent portal — sign in to manage your assigned listings.
          </p>
        </div>
        <LoginForm
          redirectTo={redirectTo ?? "/agent/properties"}
          redirectFallback="/agent/properties"
        />
      </div>
    </main>
  );
}
