"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function safeAuthRedirect(candidate: string, fallback: string): string {
  if (
    !candidate.startsWith("/") ||
    candidate.includes("//") ||
    candidate.includes(":")
  ) {
    return fallback;
  }
  if (candidate === "/admin/login" || candidate === "/agent/login") {
    return fallback;
  }
  if (candidate.startsWith("/admin/") || candidate === "/admin") {
    return candidate;
  }
  if (candidate.startsWith("/agent/") || candidate === "/agent") {
    return candidate;
  }
  return fallback;
}

export function LoginForm({
  redirectTo,
  redirectFallback = "/admin",
}: {
  redirectTo: string;
  /** Used when redirectTo is missing or not an allowed internal path. */
  redirectFallback?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Welcome back!");
      router.replace(safeAuthRedirect(redirectTo, redirectFallback));
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isNetwork =
        err instanceof TypeError ||
        msg === "Failed to fetch" ||
        msg.toLowerCase().includes("fetch");
      if (isNetwork) {
        toast.error(
          "Cannot reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL is https://your-project.supabase.co (no spaces or quotes), use the anon JWT from Settings → API, save .env.local, restart npm run dev, and try turning off VPN/ad blockers.",
          { duration: 12_000 },
        );
        return;
      }
      toast.error(msg || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border bg-card p-6"
    >
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@eyethu.example"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        <LogIn className="size-4" />
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
