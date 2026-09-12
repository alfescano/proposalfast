import { describe, expect, it } from "vitest";
import { DEMO_FRAMES, DEMO_POSTER_SRC, DEMO_VIDEO_SRC } from "./demo-frames";

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

  it("points the video tag at a same-origin file with the first frame as poster", () => {
    expect(DEMO_VIDEO_SRC).toBe("/demo.mp4");
    expect(DEMO_POSTER_SRC).toBe("/demo-frames/01.png");
  });
});
