"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyShareLinkButton } from "@/components/admin/CopyShareLinkButton";
import { AgentNavLinks } from "@/components/agent/AgentNavLinks";
import { AGENT_SITE_URL } from "@/components/agent/agent-portal-config";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function AgentSidebar({
  userEmail,
  userId,
}: {
  userEmail: string | null;
  userId: string;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      toast.success("Signed out");
      router.replace("/agent/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <aside className="hidden w-[17.5rem] shrink-0 border-r border-border/60 bg-card shadow-sm md:flex md:flex-col">
      <Link
        href="/agent/properties"
        className="flex justify-center border-b border-border/60 px-4 py-5 transition-colors hover:bg-muted/40"
      >
        <Image
          src="/eyethu-logo.png"
          alt="Eyethu Property Group"
          width={320}
          height={128}
          className="h-auto max-h-[5.75rem] w-auto max-w-full object-contain"
          sizes="(min-width: 768px) 15rem, 100vw"
          priority
        />
      </Link>

      <div className="px-5 pb-2 pt-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Agent portal
        </span>
      </div>

      <AgentNavLinks className="flex-1 px-3" />

      <div className="space-y-3 border-t border-border/60 p-3">
        <div className="rounded-md border bg-muted/30 p-2.5">
          <p className="mb-2 text-[11px] leading-snug text-muted-foreground">
            Share this link on social or WhatsApp — enquiries are attributed to
            you.
          </p>
          <CopyShareLinkButton
            agentUserId={userId}
            siteUrl={AGENT_SITE_URL}
            actionLabel="Copy my link"
            className="w-full"
          />
        </div>
        {userEmail && (
          <div
            className="mb-2 truncate rounded-md bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground"
            title={userEmail}
          >
            {userEmail}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          <LogOut className="size-4" />
          {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </aside>
  );
}
