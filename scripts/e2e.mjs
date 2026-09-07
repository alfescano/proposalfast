/**
 * Runs Playwright smoke tests. Exits 0 if browsers are not installed
 * (common in slim CI images). `npm test` remains Vitest-only.
 */
import { spawnSync } from "node:child_process";

async function chromiumAvailable() {
  try {
    const { chromium } = await import("@playwright/test");
    const browser = await chromium.launch();
    await browser.close();
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/Executable doesn't exist|browserType\.launch|Failed to launch/i.test(message)) {
      return false;
    }
    console.warn(message);
    return false;
  }
}

if (!(await chromiumAvailable())) {
  console.log("Skipping Playwright smoke: Chromium is not available in this environment.");
  console.log("Install with: npx playwright install --with-deps chromium");
  process.exit(0);
}

const result = spawnSync("npx", ["playwright", "test"], { stdio: "inherit" });
process.exit(result.status ?? 1);
