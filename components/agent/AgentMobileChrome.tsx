"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CopyShareLinkButton } from "@/components/admin/CopyShareLinkButton";
import { AgentNavLinks } from "@/components/agent/AgentNavLinks";
import { AGENT_SITE_URL } from "@/components/agent/agent-portal-config";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { toast } from "sonner";

export function AgentMobileChrome({
  userEmail,
  userId,
}: {
  userEmail: string | null;
  userId: string;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      toast.success("Signed out");
      setMenuOpen(false);
      router.replace("/agent/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/60 bg-card px-4 py-3 md:hidden">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(100%,18rem)] p-0">
            <SheetHeader className="border-b border-border/60 px-4 py-4 text-left">
              <SheetTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Agent portal
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 p-3">
              <AgentNavLinks onNavigate={() => setMenuOpen(false)} />
              {userEmail && (
                <p
                  className="truncate rounded-md bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground"
                  title={userEmail}
                >
                  {userEmail}
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-muted-foreground hover:text-foreground"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                <LogOut className="size-4" />
                {signingOut ? "Signing out…" : "Sign out"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Link
          href="/agent/properties"
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <Image
            src="/eyethu-logo.png"
            alt="Eyethu Property Group"
            width={120}
            height={48}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>
      </header>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.06)] md:hidden">
        <p className="mb-2 text-center text-[11px] leading-snug text-muted-foreground">
          Share on WhatsApp — enquiries are attributed to you
        </p>
        <CopyShareLinkButton
          agentUserId={userId}
          siteUrl={AGENT_SITE_URL}
          actionLabel="Copy my link"
          className="h-11 w-full bg-whatsapp text-base text-whatsapp-foreground hover:bg-whatsapp/90"
        />
      </div>
    </>
  );
}
