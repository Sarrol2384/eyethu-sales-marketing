import Image from "next/image";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatSAPhoneDisplay,
  normalizeSAPhone,
  telUrl,
  whatsappUrl,
} from "@/lib/format/phone";

type Props = {
  name: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  propertyTitle: string;
  propertyUrl: string;
};

export function AgentCard({
  name,
  phone,
  email,
  photoUrl,
  propertyTitle,
  propertyUrl,
}: Props) {
  if (!name && !phone && !email) return null;

  const whatsappMessage = `Hi${name ? ` ${name.split(" ")[0]}` : ""}, I'm interested in "${propertyTitle}" — ${propertyUrl}`;
  const waUrl = phone ? whatsappUrl(phone, whatsappMessage) : null;
  const displayPhone = phone ? formatSAPhoneDisplay(phone) : null;
  const photo = photoUrl ?? null;
  const normalisedPhone = phone ? normalizeSAPhone(phone) : null;

  return (
    <aside className="space-y-4 rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-3">
        {photo ? (
          <Image
            src={photo}
            alt={name ?? "Agent"}
            width={56}
            height={56}
            className="size-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {(name ?? "?").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <div className="text-base font-semibold">{name ?? "Your agent"}</div>
          <div className="text-xs text-muted-foreground">
            Eyethu Property Group
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {waUrl && (
          <div className="space-y-2">
            <Button
              asChild
              className="w-full bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
            >
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                WhatsApp the agent
              </a>
            </Button>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This opens WhatsApp on your phone or computer. We only save your
              details as a lead when you use the{" "}
              <span className="font-medium text-foreground">
                Enquire about this home
              </span>{" "}
              form — that way we can follow up properly and keep your information
              in line with our privacy notice.
            </p>
          </div>
        )}
        {normalisedPhone && (
          <Button asChild variant="outline" className="w-full">
            <a href={telUrl(normalisedPhone)}>
              <Phone className="size-4" />
              {displayPhone}
            </a>
          </Button>
        )}
        {email && (
          <Button asChild variant="outline" className="w-full">
            <a href={`mailto:${email}?subject=${encodeURIComponent(`Enquiry: ${propertyTitle}`)}`}>
              <Mail className="size-4" />
              Email
            </a>
          </Button>
        )}
      </div>
    </aside>
  );
}
