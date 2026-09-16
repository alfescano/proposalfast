import { expect, test } from "@playwright/test";

test("marketing home loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Client proposals that close",
  );
  await expect(
    page.getByRole("link", { name: /pricing/i }).first(),
  ).toBeVisible();
});

test("marketing home shows the product demo", async ({ page }) => {
  await page.goto("/");
  const demo = page.locator("#demo");
  await expect(
    demo.getByRole("heading", {
      name: /From brief to client portal in minutes/i,
    }),
  ).toBeVisible();
  await expect(
    demo.getByText(/Fees stay placeholders until you fill them/i),
  ).toBeVisible();
  const embed = demo.locator("iframe");
  await expect(embed).toHaveAttribute(
    "src",
    /youtube-nocookie\.com\/embed\/aWZjHgRj_Yc/,
  );
  await expect(embed).toHaveAttribute("title", /ProposalFast product demo/i);
  await expect(
    demo.getByRole("link", { name: /Open on YouTube/i }),
  ).toHaveAttribute("href", "https://www.youtube.com/watch?v=aWZjHgRj_Yc");
  await demo.getByRole("button", { name: "Browse stills" }).click();
  await expect(
    demo.getByRole("img", { name: "Proposalfast — proposals that close" }),
  ).toBeVisible();
  await expect(demo.getByRole("button", { name: "Next frame" })).toBeVisible();
});

test("pricing shows founding pro while the window is open", async ({
  page,
}) => {
  test.skip(
    Date.now() >= Date.parse("2026-10-01T07:00:00.000Z"),
    "Founding Pro window has ended",
  );
  await page.goto("/pricing");
  await expect(
    page.getByRole("heading", { name: /Simple seats/i }),
  ).toBeVisible();
  await expect(page.getByText(/Founding Pro is \$29/i).first()).toBeVisible();
  await expect(page.getByText(/September 30, 2026/i).first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Start Founding Pro/i }),
  ).toBeVisible();
  await expect(page.getByText(/\$49/i).first()).toBeVisible();
});

test("blog index and a seed post load", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Notes on proposals that actually get finished",
  );
  await expect(page.getByRole("link", { name: "Blog" }).first()).toBeVisible();
  await page
    .getByRole("link", { name: /Why proposals stall after you send them/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/blog\/why-proposals-stall-after-send/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Why proposals stall after you send them",
  );
  await expect(
    page.getByRole("link", { name: /Start free/i }).first(),
  ).toHaveAttribute("href", "/register");
});

test("blog is usable at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/blog/proposal-portal-vs-pdf");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /What a PDF is good at/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /See pricing/i }).first(),
  ).toHaveAttribute("href", "/pricing");
});

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});

test("register requires terms agreement", async ({ page }) => {
  await page.goto("/register");
  await expect(
    page.getByRole("heading", { name: "Create your workspace" }),
  ).toBeVisible();
  const submit = page.getByRole("button", { name: "Create workspace" });
  await expect(submit).toBeDisabled();
  const agree = page.getByRole("checkbox", {
    name: /I agree to the Terms of Service and Privacy Policy/i,
  });
  await expect(agree).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Terms of Service" }),
  ).toHaveAttribute("href", "/terms");
  await expect(
    page.getByRole("link", { name: "Privacy Policy" }),
  ).toHaveAttribute("href", "/privacy");
  await agree.check();
  await expect(submit).toBeEnabled();
});
