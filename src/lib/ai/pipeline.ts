import { getAIService } from "./service";

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
  outline: { title: string; type: string; intent: string }[];
  sections: { title: string; type: string; body: string; placeholders: string[] }[];
  qc: { invented: string[]; missing: string[]; ok: boolean };
  score: { completeness: number; notes: string[] };
};

const NO_HALLUCINATION = `You work for ProposalFast. Hard rules:
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

  const extracted = await ai.complete({
    organizationId: input.organizationId,
    userId: input.userId,
    purpose: "extract",
    fast: true,
    json: true,
    messages: [
      { role: "system", content: NO_HALLUCINATION },
      {
        role: "user",
        content: `Extract only facts that are explicitly present. JSON shape: {"facts":[{"key":"","value":"","source":"user"|"missing"}]}. BRIEF+FACTS:\n${factBlock}`,
      },
    ],
  });

  const facts = parseJson<{ facts: ExtractedFact[] }>(extracted.text).facts ?? [];

  const outlineRaw = await ai.complete({
    organizationId: input.organizationId,
    userId: input.userId,
    purpose: "outline",
    fast: true,
    json: true,
    messages: [
      { role: "system", content: NO_HALLUCINATION },
      {
        role: "user",
        content: `Create a proposal outline from these facts only. JSON: {"outline":[{"title":"","type":"cover|introduction|scope|approach|timeline|pricing|terms|next_steps|custom","intent":""}]}\nFACTS:\n${JSON.stringify(facts)}`,
      },
    ],
  });
  const outline = parseJson<{ outline: PipelineResult["outline"] }>(outlineRaw.text).outline ?? [];

  const generated = await ai.complete({
    organizationId: input.organizationId,
    userId: input.userId,
    purpose: "generate",
    json: true,
    messages: [
      { role: "system", content: NO_HALLUCINATION },
      {
        role: "user",
        content: `Write each outlined section. Missing facts become [PLACEHOLDER: ...]. JSON: {"sections":[{"title":"","type":"","body":"","placeholders":[""]}]}\nOUTLINE:${JSON.stringify(outline)}\nFACTS:${JSON.stringify(facts)}`,
      },
    ],
  });
  const sections =
    parseJson<{ sections: PipelineResult["sections"] }>(generated.text).sections ?? [];

  const qcRaw = await ai.complete({
    organizationId: input.organizationId,
    userId: input.userId,
    purpose: "qc",
    fast: true,
    json: true,
    messages: [
      { role: "system", content: NO_HALLUCINATION },
      {
        role: "user",
        content: `Flag any invented prices, stats, case studies, or guarantees that are not in FACTS. JSON: {"invented":[""],"missing":[""],"ok":true}\nFACTS:${JSON.stringify(facts)}\nSECTIONS:${JSON.stringify(sections)}`,
      },
    ],
  });
  const qc = parseJson<PipelineResult["qc"]>(qcRaw.text);

  const scoreRaw = await ai.complete({
    organizationId: input.organizationId,
    userId: input.userId,
    purpose: "score",
    fast: true,
    json: true,
    messages: [
      { role: "system", content: NO_HALLUCINATION },
      {
        role: "user",
        content: `Score completeness 0-100 based on how many required commercial facts are still placeholders. JSON: {"completeness":0,"notes":[""]}\nQC:${JSON.stringify(qc)}\nSECTIONS:${JSON.stringify(sections)}`,
      },
    ],
  });
  const score = parseJson<PipelineResult["score"]>(scoreRaw.text);

  return { facts, outline, sections, qc, score };
}

function parseJson<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model did not return JSON.");
  }
  return JSON.parse(text.slice(start, end + 1)) as T;
}
