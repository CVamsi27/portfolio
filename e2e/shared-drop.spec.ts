import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

const shareId = "ac5a22c5-a9c0-4c67-a72e-bebbe9d4ef9f";
const apiPattern = `**/api/share/${shareId}`;
const pixel =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";

const payload = {
  text: "Deploy notes for the Friday release",
  imageUrl: pixel,
  imageUrls: [pixel],
  created_at: "2026-11-10T10:00:00.000Z",
  expiresAt: new Date(Date.now() + 172_800_000).toISOString(),
  ownerEmail: "friend@gmail.com",
  isPublic: false,
};

function json(
  route: import("@playwright/test").Route,
  body: unknown,
  status = 200,
) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

test.describe("shared drop link", () => {
  test("requests once and renders the sender, media and actions", async ({
    page,
  }) => {
    await seed(page);
    let calls = 0;
    await page.route(apiPattern, async (route) => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await json(route, payload);
    });

    await page.goto(`/share/${shareId}`);
    await expect(
      page.getByRole("heading", { name: "Shared drop", level: 1 }),
    ).toBeVisible();
    await expect(page.locator(".animate-pulse").first()).toBeVisible();

    await expect(page.getByText(payload.text)).toBeVisible({ timeout: 7_000 });
    await expect(page.getByText("friend@gmail.com")).toBeVisible();
    await expect(page.getByText("Private", { exact: true })).toBeVisible();
    await expect(page.getByRole("img", { name: "shared drop" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy text" })).toBeVisible();
    await expect(page.getByText(/^Sent /)).toBeVisible();

    // The page used to rebuild its promise during render and re-request the
    // drop on every pass; one load must mean one request.
    await page.waitForTimeout(600);
    expect(calls).toBe(1);
  });

  test("shows every image of a multi-image drop", async ({ page }) => {
    await seed(page);
    await page.route(apiPattern, (route) =>
      json(route, {
        ...payload,
        imageUrls: [pixel, pixel, pixel],
        isPublic: true,
      }),
    );

    await page.goto(`/share/${shareId}`);
    await expect(
      page.getByRole("img", { name: "shared drop image 1" }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "shared drop image 3" }),
    ).toBeVisible();
    await expect(page.getByText("Link", { exact: true })).toBeVisible();
    await expect(page.getByText(payload.text)).toBeVisible();
  });

  test("explains a missing link and retries from the same card", async ({
    page,
  }) => {
    await seed(page);
    let calls = 0;
    await page.route(apiPattern, (route) => {
      calls += 1;
      if (calls === 1) return json(route, { error: "Share not found" }, 404);
      return json(route, payload);
    });

    await page.goto(`/share/${shareId}`);
    await expect(
      page.getByRole("heading", { name: "Sign in to view" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Shared drop", level: 1 }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByText(payload.text)).toBeVisible();
    expect(calls).toBe(2);
  });

  test("keeps a populated drop readable on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.route(apiPattern, (route) =>
      json(route, { ...payload, imageUrls: [pixel, pixel, pixel] }),
    );

    await page.goto(`/share/${shareId}`);
    await expect(page.getByText(payload.text)).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
  });
});
