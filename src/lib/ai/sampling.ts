/**
 * Some OpenAI models (GPT-5 family, o-series reasoning) reject any temperature
 * other than the API default. Sending 0.2 against gpt-5-mini / gpt-5-nano
 * returns 400 unsupported_value.
 */
export function modelAllowsCustomTemperature(model: string): boolean {
  const id = model.trim().toLowerCase();
  if (!id) return false;
  if (id.startsWith("gpt-5")) return false;
  if (/^o[1-9]/.test(id)) return false;
  return true;
}

export function chatCompletionSampling(model: string): { temperature?: number } {
  if (!modelAllowsCustomTemperature(model)) {
    return {};
  }
  return { temperature: 0.2 };
}
