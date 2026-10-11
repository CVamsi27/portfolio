import { expect, test } from "@playwright/test";

test("personal deep pages and Flight requests are gated even in a build without auth config", async ({
  request,
}) => {
  for (const path of [
    "/hub",
    "/share",
    "/share/ac5a22c5-a9c0-4c67-a72e-bebbe9d4ef9f",
    "/trackers/landing",
    "/goal?_rsc=access-test",
  ]) {
    const response = await request.get(path, {
      headers: { Host: "personal.buildora.work" },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(307);
    expect(new URL(response.headers().location, response.url()).pathname).toBe(
      "/login",
    );
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(await response.text()).not.toContain('data-testid="today-header"');
  }
});

test("personal APIs fail closed across deployed hosts, including image-suffixed requests", async ({
  request,
}) => {
  for (const host of [
    "personal.buildora.work",
    "buildora.work",
    "preview.vercel.app",
  ]) {
    for (const path of [
      "/api/share/ac5a22c5-a9c0-4c67-a72e-bebbe9d4ef9f",
      "/api/share/test.svg",
      "/api/motivation-image",
    ]) {
      const response = await request.get(path, {
        headers: { Host: host },
        maxRedirects: 0,
      });
      expect(response.status()).toBe(503);
      expect(await response.json()).toEqual({
        error: "Access is not configured.",
      });
    }
  }
});

test("personal login and bootstrap assets remain available", async ({
  request,
}) => {
  for (const path of [
    "/login",
    "/manifest.webmanifest",
    "/sw.js",
    "/icons/nova.svg",
  ]) {
    const response = await request.get(path, {
      headers: { Host: "personal.buildora.work" },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(200);
  }
  const callback = await request.get("/auth/callback?next=%2F%2Fevil.test", {
    headers: { Host: "personal.buildora.work" },
    maxRedirects: 0,
  });
  expect(callback.status()).toBe(307);
  expect(new URL(callback.headers().location, callback.url()).pathname).toBe(
    "/login",
  );
  expect(
    new URL(callback.headers().location, callback.url()).searchParams.get(
      "next",
    ),
  ).toBe("/hub");
});

test("personal login cannot offer local-only entry when Google auth is unavailable", async ({
  browser,
}) => {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  await page.route("http://personal.buildora.work:4111/**", async (route) => {
    const response = await route.fetch({
      url: route.request().url().replace("personal.buildora.work", "127.0.0.1"),
      headers: {
        ...route.request().headers(),
        host: "personal.buildora.work:4111",
      },
      maxRedirects: 0,
    });
    await route.fulfill({ response });
  });
  await page.goto("http://personal.buildora.work:4111/login");
  await expect(
    page.getByRole("heading", { name: "Sign-in is unavailable" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Continue to workspace" }),
  ).toHaveCount(0);
  await context.close();
});
