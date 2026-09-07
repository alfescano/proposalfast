import { getAIService } from "./service";
import { NO_HALLUCINATION } from "./pipeline";
import { rewriteResultSchema, type RewriteMode } from "./schemas";
import { sanitizeInventedClaims } from "./placeholders";

const MODE_INSTRUCTIONS: Record<RewriteMode, string> = {
  rewrite: "Rewrite the selection more clearly. Keep every fact. Do not add new claims.",
  shorten: "Shorten the selection. Keep every fact. Do not add new claims.",
  expand: "Expand the selection with clearer structure only. Do not add prices, proof, or guarantees.",
  tone: "Adjust tone to calm professional prose. Do not add facts.",
  persuasive: "Make the selection more direct and confident without inventing social proof or numbers.",
  humanize: "Make the selection sound like a careful human wrote it. No slogans. No invented facts.",
};

export async function rewriteSelection(input: {
  text: string;
  mode: RewriteMode;
  facts?: string[];
  organizationId: string;
  userId: string;
}) {
  const ai = getAIService();
  const result = await ai.completeJson(rewriteResultSchema, {
    organizationId: input.organizationId,
    userId: input.userId,
    purpose: `rewrite:${input.mode}`,
    fast: true,
    messages: [
      { role: "system", content: NO_HALLUCINATION },
      {
        role: "user",
        content: `${MODE_INSTRUCTIONS[input.mode]}
Return JSON: {"text":"","placeholders":[""]}
KNOWN FACTS (optional):\n${(input.facts ?? []).join("\n") || "(none supplied)"}
SELECTION:\n${input.text}`,
      },
    ],
  });

  const cleaned = sanitizeInventedClaims(
    result.text,
    [],
    [input.text, ...(input.facts ?? [])],
  );

  return {
    text: cleaned.body,
    placeholders: cleaned.placeholders,
  };
}
