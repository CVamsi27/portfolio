"use client";

/**
 * Browser-side image compression for drops.
 *
 * Images attached to a drop must stay small: the drop list itself is synced as
 * one JSON row, so raw camera screenshots (2–8 MB) bloat the row past the
 * localStorage / realtime / PostgREST limits and the whole drop silently stops
 * reaching the other devices. Compressing here keeps every payload small
 * whether the image ends up in Storage or (as a fallback) inline.
 */

export const COMPRESSED_IMAGE_MAX_BYTES = 360_000;
export const COMPRESSED_IMAGE_MAX_DIMENSION = 1440;

function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const payload = comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
  return Math.floor((payload.replace(/\s/g, "").length * 3) / 4);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.readAsDataURL(file);
  });
}

type Decoded = {
  draw: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
} | null;

async function decode(file: File): Promise<Decoded> {
  if (typeof document === "undefined") return null;
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        draw: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // Fall through to the <img> decoder.
    }
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("The image could not be read."));
      element.src = objectUrl;
    });
    return {
      draw: image,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      release: () => URL.revokeObjectURL(objectUrl),
    };
  } catch {
    URL.revokeObjectURL(objectUrl);
    return null;
  }
}

/**
 * Compresses a picked file to a JPEG data URL capped by dimension and bytes.
 * Animated GIFs and SVGs are returned untouched (canvas would flatten them).
 */
export async function compressImageFile(
  file: File,
  options: { maxBytes?: number; maxDimension?: number } = {},
): Promise<string> {
  const maxBytes = options.maxBytes ?? COMPRESSED_IMAGE_MAX_BYTES;
  const maxDimension = options.maxDimension ?? COMPRESSED_IMAGE_MAX_DIMENSION;

  const original = await readAsDataUrl(file);
  if (/^image\/(svg\+xml|gif)$/i.test(file.type)) return original;
  if (typeof document === "undefined") return original;

  const decoded = await decode(file);
  if (!decoded || !decoded.width || !decoded.height) {
    if (dataUrlBytes(original) <= maxBytes) return original;
    return original;
  }

  try {
    const longest = Math.max(decoded.width, decoded.height);
    let scale = Math.min(1, maxDimension / longest);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return original;

    let best = original;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const width = Math.max(1, Math.round(decoded.width * scale));
      const height = Math.max(1, Math.round(decoded.height * scale));
      canvas.width = width;
      canvas.height = height;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(decoded.draw, 0, 0, width, height);

      for (const quality of [0.85, 0.72, 0.6, 0.48]) {
        const encoded = canvas.toDataURL("image/jpeg", quality);
        if (dataUrlBytes(encoded) < dataUrlBytes(best)) best = encoded;
        if (dataUrlBytes(encoded) <= maxBytes) return encoded;
      }
      scale *= 0.72;
      if (decoded.width * scale < 240 || decoded.height * scale < 240) break;
    }
    return best;
  } finally {
    decoded.release();
  }
}
