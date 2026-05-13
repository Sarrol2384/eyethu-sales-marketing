"use client";

import { useCallback, useState, useTransition } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { Star, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const BUCKET = "property-images";
const MAX_IMAGES = 15;
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 2400,
  useWebWorker: true,
};

type ImageRow = {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
};

type Props = {
  propertyId: string;
  initialImages: ImageRow[];
};

export function ImageUploader({ propertyId, initialImages }: Props) {
  const [images, setImages] = useState<ImageRow[]>(
    [...initialImages].sort((a, b) => a.display_order - b.display_order),
  );
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (fileArray.length === 0) return;

      const room = MAX_IMAGES - images.length;
      if (room <= 0) {
        toast.error(`You can upload at most ${MAX_IMAGES} photos per listing.`);
        return;
      }
      const slice = fileArray.slice(0, room);
      if (slice.length < fileArray.length) {
        toast.warning(
          `Only uploading the first ${slice.length} — limit is ${MAX_IMAGES} per listing.`,
        );
      }

      setUploading(true);
      const supabase = createSupabaseBrowserClient();
      const created: ImageRow[] = [];

      for (let i = 0; i < slice.length; i++) {
        const file = slice[i]!;
        try {
          const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
          const ext =
            compressed.name.split(".").pop()?.toLowerCase() ?? "jpg";
          const path = `${propertyId}/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(path, compressed, {
              upsert: false,
              contentType: compressed.type || file.type,
              cacheControl: "31536000",
            });

          if (uploadError) {
            console.error("upload failed", uploadError);
            toast.error(`Upload failed: ${uploadError.message}`);
            continue;
          }

          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

          const isFirst = images.length === 0 && created.length === 0;
          const { data: inserted, error: insertError } = await supabase
            .from("property_images")
            .insert({
              property_id: propertyId,
              image_url: pub.publicUrl,
              is_primary: isFirst,
              display_order: images.length + created.length,
            })
            .select("id, image_url, is_primary, display_order")
            .single();

          if (insertError || !inserted) {
            console.error("insert image row failed", insertError);
            toast.error("Could not save image record.");
            continue;
          }

          created.push(inserted as unknown as ImageRow);
        } catch (err) {
          console.error("image processing failed", err);
          toast.error("Could not process image.");
        }
      }

      if (created.length > 0) {
        setImages((prev) => [...prev, ...created]);
        toast.success(`${created.length} photo${created.length === 1 ? "" : "s"} uploaded.`);
      }
      setUploading(false);
    },
    [images.length, propertyId],
  );

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleSetPrimary(id: string) {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      // Clear current primary then set new one.
      await supabase
        .from("property_images")
        .update({ is_primary: false })
        .eq("property_id", propertyId)
        .eq("is_primary", true);
      const { error } = await supabase
        .from("property_images")
        .update({ is_primary: true })
        .eq("id", id);
      if (error) {
        toast.error(error.message);
        return;
      }
      setImages((prev) =>
        prev.map((img) => ({ ...img, is_primary: img.id === id })),
      );
      toast.success("Primary photo updated");
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const target = images.find((i) => i.id === id);
      const { error } = await supabase
        .from("property_images")
        .delete()
        .eq("id", id);
      if (error) {
        toast.error(error.message);
        return;
      }
      // Best-effort: also clean up the storage object
      if (target) {
        const path = extractStoragePath(target.image_url);
        if (path) {
          await supabase.storage.from(BUCKET).remove([path]);
        }
      }
      setImages((prev) => prev.filter((i) => i.id !== id));
      toast.success("Photo deleted");
    });
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30"
        }`}
      >
        <Upload className="size-6 text-muted-foreground" />
        <p className="text-sm">
          <span className="font-medium">Drag photos here</span>, or
        </p>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <span className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-muted">
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Uploading…
              </>
            ) : (
              "Choose photos"
            )}
          </span>
        </label>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG or WebP. Up to {MAX_IMAGES} photos per listing. We auto-resize and compress.
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted"
            >
              <Image
                src={img.image_url}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
              {img.is_primary && (
                <div className="absolute left-2 top-2 rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Primary
                </div>
              )}
              <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.is_primary && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSetPrimary(img.id)}
                    disabled={isPending}
                  >
                    <Star className="size-3.5" />
                    Set primary
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(img.id)}
                  disabled={isPending}
                  className="ml-auto"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Extract `<propertyId>/<file>` from a public Supabase Storage URL. */
function extractStoragePath(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}
