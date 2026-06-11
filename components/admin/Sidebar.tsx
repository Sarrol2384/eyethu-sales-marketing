"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Plus } from "lucide-react";
import { AdminNavLinks } from "@/components/admin/AdminNavLinks";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { toast } from "sonner";
type PreviewAgent = {
  user_id: string;
  display_name: string | null;
  email: string | null;
};

export function Sidebar({ userEmail }: { userEmail: string | null }) {
  const router = useRouter();
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
      router.replace("/admin/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <aside className="max-md:hidden md:flex md:w-[17.5rem] md:shrink-0 md:flex-col border-r border-border/60 bg-card shadow-sm">
      {/* Brand */}
      <Link
        href="/admin"
        className="flex justify-center border-b border-border/60 px-4 py-5 hover:bg-muted/40 transition-colors"
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

      {/* Label */}
      <div className="px-5 pb-2 pt-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Admin
        </span>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3">
        <AdminNavLinks />
      </div>

      {previewAgents.length > 0 && (
        <div className="space-y-1.5 px-3 pb-2">
          <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Preview as agent
          </Label>
          <Select
            onValueChange={(v) => {
              if (v) {
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

      {/* New property CTA */}
      <div className="px-3 pb-3 pt-2">
        <Button asChild size="sm" className="w-full gap-2" variant="outline">
          <Link href="/admin/properties/new">
            <Plus className="size-4" />
            New property
          </Link>
        </Button>
      </div>

      {/* Footer */}
      <div className="border-t border-border/60 p-3">
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
