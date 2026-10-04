/**
 * Server URL for the Capacitor shell.
 *
 * `cap sync` reads this and writes the result into the iOS and Android
 * projects. The Next.js app does not import this module.
 *
 * Store builds should leave CAPACITOR_SERVER_URL unset so the shell loads
 * https://proposalfast.ai. Set the env var only to point a local or internal
 * build at a staging host, then sync again.
 */

export const CAPACITOR_APP_ID = "ai.proposalfast.app";
export const CAPACITOR_APP_NAME = "ProposalFast";
export const PRODUCTION_SERVER_URL = "https://proposalfast.ai";

const PRODUCTION_HOST = "proposalfast.ai";

export function resolveCapacitorServerUrl(
  raw: string | undefined = process.env.CAPACITOR_SERVER_URL,
): string {
  const trimmed = raw?.trim() ?? "";
  const input = trimmed.length > 0 ? trimmed : PRODUCTION_SERVER_URL;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error(
      `CAPACITOR_SERVER_URL is not a valid URL (${JSON.stringify(input)}). Use an https origin such as ${PRODUCTION_SERVER_URL}.`,
    );
  }

  if (url.protocol !== "https:") {
    throw new Error(
      `CAPACITOR_SERVER_URL must use https (got ${url.protocol}//). The native shell does not allow cleartext HTTP.`,
    );
  }

  if (url.username || url.password) {
    throw new Error("CAPACITOR_SERVER_URL must not include credentials.");
  }

  const host = url.hostname.toLowerCase();
  if (!isAllowedServerHost(host)) {
    throw new Error(
      `CAPACITOR_SERVER_URL host must be ${PRODUCTION_HOST}, a subdomain of it, or a *.vercel.app preview. Got ${host}.`,
    );
  }

  return url.origin;
}

export function isAllowedServerHost(host: string): boolean {
  const normalized = host.toLowerCase().replace(/\.$/, "");
  if (normalized === PRODUCTION_HOST) return true;
  if (normalized.endsWith(`.${PRODUCTION_HOST}`)) return true;
  if (normalized.endsWith(".vercel.app") && normalized !== "vercel.app")
    return true;
  return false;
}

/**
 * Extra hosts the WebView may navigate to.
 *
 * Capacitor opens any other top-level navigation in the system browser.
 * The app host itself is included so staging origins stay inside the shell.
 * Google and Stripe are top-level navigations (OAuth and Checkout / Customer
 * Portal) that must finish in this WebView so the proposalfast.ai session
 * cookie is still there when they redirect back.
 */
export function capacitorAllowNavigation(serverUrl: string): string[] {
  const host = new URL(serverUrl).hostname.toLowerCase();
  // Capacitor matches `*.example.com` to one label (`www.example.com`),
  // not the apex and not deeper hosts. Apex hosts are listed on their own.
  const hosts = [
    PRODUCTION_HOST,
    `*.${PRODUCTION_HOST}`,
    "accounts.google.com",
    "google.com",
    "*.google.com",
    "*.googleusercontent.com",
    "*.youtube.com",
    "checkout.stripe.com",
    "billing.stripe.com",
    "hooks.stripe.com",
    "stripe.com",
    "*.stripe.com",
    "*.stripe.network",
  ];

  if (!hosts.includes(host)) {
    hosts.push(host);
  }
  if (host.endsWith(".vercel.app")) {
    hosts.push("*.vercel.app");
  }

  return hosts;
}
