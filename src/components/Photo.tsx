import { useState } from "react";
import type { Motorcycle } from "../data/types";
import { Silhouette } from "./Silhouette";

/**
 * The one way photography is rendered anywhere on the site.
 *
 * - Reads URLs exclusively from `bike.images` — components never hard-code paths.
 * - Fixed aspect ratio on the frame so images can never cause layout shift.
 * - Lazy by default; pass `priority` for above-the-fold heroes.
 * - If a file is missing or fails to decode, falls back to the drawn
 *   silhouette rather than a broken-image glyph.
 */
export function BikePhoto({
  bike,
  kind = "card",
  ratio = "16/10",
  scrim,
  priority = false,
  className = "",
  imgClassName = "",
}: {
  bike: Motorcycle;
  /** "studio" renders the clean product shot when one exists (gallery[0]). */
  kind?: "hero" | "card" | "studio";
  /** CSS aspect-ratio for the frame, e.g. "16/10", "21/9", "4/3". */
  ratio?: string;
  /** Optional gradient overlay so type can sit on the photo. */
  scrim?: "b" | "l";
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src =
    kind === "hero"
      ? bike.images.hero
      : kind === "studio"
        ? (bike.images.gallery?.[0] ?? bike.images.card)
        : bike.images.card;

  if (failed || !src) {
    return (
      <div
        className={`photo-frame flex items-center justify-center ${className}`}
        style={{ aspectRatio: ratio }}
      >
        <Silhouette bike={bike} className="h-3/4 w-3/4" />
      </div>
    );
  }

  return (
    <div
      className={`photo-frame ${scrim === "b" ? "scrim-b" : scrim === "l" ? "scrim-l" : ""} ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <img
        src={src}
        alt={bike.images.alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={imgClassName}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/** Tiny credit line for a photo, shown on detail pages. */
export function PhotoCredit({ bike, className = "" }: { bike: Motorcycle; className?: string }) {
  if (!bike.images.sourceName) return null;
  return (
    <p className={`eyebrow ${className}`} style={{ letterSpacing: "0.12em" }}>
      Photo: {bike.images.sourceName}
    </p>
  );
}
