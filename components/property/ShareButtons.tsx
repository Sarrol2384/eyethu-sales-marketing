"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  url: string;
  title: string;
  price: string;
  suburb: string;
};

export function ShareButtons({ url, title, price, suburb }: Props) {
  const [copied, setCopied] = useState(false);

  const whatsappMessage = `${title} — ${price} (${suburb})\n${url}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
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
        {copied ? "Copied" : "Copy link"}
      </Button>
    </div>
  );
}
