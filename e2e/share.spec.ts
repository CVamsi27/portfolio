import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

const savedDrop = {
  id: "d1",
  text: "A private note",
  image: null,
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  tags: ["Note"],
};
const savedLink = {
  id: "link-1",
  url: "https://personal.buildora.work/share/link-1",
  expiresAt: savedDrop.expiresAt,
  emails: ["friend@gmail.com"],
  isPublic: false,
};

async function denyClipboard(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new DOMException("Clipboard blocked", "NotAllowedError");
        },
      },
    });
  });
}

test.describe("share", () => {
  test("combines sent drops and incoming items behind one Sharing route", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/share");

    await expect(page.getByRole("link", { name: "My drops" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      page
        .getByTestId("sharing-view-switcher")
        .getByRole("link", { name: "Inbox" }),
    ).toHaveAttribute("href", "/share?view=incoming");
    await expect(page.getByText("Storage limits")).toHaveCount(0);

    await page.goto("/share?view=incoming");
    await expect(page.getByRole("link", { name: "Inbox" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByTestId("shared-inbox-summary")).toBeVisible();
  });

  test("share page shows hard limits and explicit auto-clear choices", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/share");
    await expect(page.getByText("Storage limits")).toHaveCount(0);
    await page.getByRole("button", { name: "New drop", exact: true }).click();
    await expect(
      page.getByRole("group", { name: "Auto-clear this drop" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "24 hours" })).toBeVisible();
    await expect(page.getByRole("button", { name: "7 days" })).toBeVisible();
    await expect(page.getByRole("button", { name: "30 days" })).toBeVisible();
  });

  test("share editor defaults to specific people", async ({ page }) => {
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
    await page
      .getByRole("button", { name: "Shared item actions", exact: true })
      .first()
      .click();
    await page.getByRole("menuitem", { name: "Share", exact: true }).click();
    await expect(page.getByText("Who can view this drop?")).toBeVisible();
    await expect(
      page.getByRole("radio", { name: /Specific people/i }),
    ).toBeChecked();
    await expect(page.getByPlaceholder("friend@gmail.com")).toBeVisible();
  });

  test("reports a blocked clipboard without claiming the text was copied", async ({
    page,
  }) => {
    await seed(page, { "vk:share": [savedDrop] });
    await denyClipboard(page);
    await page.goto("/share");
    await page
      .getByRole("button", { name: "Shared item actions", exact: true })
      .first()
      .click();
    await page
      .getByRole("menuitem", { name: "Copy text", exact: true })
      .click();
    await expect(
      page.getByText("Could not copy text", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Shared item actions", exact: true })
      .first()
      .click();
    await expect(
      page.getByRole("menuitem", { name: "Copy text", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copied", exact: true }),
    ).toHaveCount(0);
  });

  test("keeps a saved link selectable when the clipboard is blocked", async ({
    page,
  }) => {
    await seed(page, {
      "vk:share": [savedDrop],
      "vk:share:links": { d1: savedLink },
    });
    await denyClipboard(page);
    await page.goto("/share");
    await page
      .getByRole("button", { name: "Shared item actions", exact: true })
      .first()
      .click();
    await page
      .getByRole("menuitem", { name: "Manage access", exact: true })
      .click();
    await page.getByRole("button", { name: "Copy link", exact: true }).click();
    await expect(
      page.getByText("Could not copy link", { exact: true }),
    ).toBeVisible();
    const link = page.getByRole("textbox", { name: "Share link", exact: true });
    await expect(link).toHaveValue(savedLink.url);
    await link.click();
    expect(
      await link.evaluate(
        (input: HTMLInputElement) =>
          input.selectionEnd! - input.selectionStart!,
      ),
    ).toBe(savedLink.url.length);
    await expect(
      page.getByRole("button", { name: "Link copied", exact: true }),
    ).toHaveCount(0);
  });

  test("offers an explicit save action after changing saved link permissions", async ({
    page,
  }) => {
    await seed(page, {
      "vk:share": [savedDrop],
      "vk:share:links": { d1: savedLink },
    });
    await page.goto("/share");
    await page
      .getByRole("button", { name: "Shared item actions", exact: true })
      .first()
      .click();
    await page
      .getByRole("menuitem", { name: "Manage access", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Remove friend@gmail.com", exact: true })
      .click();
    await page
      .getByPlaceholder("friend@gmail.com")
      .fill("replacement@gmail.com");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Save share settings", exact: true }),
    ).toBeVisible();
    // Local mode cannot write cloud permissions; the persisted link stays intact until a signed-in save.
    await expect(
      page.getByRole("button", { name: "Save share settings", exact: true }),
    ).toBeDisabled();
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("vk:share:links")!).d1.emails,
      ),
    ).toEqual(["friend@gmail.com"]);
  });

  test("wraps long mobile drops and keeps recipient removal reachable", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    const note = `https://example.com/${"long-path".repeat(45)}`;
    const email = `${"long-name".repeat(6)}@example.com`;
    await seed(page, {
      "vk:share": [{ ...savedDrop, text: note }],
      "vk:share:links": { d1: { ...savedLink, emails: [email] } },
    });
    await page.goto("/share");
    await page
      .locator("summary")
      .filter({ hasText: note.slice(0, 180) })
      .click();
    const content = page.getByText(note, { exact: true });
    expect(
      await content.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Shared item actions", exact: true })
      .first()
      .click();
    await page
      .getByRole("menuitem", { name: "Manage access", exact: true })
      .click();
    const remove = page.getByRole("button", {
      name: `Remove ${email}`,
      exact: true,
    });
    const bounds = await remove.boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
    await remove.click();
    await expect(remove).toHaveCount(0);
  });

  test("prioritizes saved content and opens capture on demand on phone", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page, { "vk:share": [savedDrop] });
    await page.goto("/share");
    const content = page.getByRole("textbox", {
      name: "Drop content",
      exact: true,
    });
    await expect(content).toHaveCount(0);
    const note = page.getByText(savedDrop.text, { exact: true });
    expect((await note.boundingBox())!.y).toBeLessThan(720);
    await page.getByRole("button", { name: "New drop", exact: true }).click();
    await expect(content).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save drop", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByText("Drops: 50 active drops maximum.", { exact: false }),
    ).toBeHidden();
  });

  test("edits access in a focused dialog and returns to the saved drop", async ({
    page,
  }) => {
    await seed(page, {
      "vk:share": [savedDrop],
      "vk:share:links": { d1: savedLink },
    });
    await page.goto("/share");
    const opener = page.getByRole("button", {
      name: "Shared item actions",
      exact: true,
    });
    await opener.click();
    await page
      .getByRole("menuitem", { name: "Manage access", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Who can view this drop?",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("textbox", { name: "Share link", exact: true }),
    ).toHaveValue(savedLink.url);
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test("captures a drop and filters the saved list without changing records", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/share");
    await page.getByRole("button", { name: "New drop", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Drop content", exact: true })
      .fill("Remember the train tickets");
    await page.getByRole("button", { name: "Save drop", exact: true }).click();
    await expect(
      page.getByText("Remember the train tickets", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Drop content", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("combobox", { name: "Filter drops by type" })
      .selectOption("Image");
    await expect(
      page.getByText("No drops match", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Filter drops by type" })
      .selectOption("all");
    await expect(
      page.getByText("Remember the train tickets", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("vk:share")!).map(
          (drop: { text: string }) => drop.text,
        ),
      ),
    ).toEqual(["Remember the train tickets"]);
  });
});
