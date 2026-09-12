"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DEMO_FRAMES,
  DEMO_POSTER_SRC,
  DEMO_VIDEO_SRC,
} from "@/lib/demo-frames";
import { cn } from "@/lib/utils";

const ADVANCE_MS = 5000;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduced;
}

function DemoCarousel() {
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  const frame = DEMO_FRAMES[index];

  useEffect(() => {
    if (paused || reduceMotion) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % DEMO_FRAMES.length);
    }, ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [paused, reduceMotion]);

  function go(next: number) {
    setIndex((next + DEMO_FRAMES.length) % DEMO_FRAMES.length);
  }

  return (
    <figure
      aria-roledescription="carousel"
      aria-labelledby={labelId}
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setPaused(false);
      }}
    >
      <p id={labelId} className="sr-only">
        Product walkthrough
      </p>
      <div className="bg-[#152033]">
        <Image
          src={frame.src}
          alt={frame.caption}
          width={1440}
          height={916}
          className="h-auto w-full"
          priority={index === 0}
        />
      </div>
      <figcaption className="sr-only">{frame.caption}</figcaption>
      <div className="flex items-center justify-between gap-3 border-t border-[#efe3cf] px-3 py-3 sm:px-4">
        <button
          type="button"
          className="border-border bg-background text-foreground hover:bg-muted inline-flex size-9 items-center justify-center rounded-full border"
          onClick={() => go(index - 1)}
          aria-label="Previous frame"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div
          className="flex flex-wrap items-center justify-center gap-1.5"
          role="tablist"
          aria-label="Demo frames"
        >
          {DEMO_FRAMES.map((item, itemIndex) => (
            <button
              key={item.src}
              type="button"
              role="tab"
              aria-selected={itemIndex === index}
              aria-label={item.caption}
              className={cn(
                "size-2.5 rounded-full transition-colors",
                itemIndex === index
                  ? "bg-accent"
                  : "bg-[#d7c9ae] hover:bg-[#c4b396]",
              )}
              onClick={() => go(itemIndex)}
            />
          ))}
        </div>
        <button
          type="button"
          className="border-border bg-background text-foreground hover:bg-muted inline-flex size-9 items-center justify-center rounded-full border"
          onClick={() => go(index + 1)}
          aria-label="Next frame"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </figure>
  );
}

export function ProductDemo() {
  const [hasVideo, setHasVideo] = useState(false);

  return (
    <section id="demo" className="border-border bg-card scroll-mt-24 border-t">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-accent text-xs tracking-[0.22em] uppercase">
          See it in action
        </p>
        <h2 className="font-heading mt-3 max-w-3xl text-4xl text-balance">
          From brief to client portal in minutes.
        </h2>
        <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7">
          AI drafts from your facts. Fees stay placeholders until you fill them.
        </p>

        <div className="mt-10 overflow-hidden rounded-[28px] border border-[#d7c9ae] bg-[#fffdf8] shadow-[0_24px_80px_-32px_rgba(21,32,51,0.45)]">
          <video
            className={cn(
              "aspect-video w-full bg-[#152033] object-contain",
              !hasVideo && "hidden",
            )}
            src={DEMO_VIDEO_SRC}
            poster={DEMO_POSTER_SRC}
            muted
            playsInline
            controls
            loop
            preload="metadata"
            aria-label="ProposalFast walkthrough from brief to client portal"
            onLoadedData={() => setHasVideo(true)}
            onCanPlay={() => setHasVideo(true)}
            onError={() => setHasVideo(false)}
          >
            Your browser does not support video.
          </video>
          {hasVideo ? null : <DemoCarousel />}
        </div>
      </div>
    </section>
  );
}
