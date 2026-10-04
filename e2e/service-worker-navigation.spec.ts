import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test("service worker never replays cached router payloads across deployments", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/hub");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => resolve(),
          { once: true },
        ),
      );
    const keys = await caches.keys();
    const cache = await caches.open(
      keys.find((key) => key.startsWith("nova-os-"))!,
    );
    await cache.put(
      new Request("/more?_rsc=stale-probe", { headers: { RSC: "1" } }),
      new Response("stale-router-payload", {
        headers: { "Content-Type": "text/x-component" },
      }),
    );
  });
  const response = await page.evaluate(async () => {
    const response = await fetch("/more?_rsc=stale-probe", {
      headers: { RSC: "1" },
    });
    return { text: await response.text(), status: response.status };
  });
  expect(response.status).toBe(200);
  expect(response.text).not.toBe("stale-router-payload");
  await page
    .getByTestId("tracker-primary-nav")
    .getByRole("link", { name: "More", exact: true })
    .click();
  await expect(page).toHaveURL(/\/more$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("worker upgrade clears the old navigation cache without deleting tracker data", async ({
  page,
}) => {
  const todos = [{ id: "keep", text: "Keep my saved task", done: false }];
  await seed(page, { "vk:todos": todos });
  await page.goto("/hub");
  const before = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const before = localStorage.getItem("vk:todos");
    const cache = await caches.open("nova-os-v3");
    await cache.put("/old-router-payload", new Response("old build"));
    await navigator.serviceWorker.register("/sw.js?upgrade-probe", {
      scope: "/",
    });
    return before;
  });
  await expect
    .poll(() => page.evaluate(() => caches.has("nova-os-v3")))
    .toBe(false);
  expect(await page.evaluate(() => localStorage.getItem("vk:todos"))).toBe(
    before,
  );
});
