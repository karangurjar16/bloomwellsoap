"use client";

import { ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type GalleryImage = { url: string; alt: string };

/**
 * Swipe-through gallery with scroll-snap and dot indicators. Native scrolling
 * rather than a carousel library: it keeps the momentum feel of the platform,
 * works without JavaScript for the first image, and adds nothing to the bundle.
 */
export function ProductGallery({
  images,
  name,
}: {
  images: GalleryImage[];
  name: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="grid aspect-square w-full place-items-center bg-blush text-gold-deep/40">
        <ImageIcon className="size-8" strokeWidth={1.5} aria-hidden />
      </div>
    );
  }

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        // Derives the active dot from scroll position, so a swipe and a dot tap
        // stay in agreement without tracking gestures by hand.
        onScroll={(event) => {
          const track = event.currentTarget;
          setIndex(Math.round(track.scrollLeft / track.clientWidth));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, i) => (
          <li key={image.url} className="w-full shrink-0 snap-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.alt || `${name} — view ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              className="aspect-square w-full bg-blush object-cover"
            />
          </li>
        ))}
      </ul>

      {images.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              aria-label={`View image ${i + 1}`}
              aria-current={i === index}
              onClick={() =>
                trackRef.current?.scrollTo({
                  left: i * trackRef.current.clientWidth,
                  behavior: "smooth",
                })
              }
              className={cn(
                "h-1 transition-all duration-300",
                i === index ? "w-6 bg-background" : "w-1.5 bg-background/60",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
