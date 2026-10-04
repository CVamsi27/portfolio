import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test("audio break opens honest YouTube Music destinations and closes cleanly", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/roadmap");
  const opener = page
    .getByRole("button", { name: "Audio break", exact: true })
    .first();
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Listen on YouTube Music" });
  await expect(dialog).toBeVisible();
  const links = dialog.getByRole("link", {
    name: /Find podcast on YouTube Music/,
  });
  await expect(links).toHaveCount(3);
  for (const link of await links.all()) {
    const url = new URL((await link.getAttribute("href"))!);
    expect(url.hostname).toBe("music.youtube.com");
    expect(url.pathname).toBe("/search");
    expect(url.searchParams.get("q")).toContain("podcast");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  await expect(dialog.locator("iframe")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await page.locator("[inert]").count()).toBe(0);
});

test("break timer survives hidden time and pause without changing focus records", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 750 });
  await seed(page);
  await page.goto("/roadmap");
  await page
    .getByRole("button", { name: "Audio break", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: "Listen on YouTube Music" });
  await page.clock.install();
  await dialog
    .getByRole("button", { name: "Start timer", exact: true })
    .click();
  await page.clock.fastForward(65_000);
  await expect(dialog.getByLabel("Break time remaining")).toHaveText("03:55");
  await dialog
    .getByRole("button", { name: "Pause timer", exact: true })
    .click();
  await page.clock.fastForward(60_000);
  await expect(dialog.getByLabel("Break time remaining")).toHaveText("03:55");
  await dialog
    .getByRole("button", { name: "Resume timer", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await page.clock.fastForward(240_000);
  await page
    .getByRole("button", { name: "Audio break", exact: true })
    .first()
    .click();
  await expect(
    dialog.getByText("Break finished. Return to study when you’re ready."),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Reset timer", exact: true })
    .click();
  await expect(dialog.getByLabel("Break time remaining")).toHaveText("05:00");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("vk:focus:active") ?? "null")),
  ).toBeNull();
});

test("saved YouTube blocklists permit the exact Music destination", async ({
  page,
}) => {
  await seed(page, {
    "vk:distraction_shield_state": {
      enabled: true,
      allowlist: [],
      blocklist: ["youtube.com"],
      activeLeash: null,
      lockdownUntil: null,
      history: [],
    },
  });
  await page.route("https://music.youtube.com/**", (route) =>
    route.fulfill({ body: "Podcast destination" }),
  );
  await page.goto("/roadmap");
  await page
    .getByRole("button", { name: "Audio break", exact: true })
    .first()
    .click();
  const popupPromise = page.waitForEvent("popup");
  await page
    .getByRole("link", {
      name: "Find podcast on YouTube Music: Syntax",
      exact: true,
    })
    .click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  expect(new URL(popup.url()).hostname).toBe("music.youtube.com");
  await popup.close();
});
