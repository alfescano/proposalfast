/** localStorage key. Bump only if the hint should show again for everyone. */
export const PWA_DISMISS_KEY = "pf_pwa_install_dismissed";

/** Shared with the marketing cookie banner so the two bars do not stack. */
export const COOKIE_CONSENT_KEY = "pf_cookie_consent";
export const COOKIE_CONSENT_EVENT = "pf-cookie-consent";

const MARKETING_PATHS = new Set([
  "/",
  "/about",
  "/blog",
  "/compare",
  "/contact",
  "/cookie-policy",
  "/features",
  "/pricing",
  "/privacy",
  "/refund-policy",
  "/security",
  "/templates",
  "/terms",
]);

/** Auth, admin, and the client proposal portal stay free of install chrome. */
const HIDDEN_PREFIXES = [
  "/admin",
  "/forgot-password",
  "/invite",
  "/login",
  "/p",
  "/register",
  "/reset-password",
  "/verify-email",
];

export function isMarketingPath(pathname: string): boolean {
  if (MARKETING_PATHS.has(pathname)) return true;
  return pathname.startsWith("/blog/") || pathname.startsWith("/compare/");
}

export function isInstallHintPath(pathname: string): boolean {
  return !HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
