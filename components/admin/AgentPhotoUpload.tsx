"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { Loader2, Trash2, Upload, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  PROPERTY_IMAGES_BUCKET,
  extractPropertyImagesStoragePath,
} from "@/lib/supabase/storage-path";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 2400,
  useWebWorker: true,
};

type Props = {
  propertyId: string;
  /** Current URL from the form (may be empty or an external legacy URL). */
  photoUrl: string;
  onUrlChange: (url: string) => void;
};

export function AgentPhotoUpload({
  propertyId,
  photoUrl,
  onUrlChange,
}: Props) {
  const [busy, setBusy] = useState(false);

  const removeOldStorageObject = useCallback(async (url: string) => {
    const path = extractPropertyImagesStoragePath(url);
    if (!path) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove([path]);
  }, []);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file || !file.type.startsWith("image/")) return;

      setBusy(true);
      const supabase = createSupabaseBrowserClient();
      const previousUrl = photoUrl.trim();

      try {
        const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
        const ext =
          compressed.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${propertyId}/agent-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(PROPERTY_IMAGES_BUCKET)
          .upload(path, compressed, {
            upsert: false,
            contentType: compressed.type || file.type,
            cacheControl: "31536000",
          });

        if (uploadError) {
          console.error(uploadError);
          toast.error(`Upload failed: ${uploadError.message}`);
          return;
        }

        const { data: pub } = supabase.storage
          .from(PROPERTY_IMAGES_BUCKET)
          .getPublicUrl(path);
        const publicUrl = pub.publicUrl;

        const { error: updateError } = await supabase
          .from("properties")
          .update({ agent_photo_url: publicUrl })
          .eq("id", propertyId);

        if (updateError) {
          console.error(updateError);
          toast.error(updateError.message);
          await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove([path]);
          return;
        }

        if (previousUrl) {
          await removeOldStorageObject(previousUrl);
        }

        onUrlChange(publicUrl);
        toast.success("Agent photo updated.");
      } catch (e) {
        console.error(e);
        toast.error("Could not process or upload image.");
      } finally {
        setBusy(false);
      }
    },
    [onUrlChange, photoUrl, propertyId, removeOldStorageObject],
  );

  const handleRemove = useCallback(async () => {
    if (!photoUrl.trim()) return;
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    try {
      await removeOldStorageObject(photoUrl.trim());

      const { error } = await supabase
        .from("properties")
        .update({ agent_photo_url: null })
        .eq("id", propertyId);

      if (error) {
        toast.error(error.message);
        return;
      }

      onUrlChange("");
      toast.success("Agent photo removed.");
    } finally {
      setBusy(false);
    }
  }, [onUrlChange, photoUrl, propertyId, removeOldStorageObject]);

  const trimmed = photoUrl.trim();
  const showPreview = trimmed.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative size-28 shrink-0 overflow-hidden rounded-full border bg-muted">
          {showPreview ? (
            <Image
              src={trimmed}
              alt=""
              fill
              className="object-cover"
              sizes="112px"
              unoptimized={
                extractPropertyImagesStoragePath(trimmed) === null
              }
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <User className="size-10" aria-hidden />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/*"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                void handleFile(f);
                e.target.value = "";
              }}
            />
            <span className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted">
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Working…
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Upload photo
                </>
              )}
            </span>
          </label>
          {showPreview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit gap-1.5"
              disabled={busy}
              onClick={() => void handleRemove()}
            >
              <Trash2 className="size-3.5" />
              Remove photo
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            JPEG, PNG or WebP. One headshot; we resize and compress before upload.
          </p>
        </div>
      </div>
    </div>
  );
}
