import { expect, test } from "@playwright/test";

test("unauthenticated app routes redirect to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

test("demo owner can sign in and reach the dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("alex@proposalfast.dev");
  await page.getByLabel("Password").fill("DemoPassword123!");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });
  await expect(page.getByRole("heading").first()).toBeVisible();
});

test("non-platform-admin receives 404 on /admin", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("member@proposalfast.dev");
  await page.getByLabel("Password").fill("MemberPassword123!");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });
  const response = await page.goto("/admin");
  expect(response?.status()).toBe(404);
});

test("marketing home is usable at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /create a workspace/i })).toBeVisible();
});

test("unknown public portal id is not found", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/p/doesnotexist999");
  expect(response?.status()).toBe(404);
});

test("seed client portal renders on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/p/dPD2TtktTd2o");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: /Harbor/i })).toBeVisible();
  await expect(page.getByText(/Prepared by/i)).toBeVisible();
});
