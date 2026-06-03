import { NextResponse } from "next/server";
import { leadSubmissionSchema } from "@/lib/validation/lead";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { normalizeSAPhone } from "@/lib/format/phone";
import { scoreLead } from "@/lib/leads/score";
import { generateLeadSummary } from "@/lib/ai/lead-summary";
import { findRecentLeadForDedupe } from "@/lib/leads/find-recent-lead";
import {
  sendAgentLeadEmailWithRetry,
  sendLeadConfirmationEmailWithRetry,
} from "@/lib/brevo/email";
import { getBrevoClient } from "@/lib/brevo/client";
import { sendAgentLeadSMS } from "@/lib/brevo/sms";
import { upsertBrevoContact } from "@/lib/brevo/contacts";
import {
  checkRateLimit,
  clientIpFromRequest,
} from "@/lib/api/rate-limit";
import {
  resolveAgentLeadEmailRecipient,
  resolveAgentLeadSmsPhone,
  type PropertyNotifyContext,
} from "@/lib/leads/resolve-agent-notify";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3010";

const NOTIFY_FAILED_MESSAGE =
  "We saved your enquiry but could not reach our team by email. Please try again in a minute or WhatsApp the agent below.";

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const rl = checkRateLimit(`leads:${ip}`, { max: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many submissions — please wait a minute and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = leadSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check your details and try again.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  if (parsed.data.hp_field && parsed.data.hp_field.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const normalisedPhone = normalizeSAPhone(parsed.data.phone)!;
  const email =
    parsed.data.email && parsed.data.email.length > 0
      ? parsed.data.email
      : null;
  const message =
    parsed.data.message && parsed.data.message.length > 0
      ? parsed.data.message
      : null;

  const supabase = createSupabaseServiceClient();

  let property: PropertyNotifyContext | null = null;
  if (parsed.data.property_id) {
    const { data } = await supabase
      .from("properties")
      .select(
        "id, title, slug, suburb, price, agent_name, agent_email, agent_phone, assigned_user_id, sourced_by_user_id",
      )
      .eq("id", parsed.data.property_id)
      .maybeSingle();
    property = (data as unknown as PropertyNotifyContext | null) ?? null;
  }

  let attributedAgentUserId: string | null = null;
  if (parsed.data.ref) {
    const { data: agentAcct } = await supabase
      .from("agent_accounts")
      .select("user_id")
      .eq("user_id", parsed.data.ref)
      .maybeSingle();
    if (agentAcct) {
      attributedAgentUserId = agentAcct.user_id;
    }
  }

  const { score, category, reasons } = scoreLead({
    isFirstTimeBuyer: parsed.data.is_first_time_buyer,
    moveTimeline: parsed.data.move_timeline ?? null,
    hasEmail: !!email,
    hasMessage: !!message,
    propertyPrice: property?.price ?? null,
  });

  const ruleSummary = reasons.join(" · ");
  const aiNarrative = await generateLeadSummary(
    {
      fullName: parsed.data.full_name.trim(),
      phone: normalisedPhone,
      email,
      message,
      isFirstTimeBuyer: parsed.data.is_first_time_buyer,
      moveTimeline: parsed.data.move_timeline ?? null,
      score,
      category,
      ruleReasons: reasons,
      property: property
        ? {
            title: property.title,
            suburb: property.suburb,
            price: Number(property.price),
          }
        : null,
    },
    { timeoutMs: 8_000 },
  );
  const aiSummary = aiNarrative ?? ruleSummary;

  const propertyId = property?.id ?? null;
  const recent = await findRecentLeadForDedupe(
    supabase,
    propertyId,
    normalisedPhone,
  );

  let leadId: string;

  if (recent) {
    leadId = recent.id;
    console.info("[leads] reusing recent lead for dedupe", { leadId, propertyId });
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("leads")
      .insert({
        property_id: propertyId,
        full_name: parsed.data.full_name.trim(),
        phone: normalisedPhone,
        email,
        message,
        is_first_time_buyer: parsed.data.is_first_time_buyer,
        move_timeline: parsed.data.move_timeline ?? null,
        source: parsed.data.source ?? null,
        utm_source: parsed.data.utm_source ?? null,
        utm_medium: parsed.data.utm_medium ?? null,
        utm_campaign: parsed.data.utm_campaign ?? null,
        lead_score: score,
        lead_category: category,
        ai_summary: aiSummary,
        attributed_agent_user_id: attributedAgentUserId,
        contacted: false,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("[leads] insert failed", insertError);
      return NextResponse.json(
        { error: "Could not save your enquiry. Please try again." },
        { status: 500 },
      );
    }
    leadId = inserted.id;
  }

  const [firstName, ...lastNameParts] = parsed.data.full_name.trim().split(/\s+/);

  const agentEmailRecipient = await resolveAgentLeadEmailRecipient(
    supabase,
    property,
    attributedAgentUserId,
  );

  const brevoConfigured = getBrevoClient() !== null;
  let agentEmailSent = false;

  if (agentEmailRecipient) {
    if (brevoConfigured) {
      const agentMail = await sendAgentLeadEmailWithRetry({
        agentEmail: agentEmailRecipient.email,
        agentName: agentEmailRecipient.name,
        leadName: parsed.data.full_name,
        leadPhone: normalisedPhone,
        leadEmail: email,
        leadMessage: message,
        isFirstTimeBuyer: parsed.data.is_first_time_buyer,
        moveTimeline: parsed.data.move_timeline ?? null,
        property: property
          ? {
              title: property.title,
              suburb: property.suburb,
              price: Number(property.price),
              slug: property.slug,
            }
          : null,
        siteUrl: SITE_URL,
      });

      if (!agentMail.ok) {
        console.error("[leads] agent notification failed", {
          leadId,
          error: agentMail.error,
        });
        return NextResponse.json(
          {
            error: NOTIFY_FAILED_MESSAGE,
            lead: { id: leadId, score, category },
            notificationFailed: true,
          },
          { status: 503 },
        );
      }
      agentEmailSent = agentMail.value !== null;
    } else {
      console.warn(
        "[leads] BREVO_API_KEY not set — lead saved without agent email",
        { leadId, agentEmail: agentEmailRecipient.email },
      );
    }
  } else if (property ?? attributedAgentUserId) {
    console.warn(
      "[leads] no agent email recipient — property card, ref agent, and roster emails all empty",
      { propertyId: property?.id ?? null, attributedAgentUserId },
    );
  }

  const sideEffects: Array<Promise<unknown>> = [];

  if (email) {
    sideEffects.push(
      sendLeadConfirmationEmailWithRetry({
        leadEmail: email,
        leadName: parsed.data.full_name,
        property: property
          ? {
              title: property.title,
              suburb: property.suburb,
              slug: property.slug,
            }
          : null,
        agentName: property?.agent_name ?? null,
        agentPhone: property?.agent_phone ?? null,
        siteUrl: SITE_URL,
      }).then((result) => {
        if (!result.ok) {
          console.error("[leads] sendLeadConfirmationEmail failed", result.error);
        }
        return result;
      }),
    );
  }

  const agentSmsPhone = await resolveAgentLeadSmsPhone(
    supabase,
    property,
    attributedAgentUserId,
  );

  if (category === "hot" && agentSmsPhone && property) {
    sideEffects.push(
      sendAgentLeadSMS({
        agentPhone: agentSmsPhone,
        leadName: parsed.data.full_name,
        leadPhone: normalisedPhone,
        propertyTitle: property.title,
        suburb: property.suburb,
      }).catch((err) => console.error("[leads] sendAgentLeadSMS failed", err)),
    );
  }

  if (email) {
    sideEffects.push(
      upsertBrevoContact({
        email,
        phone: normalisedPhone,
        firstName,
        lastName: lastNameParts.join(" ") || null,
        attributes: {
          propertyInterest: property?.title ?? null,
          suburb: property?.suburb ?? null,
          budget: property?.price ?? null,
          isFirstTimeBuyer: parsed.data.is_first_time_buyer,
          moveTimeline: parsed.data.move_timeline ?? null,
          leadCategory: category,
        },
      }).catch((err) =>
        console.error("[leads] upsertBrevoContact failed", err),
      ),
    );
  }

  await Promise.allSettled(sideEffects);

  console.info("[leads] enquiry complete", {
    leadId,
    agentEmailSent,
    confirmationAttempted: !!email,
    category,
  });

  return NextResponse.json({
    ok: true,
    lead: { id: leadId, score, category },
  });
}
