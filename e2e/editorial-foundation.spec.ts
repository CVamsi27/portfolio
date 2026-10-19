import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test("editorial foundation exposes semantic surfaces and an action hierarchy", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/trackers");
  await expect(
    page.locator('section.editorial-frame[data-surface="archive"]'),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, exact: true, name: "Today" }),
  ).toBeVisible();
  await expect(
    page.getByTestId("today-header").locator(".nova-primary-action"),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Week dates" }),
  ).toBeVisible();
});

test("portfolio uses the personal paper editorial surface", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('[data-surface="paper"]')).toBeVisible();
  await expect(page).toHaveTitle(/Vamsi Krishna.*Portfolio/i);
  await expect(
    page.getByRole("heading", { name: /Selected work/i }),
  ).toBeVisible();
  await expect(page.locator("[data-project-index]").first()).toBeVisible();
  await expect(page.locator('[data-card-variant="dossier"]')).toHaveCount(0);
});

test("personal tracker cards opt into the dossier treatment", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/todo");
  await expect
    .poll(() => page.locator('[data-card-variant="dossier"]').count())
    .toBeGreaterThan(0);
});

test("tracker shell reads as one editorial chapter", async ({ page }) => {
  await seed(page);
  await page.goto("/todo");
  await expect(page.getByTestId("chapter-header")).toHaveAttribute(
    "data-editorial-chapter",
    "true",
  );
  await expect(page.locator("[data-editorial-index]").first()).toBeVisible();
  await expect(page.locator("footer")).toHaveCount(0);
});

test("desktop and mobile shells keep the primary action visible", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/trackers");
  await expect(
    page.getByTestId("today-header").locator(".nova-primary-action"),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("mobile-command-dock")).toBeVisible();
  await expect(
    page.getByTestId("today-header").locator(".nova-primary-action"),
  ).toBeVisible();
});

test("product routes use distinct editorial chapters", async ({ page }) => {
  await seed(page);
  for (const route of [
    "/trackers",
    "/share",
    "/shared-with-me",
    "/settings",
    "/login",
    "/motivation",
  ]) {
    await page.goto(route);
    await expect(
      page
        .locator("[data-editorial-chapter], [data-testid='today-header']")
        .first(),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  }
});

test("authenticated utility routes keep primary navigation available", async ({
  page,
}) => {
  await seed(page);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/settings",
    "/archive",
    "/share",
    "/shared-with-me",
    "/motivation",
    "/more",
  ]) {
    await page.goto(route);
    await expect(page.getByTestId("mobile-command-dock")).toBeVisible();
  }
  await page.goto("/login");
  await expect(page.getByTestId("mobile-command-dock")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "NOVA home", exact: true }),
  ).toBeVisible();
  // Add a record now lives inside the workspace chrome, dock included.
  await page.goto("/log");
  await expect(page.getByTestId("mobile-command-dock")).toBeVisible();
});

test("Sharing keeps limits available and dispatch in a contextual editor", async ({
  page,
}) => {
  await seed(page, {
    "vk:share": [
      {
        id: "limits",
        text: "Saved note",
        tags: ["Note"],
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        pinned: false,
      },
    ],
  });
  await page.goto("/share");
  await page.getByText(/^Storage limits/).click();
  await expect(page.locator("body")).toContainText("50");
  await page.getByRole("button", { name: "New drop", exact: true }).click();
  await expect(
    page.getByRole("dialog").locator("[data-editorial-action]"),
  ).toBeVisible();
});

test("editorial shell remains readable at mobile width", async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/trackers");
  await expect(
    page.getByTestId("today-header").locator(".nova-primary-action"),
  ).toBeVisible();
  await expect(page.getByTestId("mobile-command-dock")).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "visible");
});
