import { describe, expect, it } from "vitest";
import { defaultBlockBody, defaultBlockTitle, isNewSectionId } from "./blocks";

describe("editor blocks", () => {
  it("gives persistable defaults for heading/paragraph/pricing/signature/faq", () => {
    expect(defaultBlockTitle("pricing")).toBe("Investment");
    expect(defaultBlockBody("pricing")).toContain("[PLACEHOLDER");
    expect(defaultBlockBody("faq")).toMatch(/Q:/);
    expect(defaultBlockTitle("signature")).toBe("Signature");
    expect(isNewSectionId("new_abc")).toBe(true);
    expect(isNewSectionId("clxyz")).toBe(false);
  });
});
