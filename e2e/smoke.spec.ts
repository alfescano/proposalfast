import { expect, test } from "@playwright/test";

test("marketing home loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Client proposals that close");
  await expect(page.getByRole("link", { name: /pricing/i }).first()).toBeVisible();
});

test("marketing home shows the product demo", async ({ page }) => {
  await page.goto("/");
  const demo = page.locator("#demo");
  await expect(demo.getByRole("heading", { name: /From brief to client portal in minutes/i })).toBeVisible();
  await expect(demo.getByText(/Fees stay placeholders until you fill them/i)).toBeVisible();
  const embed = demo.locator("iframe");
  await expect(embed).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/aWZjHgRj_Yc/);
  await expect(embed).toHaveAttribute("title", /ProposalFast product demo/i);
  await expect(demo.getByRole("link", { name: /Open on YouTube/i })).toHaveAttribute(
    "href",
    "https://www.youtube.com/watch?v=aWZjHgRj_Yc",
  );
  await demo.getByRole("button", { name: "Browse stills" }).click();
  await expect(demo.getByRole("img", { name: "Proposalfast — proposals that close" })).toBeVisible();
  await expect(demo.getByRole("button", { name: "Next frame" })).toBeVisible();
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
