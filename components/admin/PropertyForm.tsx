"use client";

import dynamic from "next/dynamic";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save, Sparkles, Loader2 } from "lucide-react";
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
  propertyFormSchema,
  FEATURE_OPTIONS,
  type PropertyFormInput,
} from "@/lib/validation/property";
import {
  buildGenerateContentRequest,
  firstZodIssueMessage,
  generateContentRequestSchema,
} from "@/lib/validation/generate-content";
import { createProperty, updateProperty } from "@/lib/actions/properties";

const ImageUploader = dynamic(
  () => import("./ImageUploader").then((m) => m.ImageUploader),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground">Loading photo uploader…</p>
    ),
  },
);

const AgentPhotoUpload = dynamic(
  () => import("./AgentPhotoUpload").then((m) => m.AgentPhotoUpload),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground">Loading photo uploader…</p>
    ),
  },
);

export type PropertyFormAgentOption = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
};

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  propertyId?: string;
  initialValues?: Partial<PropertyFormInput>;
  initialImages?: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
    display_order: number;
  }>;
  /** When true, show field to assign listing to an agent (Supabase Auth email). */
  allowAgentAssignment?: boolean;
  /** When set, admin can pick an agent from the roster (requires migration profile columns). */
  agents?: PropertyFormAgentOption[];
  /** Used after create and for navigation context; default `/admin/properties`. */
  propertiesBasePath?: string;
};

const DEFAULT_VALUES: PropertyFormInput = {
  title: "",
  property_type: "house",
  listing_type: "sale",
  status: "draft",
  price: 0,
  address: "",
  suburb: "",
  city: "Cape Town",
  province: "Western Cape",
  is_gated_community: false,
  gated_community_name: "",
  bedrooms: 0,
  bathrooms: 0,
  garages: 0,
  parking_spaces: 0,
  floor_size_sqm: undefined,
  erf_size_sqm: undefined,
  year_built: undefined,
  features: [],
  manual_description: "",
  ai_description: "",
  ai_seo_title: "",
  ai_seo_description: "",
  ai_neighbourhood_summary: "",
  ai_headline: "",
  ai_cta: "",
  agent_name: "",
  agent_phone: "",
  agent_email: "",
  agent_photo_url: "",
  assigned_agent_email: "",
  assigned_user_id: "",
  sourced_by_user_id: "",
  commission_percent: undefined,
  commission_amount: undefined,
  sold_price: undefined,
};

export function PropertyForm({
  mode,
  propertyId,
  initialValues,
  initialImages = [],
  allowAgentAssignment = false,
  agents = [],
  propertiesBasePath = "/admin/properties",
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [aiLoading, setAiLoading] = useState(false);

  const form = useForm<PropertyFormInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(propertyFormSchema) as any,
    defaultValues: { ...DEFAULT_VALUES, ...initialValues },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = form;

  const features = watch("features") ?? [];
  const isGated = watch("is_gated_community");
  const status = watch("status");
  const propertyType = watch("property_type");
  const listingType = watch("listing_type");
  const assignedUserId = watch("assigned_user_id");
  const sourcedByUserId = watch("sourced_by_user_id");
  const agentPhotoUrl = watch("agent_photo_url") ?? "";

  function toggleFeature(feature: string) {
    const next = features.includes(feature)
      ? features.filter((f) => f !== feature)
      : [...features, feature];
    setValue("features", next, { shouldDirty: true });
  }

  function onInvalid(errors: typeof form.formState.errors) {
    const first = Object.entries(errors).find(([, err]) => err?.message);
    if (first) {
      const [key, err] = first;
      toast.error(err?.message ?? "Please fix the highlighted fields");
      const el =
        document.getElementById(key) ??
        document.querySelector<HTMLElement>(`[name="${key}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    } else {
      toast.error("Please fix the highlighted fields before saving");
    }
  }

  async function handleGenerate() {
    const parsed = generateContentRequestSchema.safeParse(
      buildGenerateContentRequest(form.getValues()),
    );
    if (!parsed.success) {
      toast.error(firstZodIssueMessage(parsed.error));
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "AI generation failed");
      }
      const { content } = (await res.json()) as {
        content: {
          description: string;
          seoTitle: string;
          seoDescription: string;
          neighbourhoodSummary: string;
          headline: string;
          cta: string;
        };
      };
      setValue("ai_description", content.description, { shouldDirty: true });
      setValue("ai_seo_title", content.seoTitle, { shouldDirty: true });
      setValue("ai_seo_description", content.seoDescription, { shouldDirty: true });
      setValue("ai_neighbourhood_summary", content.neighbourhoodSummary, {
        shouldDirty: true,
      });
      setValue("ai_headline", content.headline, { shouldDirty: true });
      setValue("ai_cta", content.cta, { shouldDirty: true });
      toast.success("AI content generated. Edit as needed before saving.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  }

  function onSubmit(values: PropertyFormInput) {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createProperty(values)
          : await updateProperty(propertyId!, values);

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [key, msg] of Object.entries(result.fieldErrors)) {
            if (msg) {
              setError(key as keyof PropertyFormInput, { message: msg });
            }
          }
        }
        toast.error(result.error ?? "Could not save");
        return;
      }
      toast.success(mode === "create" ? "Listing created" : "Listing saved");
      if (mode === "create" && "id" in result && result.id) {
        router.push(`${propertiesBasePath}/${result.id}/edit`);
      } else {
        router.refresh();
      }
    });
  }

  const saveActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={status}
        onValueChange={(v) =>
          setValue("status", v as PropertyFormInput["status"], {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="sold">Sold</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        {isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="space-y-6 pb-24"
      noValidate
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "create" ? "New property" : "Edit property"}
          </h1>
          <p className="text-sm text-muted-foreground">
            All prices in South African Rand. Sizes in m².
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saveActions}
        </div>
      </div>

      <Section title="Basics">
        <Field label="Title" required error={errors.title?.message} htmlFor="title">
          <Input id="title" placeholder="e.g. 3 Bedroom Family Home" {...register("title")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Property type" htmlFor="property_type">
            <Select
              value={propertyType}
              onValueChange={(v) =>
                setValue("property_type", v as PropertyFormInput["property_type"], {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger id="property_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="land">Land</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Listing type" htmlFor="listing_type">
            <Select
              value={listingType}
              onValueChange={(v) =>
                setValue("listing_type", v as PropertyFormInput["listing_type"], {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger id="listing_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sale">For sale</SelectItem>
                <SelectItem value="rent">To rent</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field
            label={listingType === "rent" ? "Price (R, per month)" : "Price (R)"}
            required
            error={errors.price?.message}
            htmlFor="price"
          >
            <Input
              id="price"
              type="text"
              inputMode="numeric"
              placeholder="699000"
              {...register("price")}
            />
            <p className="text-xs text-muted-foreground">
              Numbers only — no spaces or commas (e.g. 699000).
            </p>
          </Field>
        </div>
      </Section>

      <Section title="Location">
        <Field label="Address" htmlFor="address" error={errors.address?.message}>
          <Input id="address" placeholder="12 Erica Street" {...register("address")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Suburb" required htmlFor="suburb" error={errors.suburb?.message}>
            <Input id="suburb" placeholder="Blue Downs" {...register("suburb")} />
          </Field>
          <Field label="City" htmlFor="city" error={errors.city?.message}>
            <Input id="city" {...register("city")} />
          </Field>
          <Field label="Province" htmlFor="province" error={errors.province?.message}>
            <Input id="province" {...register("province")} />
          </Field>
        </div>
        <label className="flex items-start gap-3 rounded-md border bg-background p-3 text-sm cursor-pointer">
          <Checkbox
            checked={isGated}
            onCheckedChange={(v) =>
              setValue("is_gated_community", v === true, { shouldDirty: true })
            }
            className="mt-0.5"
          />
          <span className="font-medium">This property is in a gated community / estate</span>
        </label>
        {isGated && (
          <Field
            label="Gated community / estate name"
            htmlFor="gated_community_name"
            error={errors.gated_community_name?.message}
          >
            <Input
              id="gated_community_name"
              placeholder="e.g. Eersterivier Gardens Estate"
              {...register("gated_community_name")}
            />
          </Field>
        )}
      </Section>

      <Section title="Specs">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Bedrooms" htmlFor="bedrooms">
            <Input id="bedrooms" type="number" min={0} {...register("bedrooms")} />
          </Field>
          <Field label="Bathrooms" htmlFor="bathrooms">
            <Input id="bathrooms" type="number" min={0} {...register("bathrooms")} />
          </Field>
          <Field label="Garages" htmlFor="garages">
            <Input id="garages" type="number" min={0} {...register("garages")} />
          </Field>
          <Field label="Parking" htmlFor="parking_spaces">
            <Input
              id="parking_spaces"
              type="number"
              min={0}
              {...register("parking_spaces")}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Floor size (m²)"
            htmlFor="floor_size_sqm"
            error={errors.floor_size_sqm?.message}
          >
            <Input
              id="floor_size_sqm"
              type="text"
              inputMode="decimal"
              placeholder="Optional"
              {...register("floor_size_sqm")}
            />
          </Field>
          <Field
            label="Erf size (m²)"
            htmlFor="erf_size_sqm"
            error={errors.erf_size_sqm?.message}
          >
            <Input
              id="erf_size_sqm"
              type="text"
              inputMode="numeric"
              placeholder="Optional"
              {...register("erf_size_sqm")}
            />
          </Field>
        </div>
      </Section>

      <Section title="Features">
        <p className="text-xs text-muted-foreground">
          Pick everything that applies. Used on the listing page and to inform AI copy.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {FEATURE_OPTIONS.map((f) => (
            <label
              key={f}
              className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm capitalize hover:bg-muted/50"
            >
              <Checkbox
                checked={features.includes(f)}
                onCheckedChange={() => toggleFeature(f)}
              />
              {f}
            </label>
          ))}
        </div>
      </Section>

      <Section
        title="AI content"
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerate}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {aiLoading ? "Generating…" : "Generate AI content"}
          </Button>
        }
      >
        <p className="text-xs text-muted-foreground">
          Edit any field below after generation. Empty fields are fine —
          they&apos;ll fall back to defaults on the listing page.
        </p>
        <Field
          label="Manual description (used as fallback / context for AI)"
          htmlFor="manual_description"
        >
          <Textarea
            id="manual_description"
            rows={3}
            placeholder="Notes about this property that AI should use to ground its description."
            {...register("manual_description")}
          />
        </Field>
        <Field label="AI description (150–200 words)" htmlFor="ai_description">
          <Textarea id="ai_description" rows={7} {...register("ai_description")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hero headline" htmlFor="ai_headline">
            <Input id="ai_headline" {...register("ai_headline")} />
          </Field>
          <Field label="Call to action" htmlFor="ai_cta">
            <Input id="ai_cta" {...register("ai_cta")} />
          </Field>
        </div>
        <Field label="SEO title" htmlFor="ai_seo_title">
          <Input id="ai_seo_title" {...register("ai_seo_title")} />
        </Field>
        <Field label="SEO meta description" htmlFor="ai_seo_description">
          <Textarea
            id="ai_seo_description"
            rows={2}
            {...register("ai_seo_description")}
          />
        </Field>
        <Field
          label="Neighbourhood summary"
          htmlFor="ai_neighbourhood_summary"
        >
          <Textarea
            id="ai_neighbourhood_summary"
            rows={5}
            {...register("ai_neighbourhood_summary")}
          />
        </Field>
      </Section>

      {allowAgentAssignment && (
        <Section title="Dashboard assignment">
          {agents.length > 0 ? (
            <>
              <Field
                label="Sourcing agent (who brought the listing)"
                htmlFor="sourced_by_user_select"
                error={errors.sourced_by_user_id?.message}
              >
                <Select
                  value={
                    sourcedByUserId?.trim()
                      ? sourcedByUserId.trim()
                      : "__none__"
                  }
                  onValueChange={(v) => {
                    if (v === "__none__") {
                      setValue("sourced_by_user_id", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      return;
                    }
                    setValue("sourced_by_user_id", v, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                >
                  <SelectTrigger
                    id="sourced_by_user_select"
                    className="w-full max-w-md"
                  >
                    <SelectValue placeholder="No sourcing agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No sourcing agent</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={`src-${a.user_id}`} value={a.user_id}>
                        {a.display_name?.trim() || a.email || a.user_id}
                        {a.email && a.display_name?.trim()
                          ? ` · ${a.email}`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field
                label="Assigned agent"
                htmlFor="assigned_user_select"
                error={errors.assigned_user_id?.message}
              >
                <Select
                  value={
                    assignedUserId?.trim() ? assignedUserId.trim() : "__none__"
                  }
                  onValueChange={(v) => {
                    if (v === "__none__") {
                      setValue("assigned_user_id", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue("assigned_agent_email", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      return;
                    }
                    setValue("assigned_user_id", v, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    const a = agents.find((x) => x.user_id === v);
                    if (a) {
                      setValue("assigned_agent_email", a.email?.trim() ?? "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      if (a.display_name?.trim()) {
                        setValue("agent_name", a.display_name.trim(), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                      if (a.phone?.trim()) {
                        setValue("agent_phone", a.phone.trim(), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                      if (a.email?.trim()) {
                        setValue("agent_email", a.email.trim(), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    }
                  }}
                >
                  <SelectTrigger
                    id="assigned_user_select"
                    className="w-full max-w-md"
                  >
                    <SelectValue placeholder="No agent assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No agent assigned</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.user_id} value={a.user_id}>
                        {a.display_name?.trim() || a.email || a.user_id}
                        {a.email && a.display_name?.trim()
                          ? ` · ${a.email}`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field
                label="Or assign by login email"
                htmlFor="assigned_agent_email"
                error={errors.assigned_agent_email?.message}
              >
                <Input
                  id="assigned_agent_email"
                  type="email"
                  autoComplete="off"
                  placeholder="agent@example.com"
                  {...register("assigned_agent_email", {
                    onChange: () => {
                      setValue("assigned_user_id", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    },
                  })}
                />
              </Field>
              <p className="text-xs text-muted-foreground">
                Pick an agent from the list, or type their login email. They
                must have an agent account (
                <code className="rounded bg-muted px-1">/admin/agents</code>
                ). They see assigned listings under{" "}
                <code className="rounded bg-muted px-1">/agent/properties</code>
                .
              </p>
            </>
          ) : (
            <>
              <Field
                label="Assigned agent (login email)"
                htmlFor="assigned_agent_email"
                error={errors.assigned_agent_email?.message}
              >
                <Input
                  id="assigned_agent_email"
                  type="email"
                  autoComplete="off"
                  placeholder="agent@example.com"
                  {...register("assigned_agent_email")}
                />
              </Field>
              <p className="text-xs text-muted-foreground">
                This user must exist in Supabase Auth and have a row in{" "}
                <code className="rounded bg-muted px-1">agent_accounts</code> so
                they can sign in and use{" "}
                <code className="rounded bg-muted px-1">/agent/properties</code>
                . Add agents under{" "}
                <code className="rounded bg-muted px-1">/admin/agents</code>.
                Leave empty to unassign.
              </p>
            </>
          )}
        </Section>
      )}

      {allowAgentAssignment && listingType === "sale" && (
        <Section title="Commission (admin)">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Commission % override"
              htmlFor="commission_percent"
              error={errors.commission_percent?.message}
            >
              <Input
                id="commission_percent"
                type="text"
                inputMode="decimal"
                placeholder="Uses agent default if empty"
                {...register("commission_percent")}
              />
            </Field>
            <Field
              label="Fixed commission (R)"
              htmlFor="commission_amount"
              error={errors.commission_amount?.message}
            >
              <Input
                id="commission_amount"
                type="text"
                inputMode="numeric"
                placeholder="Overrides % when set"
                {...register("commission_amount")}
              />
            </Field>
          </div>
          {status === "sold" && (
            <Field
              label="Sold price (R)"
              htmlFor="sold_price"
              error={errors.sold_price?.message}
            >
              <Input
                id="sold_price"
                type="text"
                inputMode="numeric"
                placeholder="Final sale price (defaults to listing price)"
                {...register("sold_price")}
              />
            </Field>
          )}
          <p className="text-xs text-muted-foreground">
            Sale listings only. Fixed amount wins over %. If two agents share a
            listing, each receives half. Rentals are not included in commission
            totals yet.
          </p>
        </Section>
      )}

      <Section title="Agent">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Agent name" htmlFor="agent_name">
            <Input id="agent_name" {...register("agent_name")} />
          </Field>
          <Field label="Agent phone" htmlFor="agent_phone">
            <Input id="agent_phone" placeholder="+27 82 555 0123" {...register("agent_phone")} />
          </Field>
          <Field label="Agent email" htmlFor="agent_email" error={errors.agent_email?.message}>
            <Input id="agent_email" type="email" {...register("agent_email")} />
          </Field>
          <input type="hidden" {...register("agent_photo_url")} />
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Agent photo</Label>
            {mode === "edit" && propertyId ? (
              <AgentPhotoUpload
                propertyId={propertyId}
                photoUrl={agentPhotoUrl}
                onUrlChange={(url) =>
                  setValue("agent_photo_url", url, { shouldDirty: true })
                }
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Upload an agent headshot after you save the listing (same as
                property photos).
              </p>
            )}
            {errors.agent_photo_url?.message ? (
              <p className="text-xs text-destructive">
                {errors.agent_photo_url.message}
              </p>
            ) : null}
          </div>
        </div>
      </Section>

      {mode === "edit" && propertyId && (
        <Section title="Photos">
          <ImageUploader propertyId={propertyId} initialImages={initialImages} />
        </Section>
      )}

      {mode === "create" && (
        <div className="rounded-md border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
          Photos can be uploaded once the listing is saved.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-6">
        {saveActions}
      </div>
    </form>
  );
}

function Section({
  title,
  children,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        {actions}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  required,
  error,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
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
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
