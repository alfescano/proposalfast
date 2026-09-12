"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DEMO_FRAMES,
  DEMO_POSTER_SRC,
  DEMO_YOUTUBE_EMBED_URL,
  DEMO_YOUTUBE_TITLE,
  DEMO_YOUTUBE_WATCH_URL,
} from "@/lib/demo-frames";
import { buttonVariants } from "@/components/ui/button";
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
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <p id={labelId} className="sr-only">
        Product stills
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
          className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-muted"
          onClick={() => go(index - 1)}
          aria-label="Previous frame"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex flex-wrap items-center justify-center gap-1.5" role="tablist" aria-label="Demo frames">
          {DEMO_FRAMES.map((item, itemIndex) => (
            <button
              key={item.src}
              type="button"
              role="tab"
              aria-selected={itemIndex === index}
              aria-label={item.caption}
              className={cn(
                "size-2.5 rounded-full transition-colors",
                itemIndex === index ? "bg-accent" : "bg-[#d7c9ae] hover:bg-[#c4b396]",
              )}
              onClick={() => go(itemIndex)}
            />
          ))}
        </div>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-muted"
          onClick={() => go(index + 1)}
          aria-label="Next frame"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </figure>
  );
}

function YouTubeDemo() {
  return (
    <figure>
      <div className="flex items-center justify-between gap-3 border-b border-[#efe3cf] px-4 py-3 sm:px-5">
        <figcaption className="text-[11px] tracking-[0.16em] text-[#8a7040] uppercase">
          Product walkthrough
        </figcaption>
        <a
          href={DEMO_YOUTUBE_WATCH_URL}
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          rel="noreferrer"
          target="_blank"
        >
          Open on YouTube
        </a>
      </div>
      <div className="relative aspect-video w-full bg-[#152033]">
        <Image
          src={DEMO_POSTER_SRC}
          alt=""
          fill
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="object-cover object-top"
          aria-hidden
        />
        <iframe
          className="absolute inset-0 h-full w-full"
          src={DEMO_YOUTUBE_EMBED_URL}
          title={DEMO_YOUTUBE_TITLE}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </figure>
  );
}

export function ProductDemo() {
  const [view, setView] = useState<"video" | "stills">("video");

  return (
    <section id="demo" className="scroll-mt-24 border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">See it in action</p>
        <h2 className="mt-3 max-w-3xl font-heading text-4xl text-balance">
          From brief to client portal in minutes.
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
          AI drafts from your facts. Fees stay placeholders until you fill them.
        </p>

        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Demo view">
          <button
            type="button"
            aria-pressed={view === "video"}
            className={cn(
              buttonVariants({ variant: view === "video" ? "default" : "outline", size: "lg" }),
              "h-10 px-4",
            )}
            onClick={() => setView("video")}
          >
            Watch demo
          </button>
          <button
            type="button"
            aria-pressed={view === "stills"}
            className={cn(
              buttonVariants({ variant: view === "stills" ? "default" : "outline", size: "lg" }),
              "h-10 px-4",
            )}
            onClick={() => setView("stills")}
          >
            Browse stills
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-[#d7c9ae] bg-[#fffdf8] shadow-[0_24px_80px_-32px_rgba(21,32,51,0.45)]">
          {view === "video" ? <YouTubeDemo /> : <DemoCarousel />}
        </div>
      </div>
    </section>
  );
}
