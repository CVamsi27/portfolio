import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

/** 1×1 PNG — a real image the browser can decode and re-encode. */
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64",
);

const files = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    name: `shot-${index + 1}.png`,
    mimeType: "image/png",
    buffer: png,
  }));

type StoredDrop = {
  text: string;
  image: string | null;
  imagePath: string | null;
  images?: string[];
};

async function storedDrops(page: import("@playwright/test").Page) {
  return page.evaluate(
    () => JSON.parse(localStorage.getItem("vk:share") ?? "[]") as StoredDrop[],
  );
}

test.describe("share drop uploads", () => {
  test("saves several compressed images on one drop", async ({ page }) => {
    await seed(page);
    await page.goto("/share");
    await page.getByRole("button", { name: "New drop" }).click();
    await page
      .getByRole("textbox", { name: "Drop content" })
      .fill("Two screenshots from the review");
    await page.locator('input[type="file"]').setInputFiles(files(2));

    await expect(page.getByAltText("Selected image 1")).toBeVisible();
    await expect(page.getByAltText("Selected image 2")).toBeVisible();
    await expect(page.getByText("2 of 6 images")).toBeVisible();

    await page.getByRole("button", { name: "Save drop" }).click();

    await expect(
      page.getByText("Two screenshots from the review"),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "shared drop image 1" }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "shared drop image 2" }),
    ).toBeVisible();

    const [drop] = await storedDrops(page);
    expect(drop.images).toHaveLength(2);
    // Local mode keeps bytes inline, but they must be the compressed JPEG
    // re-encode rather than the original camera-sized upload.
    for (const image of drop.images ?? []) {
      expect(image.startsWith("data:image/jpeg")).toBe(true);
    }
    expect(drop.imagePath).toBeNull();
  });

  test("accepts images dropped onto the composer", async ({ page }) => {
    await seed(page);
    await page.goto("/share");
    await page.getByRole("button", { name: "New drop" }).click();

    await page.getByTestId("drop-image-zone").evaluate((zone, base64) => {
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const file = new File([bytes], "dropped.png", { type: "image/png" });
      const transfer = new DataTransfer();
      transfer.items.add(file);
      zone.dispatchEvent(
        new DragEvent("dragover", {
          bubbles: true,
          cancelable: true,
          dataTransfer: transfer,
        }),
      );
      zone.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer: transfer,
        }),
      );
    }, png.toString("base64"));

    await expect(page.getByAltText("Selected image 1")).toBeVisible();
    await expect(page.getByText("1 of 6 images")).toBeVisible();
  });

  test("keeps six images and reports the ones beyond the cap", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/share");
    await page.getByRole("button", { name: "New drop" }).click();
    await page.locator('input[type="file"]').setInputFiles(files(8));

    await expect(page.getByText("6 of 6 images")).toBeVisible();
    await expect(page.getByText("Some files were skipped")).toBeVisible();
    await expect(page.getByAltText("Selected image 6")).toBeVisible();
    await expect(page.getByAltText("Selected image 7")).toHaveCount(0);
  });

  test("removes one selected image without touching the others", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/share");
    await page.getByRole("button", { name: "New drop" }).click();
    await page.locator('input[type="file"]').setInputFiles(files(2));
    await expect(page.getByText("2 of 6 images")).toBeVisible();

    await page
      .getByRole("button", { name: "Remove selected image 1", exact: true })
      .click();
    await expect(page.getByText("1 of 6 images")).toBeVisible();
    // The remaining picture is re-indexed as the first selection.
    await expect(page.getByAltText("Selected image 1")).toBeVisible();
    await expect(page.getByAltText("Selected image 2")).toHaveCount(0);
  });
});
