import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("share", () => {
  test("share page shows hard limits and explicit auto-clear choices", async ({ page }) => {
    await seed(page);
    await page.goto("/share");
    await expect(page.getByText("Storage limits")).toBeVisible();
    await expect(page.getByRole("group", { name: "Auto-clear this drop" })).toBeVisible();
    await expect(page.getByRole("button", { name: "24 hours" })).toBeVisible();
    await expect(page.getByRole("button", { name: "7 days" })).toBeVisible();
    await expect(page.getByRole("button", { name: "30 days" })).toBeVisible();
  });

  test("share editor asks for access and creates a link after confirmation", async ({ page }) => {
    await seed(page, {
      "vk:share": [
        {
          id: "d1",
          text: "A private note",
          image: null,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
          tags: ["Note"],
        },
      ],
    });
    await page.goto("/share");
    await page.getByRole("button", { name: "Share" }).click();
    await expect(page.getByText("Who can view this drop?")).toBeVisible();
    await expect(page.getByRole("radio", { name: /Specific people/i })).toBeChecked();
    await expect(page.getByPlaceholder("friend@gmail.com")).toBeVisible();
  });
});
