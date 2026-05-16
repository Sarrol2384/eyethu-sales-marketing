"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Send, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  leadSubmissionSchema,
  MOVE_TIMELINE_LABELS,
  type LeadSubmission,
  type MoveTimelineValue,
} from "@/lib/validation/lead";

type Props = {
  propertyId: string;
  propertyTitle: string;
  cta: string;
};

const TIMELINE_OPTIONS: MoveTimelineValue[] = [
  "asap",
  "1_3_months",
  "3_6_months",
  "6_plus_months",
  "just_browsing",
];

export function LeadCaptureForm({ propertyId, propertyTitle, cta }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [submittedWithoutEmail, setSubmittedWithoutEmail] = useState(false);

  const form = useForm<LeadSubmission>({
    // Cast — zod 4 distinguishes input vs output types when defaults exist; we
    // don't use any transforms so input/output values are interchangeable here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(leadSubmissionSchema) as any,
    defaultValues: {
      property_id: propertyId,
      full_name: "",
      phone: "",
      email: "",
      message: "",
      is_first_time_buyer: false,
      move_timeline: null,
      consent: false as unknown as true,
      hp_field: "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: LeadSubmission) {
    try {
      const utm = readUtm();
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          ...utm,
          source: typeof window !== "undefined" ? window.location.pathname : null,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }

      const hadEmail = Boolean(values.email?.trim());
      setSubmittedWithoutEmail(!hadEmail);
      setSubmitted(true);
      toast.success("Thanks! We'll be in touch shortly.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    }
  }

  if (submitted) {
    return (
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 className="size-12 text-primary" />
          <div className="text-lg font-semibold">Thanks for getting in touch!</div>
          <p className="max-w-md text-sm text-muted-foreground">
            We&apos;ve received your enquiry about{" "}
            <strong>{propertyTitle}</strong>. One of our agents will call you
            shortly.
            {submittedWithoutEmail ? (
              <>
                {" "}
                You didn&apos;t add an email, so we won&apos;t send a
                confirmation message — we&apos;ll use the phone number you
                gave.
              </>
            ) : (
              <>
                {" "}
                Watch your inbox for a short confirmation email.
              </>
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  const isFirstTimeBuyer = watch("is_first_time_buyer");
  const moveTimeline = watch("move_timeline");
  const consent = watch("consent") as unknown as boolean;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Enquire about this home</CardTitle>
        <p className="text-sm text-muted-foreground">
          Leave your details and an Eyethu PG agent will be in touch.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Honeypot — invisible to humans, irresistible to bots */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-10000px",
              top: "auto",
              width: 1,
              height: 1,
              overflow: "hidden",
            }}
          >
            <label>
              Leave this field empty
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                {...register("hp_field")}
              />
            </label>
          </div>

          <Field
            label="Full name"
            required
            error={errors.full_name?.message}
            htmlFor="lead-name"
          >
            <Input
              id="lead-name"
              autoComplete="name"
              placeholder="e.g. Thandi Mokoena"
              {...register("full_name")}
            />
          </Field>

          <Field
            label="Phone"
            required
            error={errors.phone?.message}
            htmlFor="lead-phone"
            hint="SA number, e.g. 082 555 0123"
          >
            <Input
              id="lead-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="082 555 0123"
              {...register("phone")}
            />
          </Field>

          <Field
            label="Email"
            error={errors.email?.message}
            htmlFor="lead-email"
            hint="Optional — we'll send a confirmation if you add it."
          >
            <Input
              id="lead-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.co.za"
              {...register("email")}
            />
          </Field>

          <Field
            label="When do you want to move?"
            error={errors.move_timeline?.message}
            htmlFor="lead-timeline"
          >
            <Select
              value={moveTimeline ?? undefined}
              onValueChange={(v) =>
                setValue("move_timeline", v as MoveTimelineValue, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="lead-timeline">
                <SelectValue placeholder="Choose a timeline" />
              </SelectTrigger>
              <SelectContent>
                {TIMELINE_OPTIONS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {MOVE_TIMELINE_LABELS[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="Message"
            error={errors.message?.message}
            htmlFor="lead-message"
          >
            <Textarea
              id="lead-message"
              rows={3}
              placeholder="Anything you'd like us to know?"
              {...register("message")}
            />
          </Field>

          <label className="flex items-start gap-3 rounded-md border bg-background p-3 text-sm cursor-pointer">
            <Checkbox
              checked={isFirstTimeBuyer}
              onCheckedChange={(v) =>
                setValue("is_first_time_buyer", v === true, {
                  shouldValidate: true,
                })
              }
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">I&apos;m a first-time buyer.</span>{" "}
              <span className="text-muted-foreground">
                Tick this and we&apos;ll mention FLISP subsidy options when we
                chat.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <Checkbox
              checked={consent === true}
              onCheckedChange={(v) =>
                setValue("consent", (v === true) as unknown as true, {
                  shouldValidate: true,
                })
              }
              className="mt-0.5"
            />
            <span>
              I agree that Eyethu Property Group may contact me about properties
              and store my details in line with their{" "}
              <a
                href="/privacy"
                className="text-primary underline-offset-2 hover:underline"
              >
                privacy notice
              </a>
              .
            </span>
          </label>
          {errors.consent?.message && (
            <p className="text-sm text-destructive">{errors.consent.message}</p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            <Send className="size-4" />
            {isSubmitting ? "Sending…" : cta}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function readUtm() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  // Also check sessionStorage in case the ?ref was set on a previous page load.
  const refFromStorage = sessionStorage.getItem("eyethu_ref");
  const ref = params.get("ref") || refFromStorage || null;
  return {
    utm_source: params.get("utm_source") || null,
    utm_medium: params.get("utm_medium") || null,
    utm_campaign: params.get("utm_campaign") || null,
    ref,
  };
}
