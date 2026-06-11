"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminNavLinks } from "@/components/admin/AdminNavLinks";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { toast } from "sonner";

type PreviewAgent = {
  user_id: string;
  display_name: string | null;
  email: string | null;
};

export function AdminMobileChrome({ userEmail }: { userEmail: string | null }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [previewAgents, setPreviewAgents] = useState<PreviewAgent[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/agents")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((body: { agents?: PreviewAgent[] }) => {
        if (!cancelled) setPreviewAgents(body.agents ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      toast.success("Signed out");
      setMenuOpen(false);
      router.replace("/admin/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 flex w-full items-center gap-3 border-b border-border/60 bg-card px-4 py-3 shadow-sm max-md:flex md:hidden">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="size-10 shrink-0"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[min(100%,18rem)] p-0">
          <SheetHeader className="border-b border-border/60 px-4 py-4 text-left">
            <SheetTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Admin
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 p-3">
            <AdminNavLinks onNavigate={() => setMenuOpen(false)} />

            {previewAgents.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Preview as agent
                </Label>
                <Select
                  onValueChange={(v) => {
                    if (v) {
                      setMenuOpen(false);
                      router.push(`/admin/agents/${v}`);
                    }
                  }}
                >
                  <SelectTrigger className="h-9 w-full text-left text-xs">
                    <SelectValue placeholder="Choose agent…" />
                  </SelectTrigger>
                  <SelectContent>
                    {previewAgents.map((a) => (
                      <SelectItem key={a.user_id} value={a.user_id}>
                        {a.display_name?.trim() || a.email || a.user_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button asChild size="sm" className="w-full gap-2" variant="outline">
              <Link href="/admin/properties/new" onClick={() => setMenuOpen(false)}>
                <Plus className="size-4" />
                New property
              </Link>
            </Button>

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

      <Link href="/admin" className="flex min-w-0 flex-1 items-center gap-2">
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
  );
}
