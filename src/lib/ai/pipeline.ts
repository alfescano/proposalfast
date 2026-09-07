import { getAIService } from "./service";
import {
  extractResultSchema,
  generateResultSchema,
  outlineResultSchema,
  qcResultSchema,
  scoreDimensionsSchema,
  type ScoreDimensions,
} from "./schemas";
import { localCompleteness, mergeScore, sanitizeInventedClaims } from "./placeholders";

export type PipelineInput = {
  brief: string;
  facts?: string[];
  organizationId: string;
  userId: string;
  businessName?: string;
  clientName?: string;
};

export type ExtractedFact = {
  key: string;
  value: string;
  source: "user" | "missing";
};

export type PipelineResult = {
  facts: ExtractedFact[];
  missing: string[];
  outline: { title: string; type: string; intent: string }[];
  sections: { title: string; type: string; body: string; placeholders: string[] }[];
  qc: { invented: string[]; missing: string[]; ok: boolean };
  score: ScoreDimensions;
};

export const NO_HALLUCINATION = `You work for ProposalFast. Hard rules:
- Never invent client names, prices, timelines, guarantees, case studies, metrics, team bios, or legal terms.
- If a fact is not in the provided FACTS or BRIEF, write the token [PLACEHOLDER: description] and list it as missing.
- Do not reuse generic industry statistics.
- Prefer short, specific language over filler.
- Return only valid JSON when asked for JSON.`;

export async function runProposalPipeline(input: PipelineInput): Promise<PipelineResult> {
  const ai = getAIService();
  const factBlock = [
    input.brief,
    ...(input.facts ?? []),
    input.businessName ? `Seller business name: ${input.businessName}` : null,
    input.clientName ? `Client name: ${input.clientName}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const extracted = await ai.completeJson(extractResultSchema, {
    organizationId: input.organizationId,
    userId: input.userId,
    purpose: "extract",
    fast: true,
    messages: [
      { role: "system", content: NO_HALLUCINATION },
      {
        role: "user",
        content: `Extract only facts that are explicitly present. JSON: {"facts":[{"key":"","value":"","source":"user"|"missing"}],"missing":[""]}. BRIEF+FACTS:\n${factBlock}`,
      },
    ],
  });

  const facts = extracted.facts;

  const outline = await ai.completeJson(outlineResultSchema, {
    organizationId: input.organizationId,
    userId: input.userId,
    purpose: "outline",
    fast: true,
    messages: [
      { role: "system", content: NO_HALLUCINATION },
      {
        role: "user",
        content: `Create a proposal outline from these facts only. JSON: {"outline":[{"title":"","type":"cover|introduction|scope|approach|timeline|pricing|terms|next_steps|custom","intent":""}]}\nFACTS:\n${JSON.stringify(facts)}`,
      },
    ],
  });

  const generated = await ai.completeJson(generateResultSchema, {
    organizationId: input.organizationId,
    userId: input.userId,
    purpose: "generate",
    messages: [
      { role: "system", content: NO_HALLUCINATION },
      {
        role: "user",
        content: `Write each outlined section. Missing facts become [PLACEHOLDER: ...]. JSON: {"sections":[{"title":"","type":"","body":"","placeholders":[""]}]}\nOUTLINE:${JSON.stringify(outline.outline)}\nFACTS:${JSON.stringify(facts)}`,
      },
    ],
  });

  const sanitized = generated.sections.map((section) => {
    const cleaned = sanitizeInventedClaims(section.body, facts, input.facts ?? []);
    return {
      ...section,
      body: cleaned.body,
      placeholders: cleaned.placeholders,
    };
  });

  const qc = await ai.completeJson(qcResultSchema, {
    organizationId: input.organizationId,
    userId: input.userId,
    purpose: "qc",
    fast: true,
    messages: [
      { role: "system", content: NO_HALLUCINATION },
      {
        role: "user",
        content: `Flag any invented prices, stats, case studies, or guarantees that are not in FACTS. JSON: {"invented":[""],"missing":[""],"ok":true}\nFACTS:${JSON.stringify(facts)}\nSECTIONS:${JSON.stringify(sanitized)}`,
      },
    ],
  });

  const local = localCompleteness(sanitized.map((section) => section.body));
  const scored = await ai.completeJson(scoreDimensionsSchema, {
    organizationId: input.organizationId,
    userId: input.userId,
    purpose: "score",
    fast: true,
    messages: [
      { role: "system", content: NO_HALLUCINATION },
      {
        role: "user",
        content: `Score 0-100 on completeness, fidelity (no invented facts), clarity, and commercialReadiness. overall is the mean. JSON: {"completeness":0,"fidelity":0,"clarity":0,"commercialReadiness":0,"overall":0,"notes":[""]}\nQC:${JSON.stringify(qc)}\nSECTIONS:${JSON.stringify(sanitized)}`,
      },
    ],
  });

  const score = mergeScore(scored, local);
  const invented = [...new Set([...qc.invented, ...sanitized.flatMap((s) =>
    s.placeholders.filter((p) => p.includes("was not in the brief")).map((p) => p),
  )])];

  return {
    facts,
    missing: extracted.missing,
    outline: outline.outline,
    sections: sanitized,
    qc: { ...qc, invented, ok: invented.length === 0 && qc.ok },
    score,
  };
}
