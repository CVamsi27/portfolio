import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

const entry = {
  id: "saved",
  body: "Keep my interview notes",
  kind: "note",
  tags: ["work"],
  goalCategory: "relocation",
  pinned: true,
  createdAt: 1234,
};

test("long archive content remains readable without mobile overflow", async ({
  page,
}) => {
  const body = `reference_${"longtext".repeat(50)}`;
  await seed(page, { "vk:archive:items": [{ ...entry, body }] });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/archive");
  await expect(page.getByText(body, { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  const item = page.locator("li").filter({ hasText: "reference_" });
  const content = (await page.getByText(body, { exact: true }).boundingBox())!;
  const actions = (await item
    .getByRole("button", { name: "Delete archive item" })
    .boundingBox())!;
  expect(actions.y).toBeGreaterThanOrEqual(content.y + content.height);
});

test("invalid archive links keep the draft and valid links announce saving", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/archive");
  await page.getByRole("button", { name: "Link", exact: true }).click();
  const draft = page.getByRole("textbox", { name: "Capture", exact: true });
  const source = page.getByRole("textbox", { name: "Source URL", exact: true });
  await draft.fill("Study reference");
  await source.fill("http://");
  await page.getByRole("button", { name: "Save to library" }).click();
  await expect(source).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#archive-url-error")).toContainText(
    "Enter a valid",
  );
  await expect(draft).toHaveValue("Study reference");
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("vk:archive:items") ?? "[]"),
    ),
  ).toHaveLength(0);
  await source.fill("example.com/reference");
  await page.getByRole("button", { name: "Save to library" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Saved to library" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "https://example.com/reference",
      exact: true,
    }),
  ).toHaveAttribute("href", "https://example.com/reference");
});

test("an empty goal filter offers access to existing items", async ({
  page,
}) => {
  await seed(page, {
    "vk:archive:items": [{ ...entry, goalCategory: "general" }],
  });
  await page.goto("/archive");
  await expect(
    page.getByText("No items for this goal", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Show all items", exact: true })
    .click();
  await expect(page.getByText(entry.body, { exact: true })).toBeVisible();
});

test("archive deletion can be undone without losing item metadata", async ({
  page,
}) => {
  await seed(page, { "vk:archive:items": [entry] });
  await page.goto("/archive");
  await page.getByRole("button", { name: "Delete archive item" }).click();
  await expect(page.getByText(entry.body, { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Undo delete", exact: true }).click();
  await expect(page.getByText(entry.body, { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("vk:archive:items") ?? "[]"),
    ),
  ).toEqual([entry]);
  await page.reload();
  await expect(page.getByText(entry.body, { exact: true })).toBeVisible();
});

test("archive copy failure explains how to recover", async ({ page }) => {
  await seed(page, { "vk:archive:items": [entry] });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Clipboard unavailable");
        },
      },
    });
  });
  await page.goto("/archive");
  await page.getByRole("button", { name: "Copy archive text" }).click();
  await expect(page.locator("#archive-feedback")).toContainText(
    "Select the text and copy it manually",
  );
  await expect(page.getByText(entry.body, { exact: true })).toBeVisible();
});
