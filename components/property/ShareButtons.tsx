"use client";

import { useMemo, useState } from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  url: string;
  title: string;
  price: string;
  suburb: string;
  /** Logged-in agent: share/copy URLs include ?ref= for enquiry attribution */
  referralUserId?: string | null;
};

function withReferralParam(
  url: string,
  referralUserId: string | null | undefined,
): string {
  if (!referralUserId?.trim()) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("ref", referralUserId.trim());
    return u.toString();
  } catch {
    return url;
  }
}

export function ShareButtons({
  url,
  title,
  price,
  suburb,
  referralUserId,
}: Props) {
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(
    () => withReferralParam(url, referralUserId),
    [url, referralUserId],
  );

  const whatsappMessage = `${title} — ${price} (${suburb})\n${shareUrl}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(
        referralUserId ? "Referral link copied" : "Link copied",
      );
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          asChild
          className="bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
        >
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4" />
            Share on WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={facebookHref} target="_blank" rel="noopener noreferrer">
            <Share2 className="size-4" />
            Facebook
          </a>
        </Button>
        <Button variant="outline" onClick={handleCopy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied
            ? "Copied"
            : referralUserId
              ? "Copy my referral link"
              : "Copy link"}
        </Button>
      </div>
      {referralUserId ? (
        <p className="text-xs text-muted-foreground">
          Links you share here include your referral code. When someone uses the
          enquiry form on that link, you get credit in the dashboard.
        </p>
      ) : null}
    </div>
  );
}
