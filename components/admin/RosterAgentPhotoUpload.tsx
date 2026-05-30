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
  userId: string;
  photoUrl: string | null;
};

export function RosterAgentPhotoUpload({ userId, photoUrl }: Props) {
  const [url, setUrl] = useState(photoUrl?.trim() ?? "");
  const [busy, setBusy] = useState(false);

  const removeOldStorageObject = useCallback(async (storageUrl: string) => {
    const path = extractPropertyImagesStoragePath(storageUrl);
    if (!path) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove([path]);
  }, []);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file || !file.type.startsWith("image/")) return;

      setBusy(true);
      const supabase = createSupabaseBrowserClient();
      const previousUrl = url.trim();

      try {
        const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
        const ext =
          compressed.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `agents/${userId}/photo-${Date.now()}-${Math.random()
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
          .from("agent_accounts")
          .update({ photo_url: publicUrl })
          .eq("user_id", userId);

        if (updateError) {
          console.error(updateError);
          toast.error(updateError.message);
          await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove([path]);
          return;
        }

        if (previousUrl) {
          await removeOldStorageObject(previousUrl);
        }

        setUrl(publicUrl);
        toast.success("Agent photo updated.");
      } catch (e) {
        console.error(e);
        toast.error("Could not process or upload image.");
      } finally {
        setBusy(false);
      }
    },
    [removeOldStorageObject, url, userId],
  );

  const handleRemove = useCallback(async () => {
    if (!url.trim()) return;
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    try {
      await removeOldStorageObject(url.trim());

      const { error } = await supabase
        .from("agent_accounts")
        .update({ photo_url: null })
        .eq("user_id", userId);

      if (error) {
        toast.error(error.message);
        return;
      }

      setUrl("");
      toast.success("Agent photo removed.");
    } finally {
      setBusy(false);
    }
  }, [removeOldStorageObject, url, userId]);

  const trimmed = url.trim();
  const showPreview = trimmed.length > 0;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 max-w-lg">
      <div>
        <h2 className="text-sm font-semibold">Profile photo</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Shown on public listings when buyers arrive via this agent&apos;s
          share link. One headshot for all their referrals.
        </p>
      </div>
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
        </div>
      </div>
    </div>
  );
}
