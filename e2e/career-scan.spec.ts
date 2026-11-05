import { expect, test } from "@playwright/test";
import { seed } from "./helpers";
import { careerRole, contractRole } from "./career-workflow-fixture";

for (const width of [320, 1280]) {
  test(`the first opportunity is readable before scrolling at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.clock.setFixedTime(new Date("2026-11-05T09:00:00Z"));
    await seed(page, {
      "vk:career:research": {
        [careerRole.id]: careerRole,
        [contractRole.id]: contractRole,
      },
    });
    await page.goto("/roadmap?queue=ready");
    const first = page.getByRole("button", {
      name: "Open Sample Company Product Engineer",
      exact: true,
    });
    const box = await first.boundingBox();
    expect(box).not.toBeNull();
    // Keep the role ahead of supporting controls on desktop and the phone dock on mobile.
    expect(box!.y + box!.height).toBeLessThan(width === 320 ? 720 : 500);
    await first.click();
    await expect(
      page.getByRole("dialog", { name: "Sample Company · Product Engineer" }),
    ).toBeVisible();
  });
}
