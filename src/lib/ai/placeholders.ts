export const PLACEHOLDER_RE = /\[PLACEHOLDER:\s*[^\]]+\]/g;

const COMMERCIAL_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "price", re: /\$\s?\d[\d,]*(?:\.\d{2})?/g },
  { label: "percent guarantee", re: /\b\d{2,3}%\s+(?:increase|lift|guarantee|roi|conversion)/gi },
  { label: "case study", re: /\b(?:case study|our client [A-Z][a-z]+ (?:increased|grew|saved))\b/gi },
  { label: "stat", re: /\b(?:studies show|industry average|according to (?:gartner|forrester|hubspot))\b/gi },
];

export function extractPlaceholders(text: string) {
  return [...text.matchAll(PLACEHOLDER_RE)].map((match) => match[0]);
}

export function factCorpus(facts: { key: string; value: string; source?: string }[], extra: string[] = []) {
  return [...facts.filter((fact) => fact.source !== "missing").map((fact) => `${fact.key} ${fact.value}`), ...extra]
    .join("\n")
    .toLowerCase();
}

/**
 * If generated copy contains commercial claims that do not appear in the supplied
 * facts, replace the offending span with a placeholder. This is the last line of
 * defense after the model QC stage.
 */
export function sanitizeInventedClaims(
  body: string,
  facts: { key: string; value: string; source?: string }[],
  extraFacts: string[] = [],
) {
  const known = factCorpus(facts, extraFacts);
  let next = body;
  const invented: string[] = [];

  for (const { label, re } of COMMERCIAL_PATTERNS) {
    next = next.replace(re, (match) => {
      if (known.includes(match.toLowerCase())) return match;
      invented.push(match);
      return `[PLACEHOLDER: confirm ${label} — not present in the brief]`;
    });
  }

  return { body: next, invented, placeholders: extractPlaceholders(next) };
}

export function localCompleteness(bodies: string[]) {
  const text = bodies.join("\n");
  const placeholders = extractPlaceholders(text);
  if (!text.trim()) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  const penalty = Math.min(80, placeholders.length * 12);
  const density = Math.min(20, Math.round((placeholders.length / Math.max(words, 1)) * 400));
  return Math.max(0, Math.min(100, 100 - penalty - density));
}

export function mergeScore(
  model: { completeness: number; fidelity: number; clarity: number; commercialReadiness: number; overall?: number; notes: string[] },
  local: number,
) {
  const completeness = Math.round((model.completeness + local) / 2);
  const overall = Math.round(
    (completeness + model.fidelity + model.clarity + model.commercialReadiness) / 4,
  );
  return {
    completeness,
    fidelity: model.fidelity,
    clarity: model.clarity,
    commercialReadiness: model.commercialReadiness,
    overall,
    notes: model.notes,
  };
}
