import { describe, expect, it } from "vitest";
import { chatCompletionSampling, modelAllowsCustomTemperature } from "./sampling";

describe("OpenAI chat completion sampling", () => {
  it("omits temperature for gpt-5-mini and gpt-5-nano", () => {
    expect(modelAllowsCustomTemperature("gpt-5-mini")).toBe(false);
    expect(modelAllowsCustomTemperature("gpt-5-nano")).toBe(false);
    expect(chatCompletionSampling("gpt-5-mini")).toEqual({});
    expect(chatCompletionSampling("gpt-5-nano")).toEqual({});
    expect(chatCompletionSampling("GPT-5-MINI")).toEqual({});
  });

  it("omits temperature for other GPT-5 and o-series models", () => {
    expect(chatCompletionSampling("gpt-5")).toEqual({});
    expect(chatCompletionSampling("o3-mini")).toEqual({});
    expect(chatCompletionSampling("o1")).toEqual({});
  });

  it("keeps a low temperature for models that accept it", () => {
    expect(modelAllowsCustomTemperature("gpt-4.1")).toBe(true);
    expect(chatCompletionSampling("gpt-4.1-mini")).toEqual({ temperature: 0.2 });
    expect(chatCompletionSampling("gpt-4o")).toEqual({ temperature: 0.2 });
  });
});
