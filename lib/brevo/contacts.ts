import "server-only";
import { getBrevoClient } from "./client";
import { MOVE_TIMELINE_LABELS, type MoveTimelineValue } from "@/lib/validation/lead";

export type UpsertBrevoContactInput = {
  email: string | null;
  phone: string;
  firstName?: string | null;
  lastName?: string | null;
  attributes?: {
    propertyInterest?: string | null;
    suburb?: string | null;
    budget?: number | null;
    isFirstTimeBuyer?: boolean;
    moveTimeline?: MoveTimelineValue | null;
    leadCategory?: "hot" | "warm" | "cold" | null;
  };
  /** Optional Brevo list IDs to add the contact to (e.g. "leads_warm"). */
  listIds?: number[];
};

/**
 * Upsert a lead into Brevo's contact database with custom attributes.
 *
 * Brevo requires an email for `createContact`. If the lead only gave us a
 * phone number, we cannot store them in Brevo Contacts and return null.
 * (We could fall back to creating a synthetic email — we don't, to keep
 * the dataset clean.)
 */
export async function upsertBrevoContact(
  input: UpsertBrevoContactInput,
): Promise<boolean> {
  if (!input.email) return false;

  const client = getBrevoClient();
  if (!client) return false;

  const attributes: Record<string, string | number | boolean | string[]> = {};
  if (input.firstName) attributes.FIRSTNAME = input.firstName;
  if (input.lastName) attributes.LASTNAME = input.lastName;
  if (input.phone) attributes.SMS = input.phone;
  if (input.attributes?.propertyInterest) {
    attributes.PROPERTY_INTEREST = input.attributes.propertyInterest;
  }
  if (input.attributes?.suburb) attributes.SUBURB = input.attributes.suburb;
  if (typeof input.attributes?.budget === "number") {
    attributes.BUDGET = input.attributes.budget;
  }
  if (typeof input.attributes?.isFirstTimeBuyer === "boolean") {
    attributes.FIRST_TIME_BUYER = input.attributes.isFirstTimeBuyer;
  }
  if (input.attributes?.moveTimeline) {
    attributes.MOVE_TIMELINE = MOVE_TIMELINE_LABELS[input.attributes.moveTimeline];
  }
  if (input.attributes?.leadCategory) {
    attributes.LEAD_CATEGORY = input.attributes.leadCategory;
  }

  try {
    await client.contacts.createContact({
      email: input.email,
      attributes,
      updateEnabled: true,
      listIds: input.listIds,
    });
    return true;
  } catch (error) {
    // Brevo throws on duplicate contact when updateEnabled is false. With it
    // set to true, the only realistic failure modes are network/auth errors.
    console.error("[brevo] upsertBrevoContact failed", error);
    return false;
  }
}
