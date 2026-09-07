/**
 * Sample users (alex@proposalfast.dev, member@…) must never land in production.
 * Plans and system templates are catalog data and may still be seeded.
 */
export function shouldSeedSampleData(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.NODE_ENV === "production") return false;
  if (env.VERCEL_ENV === "production") return false;
  if (env.SEED_SAMPLE_DATA === "false") return false;
  return true;
}
