"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  agentUserId: string;
  siteUrl: string;
  /** Visible button label before / after copy (default: "Share link"). */
  actionLabel?: string;
  className?: string;
};

export function CopyShareLinkButton({
  agentUserId,
  siteUrl,
  actionLabel = "Share link",
  className,
}: Props) {
  const [copied, setCopied] = useState(false);

  const link = `${siteUrl}/?ref=${agentUserId}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers.
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      title={link}
      className={cn(className)}
    >
      {copied ? (
        <Check className="size-3.5 text-green-600" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {copied ? "Copied!" : actionLabel}
    </Button>
  );
}
