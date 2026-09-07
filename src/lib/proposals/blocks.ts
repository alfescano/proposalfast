export const BLOCK_TYPES = [
  { id: "heading", label: "Heading" },
  { id: "paragraph", label: "Paragraph" },
  { id: "pricing", label: "Pricing" },
  { id: "signature", label: "Signature" },
  { id: "faq", label: "FAQ" },
  { id: "cover", label: "Cover" },
  { id: "introduction", label: "Introduction" },
  { id: "scope", label: "Scope" },
  { id: "timeline", label: "Timeline" },
  { id: "terms", label: "Terms" },
  { id: "next_steps", label: "Next steps" },
  { id: "custom", label: "Custom" },
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number]["id"];

export function blockLabel(type: string) {
  return BLOCK_TYPES.find((block) => block.id === type)?.label ?? type;
}

export function defaultBlockTitle(type: string) {
  if (type === "heading") return "Heading";
  if (type === "paragraph") return "Details";
  if (type === "pricing") return "Investment";
  if (type === "signature") return "Signature";
  if (type === "faq") return "Questions";
  return blockLabel(type);
}

export function defaultBlockBody(type: string) {
  if (type === "pricing") return "[PLACEHOLDER: confirm fee before sending]";
  if (type === "signature") return "Sign below to accept this proposal.";
  if (type === "faq") return "Q: What is included?\nA: [PLACEHOLDER: answer from your facts]";
  return "";
}

export type EditorSection = {
  id: string;
  title: string;
  body: string;
  type: string;
};

export function isNewSectionId(id: string) {
  return id.startsWith("new_");
}
