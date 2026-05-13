"use client";

import { useEffect } from "react";

type Props = {
  propertyId: string;
};

/**
 * Fire-and-forget POST to /api/track-view on mount.
 *
 * Uses `navigator.sendBeacon` when available so the request survives the user
 * navigating away immediately after landing.
 */
export function ViewTracker({ propertyId }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const payload = JSON.stringify({
      property_id: propertyId,
      referrer: document.referrer || null,
      utm_source: params.get("utm_source") || null,
      utm_medium: params.get("utm_medium") || null,
      utm_campaign: params.get("utm_campaign") || null,
    });

    try {
      if ("sendBeacon" in navigator) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/track-view", blob);
        return;
      }
    } catch {
      // fall through to fetch
    }

    fetch("/api/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      /* ignore */
    });
  }, [propertyId]);

  return null;
}
