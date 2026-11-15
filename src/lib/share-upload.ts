/**
 * Uploads for a signed-in drop.
 *
 * A failed upload must never fall back to keeping the bytes inline: those bytes
 * are part of the synced drop row, and an oversized row is exactly what stopped
 * drops from reaching other devices. The caller refuses the save instead, so the
 * selection stays in the composer and can be retried.
 */
export type DropUploadResult = {
  /** Storage paths for the images, in pick order. */
  paths: string[];
  /** How many images could not be stored. */
  failed: number;
};

export async function uploadDropImages(
  images: string[],
  nameFor: (index: number) => string,
  upload: (dataUrl: string, name: string) => Promise<string | null>,
  attempts = 2,
): Promise<DropUploadResult> {
  const paths: string[] = [];
  let failed = 0;
  for (let index = 0; index < images.length; index += 1) {
    const name = nameFor(index);
    let stored: string | null = null;
    for (let attempt = 0; attempt < attempts && !stored; attempt += 1) {
      stored = await upload(images[index], name);
    }
    if (stored) paths.push(stored);
    else failed += 1;
  }
  return { paths, failed };
}
