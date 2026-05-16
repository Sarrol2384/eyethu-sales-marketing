"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Reads the ?ref=<agent_user_id> query param on any page load and persists it
 * to sessionStorage so it survives navigation to a listing page before the
 * buyer submits an enquiry form.
 */
export function RefTracker() {
  const params = useSearchParams();

  useEffect(() => {
    const ref = params.get("ref");
    if (ref) {
      try {
        sessionStorage.setItem("eyethu_ref", ref);
      } catch {
        // Private browsing / storage blocked — ignore silently.
      }
    }
  }, [params]);

  return null;
}
