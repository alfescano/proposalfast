import { expect, test } from "@playwright/test";

test("marketing home loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Client proposals that close");
  await expect(page.getByRole("link", { name: /pricing/i }).first()).toBeVisible();
});

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});

test("register requires terms agreement", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Create your workspace" })).toBeVisible();
  const submit = page.getByRole("button", { name: "Create workspace" });
  await expect(submit).toBeDisabled();
  const agree = page.getByRole("checkbox", { name: /I agree to the Terms of Service and Privacy Policy/i });
  await expect(agree).toBeVisible();
  await expect(page.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
  await expect(page.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
  await agree.check();
  await expect(submit).toBeEnabled();
});
