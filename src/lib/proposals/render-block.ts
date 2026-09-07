export function sectionBody(content: unknown) {
  if (content && typeof content === "object" && "body" in content) {
    return String((content as { body?: string }).body ?? "");
  }
  return "";
}
