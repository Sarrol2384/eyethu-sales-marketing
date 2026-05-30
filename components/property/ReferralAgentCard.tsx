"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AgentCard } from "@/components/property/AgentCard";

type ReferralAgent = {
  userId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
};

type Props = {
  propertyId: string;
  /** Listing default agent (admin-entered fields on the property). */
  defaultName: string | null;
  defaultPhone: string | null;
  defaultEmail: string | null;
  defaultPhotoUrl: string | null;
  assignedUserId: string | null;
  sourcedUserId: string | null;
  propertyTitle: string;
  propertyUrl: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveRef(urlRef: string | null): string | null {
  if (urlRef && UUID_RE.test(urlRef)) return urlRef;
  try {
    const stored = sessionStorage.getItem("eyethu_ref");
    if (stored && UUID_RE.test(stored)) return stored;
  } catch {
    // Storage blocked (private browsing) — fall through.
  }
  return null;
}

/**
 * Shows the referring agent (from `?ref=` / the stored referral code) on the
 * listing's agent card so a buyer who arrived via an agent's share link sees
 * that agent — not the listing's default (admin) contact. Falls back to the
 * listing's default agent when there is no valid referral.
 */
function listingPhotoForReferral(
  referralUserId: string,
  assignedUserId: string | null,
  sourcedUserId: string | null,
  listingPhotoUrl: string | null,
): string | null {
  const onListing =
    assignedUserId === referralUserId || sourcedUserId === referralUserId;
  if (!onListing) return null;
  return listingPhotoUrl?.trim() || null;
}

export function ReferralAgentCard({
  propertyId,
  defaultName,
  defaultPhone,
  defaultEmail,
  defaultPhotoUrl,
  assignedUserId,
  sourcedUserId,
  propertyTitle,
  propertyUrl,
}: Props) {
  const params = useSearchParams();
  const [referral, setReferral] = useState<ReferralAgent | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const ref = resolveRef(params.get("ref"));
      if (!ref) {
        if (!cancelled) setReferral(null);
        return;
      }

      try {
        const res = await fetch(
          `/api/referral-agent?id=${encodeURIComponent(ref)}&property_id=${encodeURIComponent(propertyId)}`,
        );
        if (!res.ok) {
          if (!cancelled) setReferral(null);
          return;
        }
        const body = (await res.json()) as { agent: ReferralAgent | null };
        if (!cancelled) setReferral(body.agent);
      } catch {
        if (!cancelled) setReferral(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, propertyId]);

  if (referral) {
    const photoUrl =
      referral.photoUrl ??
      listingPhotoForReferral(
        referral.userId,
        assignedUserId,
        sourcedUserId,
        defaultPhotoUrl,
      );

    return (
      <AgentCard
        name={referral.name}
        phone={referral.phone}
        email={referral.email}
        photoUrl={photoUrl}
        propertyTitle={propertyTitle}
        propertyUrl={propertyUrl}
      />
    );
  }

  return (
    <AgentCard
      name={defaultName}
      phone={defaultPhone}
      email={defaultEmail}
      photoUrl={defaultPhotoUrl}
      propertyTitle={propertyTitle}
      propertyUrl={propertyUrl}
    />
  );
}
