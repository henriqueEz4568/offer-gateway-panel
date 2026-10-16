"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";

const SIZE = 48;

/**
 * Plain <img> on purpose: offer images come from arbitrary marketplace CDNs,
 * so next/image would require maintaining `remotePatterns` for each of them.
 */
export function OfferThumbnail({ alt, src }: { alt: string; src?: string | null }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !src || failedSrc === src;

  if (failed) {
    return (
      <div
        aria-label={`Sem imagem: ${alt}`}
        className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground"
        role="img"
      >
        <ImageOff aria-hidden className="size-5" />
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      alt={alt}
      className="size-12 shrink-0 rounded-md border border-border bg-muted object-cover"
      decoding="async"
      height={SIZE}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      referrerPolicy="no-referrer"
      src={src}
      width={SIZE}
    />
  );
}
