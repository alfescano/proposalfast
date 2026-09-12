import { describe, expect, it } from "vitest";
import {
  DEMO_FRAMES,
  DEMO_POSTER_SRC,
  DEMO_YOUTUBE_EMBED_URL,
  DEMO_YOUTUBE_ID,
  DEMO_YOUTUBE_WATCH_URL,
} from "./demo-frames";

describe("demo frames", () => {
  it("lists the six labeled walkthrough stills in order", () => {
    expect(DEMO_FRAMES).toHaveLength(6);
    expect(DEMO_FRAMES.map((frame) => frame.src)).toEqual([
      "/demo-frames/01.png",
      "/demo-frames/02.png",
      "/demo-frames/03.png",
      "/demo-frames/04.png",
      "/demo-frames/05.png",
      "/demo-frames/06.png",
    ]);
    expect(DEMO_FRAMES.map((frame) => frame.caption)).toEqual([
      "Proposalfast — proposals that close",
      "1. Your workspace",
      "2. Create from a brief",
      "3. AI draft (fees stay placeholders)",
      "4. Client portal preview",
      "Free → Pro when you’re closing weekly",
    ]);
  });

  it("points the embed at the privacy-friendly YouTube player", () => {
    expect(DEMO_YOUTUBE_ID).toBe("aWZjHgRj_Yc");
    expect(DEMO_YOUTUBE_WATCH_URL).toBe("https://www.youtube.com/watch?v=aWZjHgRj_Yc");
    expect(DEMO_YOUTUBE_EMBED_URL).toBe(
      "https://www.youtube-nocookie.com/embed/aWZjHgRj_Yc",
    );
    expect(DEMO_POSTER_SRC).toBe("/demo-frames/01.png");
  });
});
