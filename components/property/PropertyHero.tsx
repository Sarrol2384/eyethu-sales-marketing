"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Max cells in the gallery grid (thumbnails + optional "+N" tile). */
const GALLERY_GRID_MAX_CELLS = 8;

export type HeroImage = {
  url: string;
  alt: string;
};

type Props = {
  images: HeroImage[];
  headline: string;
  priceLabel: string;
  suburb: string;
  /** "clean" = photo-only hero; headline/price live in sidebar. Default "overlay". */
  layout?: "overlay" | "clean";
};

export function PropertyHero({
  images,
  headline,
  priceLabel,
  suburb,
  layout = "overlay",
}: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: images.length > 1 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const scrollTo = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi],
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (images.length === 0) {
    return (
      <div className="relative flex aspect-[4/3] w-full items-center justify-center rounded-2xl border bg-muted text-muted-foreground sm:aspect-[16/9] lg:rounded-3xl">
        No photos yet
      </div>
    );
  }

  const frameRounded =
    layout === "clean" ? "rounded-3xl" : "rounded-2xl";

  const restImages = images.slice(1);
  const showGalleryGrid = restImages.length > 0;
  const useMoreTile = restImages.length > 7;
  const gridThumbs = useMoreTile
    ? restImages.slice(0, GALLERY_GRID_MAX_CELLS - 1)
    : restImages;
  const hiddenRestCount = restImages.length - gridThumbs.length;

  return (
    <div className="space-y-3">
      <div className={`relative overflow-hidden bg-muted ${frameRounded}`}>
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {images.map((img, i) => (
              <button
                key={`${img.url}-${i}`}
                type="button"
                onClick={() => {
                  setLightboxIndex(i);
                  setLightboxOpen(true);
                }}
                className="relative aspect-[4/3] min-w-0 flex-[0_0_100%] cursor-zoom-in sm:aspect-[16/9]"
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 900px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {layout === "clean" ? (
          <div className="pointer-events-none absolute left-4 top-4 sm:left-5 sm:top-5">
            <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm sm:text-sm">
              {suburb}
            </span>
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 text-white sm:p-6">
            <h1 className="font-heading text-balance text-2xl font-semibold leading-tight drop-shadow sm:text-4xl">
              {headline}
            </h1>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm sm:text-base">
              <span className="font-heading text-xl font-semibold tabular-nums sm:text-2xl">
                {priceLabel}
              </span>
              <span className="font-sans text-white/85">· {suburb}</span>
            </div>
          </div>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={scrollPrev}
              className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur transition hover:bg-black/60 sm:block"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={scrollNext}
              className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur transition hover:bg-black/60 sm:block"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        <button
          type="button"
          aria-label="Open full-size gallery"
          onClick={() => {
            setLightboxIndex(selectedIndex);
            setLightboxOpen(true);
          }}
          className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white backdrop-blur transition hover:bg-black/60"
        >
          <Expand className="size-4" />
        </button>

        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {showGalleryGrid && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {gridThumbs.map((img, gridIdx) => {
            const i = gridIdx + 1;
            return (
              <button
                key={`grid-${img.url}-${i}`}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === selectedIndex ? "true" : undefined}
                className={cn(
                  "relative aspect-[4/3] overflow-hidden rounded-xl border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  i === selectedIndex
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:opacity-90",
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 22vw"
                  className="object-cover"
                />
              </button>
            );
          })}
          {useMoreTile && hiddenRestCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                setLightboxIndex(selectedIndex);
                setLightboxOpen(true);
              }}
              className="relative flex aspect-[4/3] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/60 text-center transition hover:border-primary/40 hover:bg-muted"
            >
              <span className="text-lg font-semibold tabular-nums text-foreground">
                +{hiddenRestCount}
              </span>
              <span className="mt-0.5 px-2 text-xs font-medium text-muted-foreground">
                View all photos
              </span>
            </button>
          ) : null}
        </div>
      )}

      <Lightbox
        images={images}
        open={lightboxOpen}
        startIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}

function Lightbox({
  images,
  open,
  startIndex,
  onClose,
}: {
  images: HeroImage[];
  open: boolean;
  startIndex: number;
  onClose: () => void;
}) {
  const [ref, api] = useEmblaCarousel({
    loop: images.length > 1,
    startIndex,
  });

  useEffect(() => {
    if (open && api) api.scrollTo(startIndex, true);
  }, [open, api, startIndex]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="h-[100dvh] w-screen max-w-none rounded-none border-none bg-black p-0 sm:h-[90vh] sm:max-h-[90vh] sm:w-[90vw] sm:max-w-5xl sm:rounded-xl"
      >
        <DialogTitle className="sr-only">Property photos</DialogTitle>
        <div className="relative h-full w-full">
          <div ref={ref} className="h-full overflow-hidden">
            <div className="flex h-full">
              {images.map((img, i) => (
                <div
                  key={`lb-${img.url}-${i}`}
                  className="relative h-full min-w-0 flex-[0_0_100%]"
                >
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    sizes="100vw"
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          <Button
            size="icon"
            variant="secondary"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full"
            aria-label="Close gallery"
          >
            <X className="size-4" />
          </Button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => api?.scrollPrev()}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => api?.scrollNext()}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
