/**
 * One-off generator: rasterize src/app/icon.svg into PWA PNG icons.
 * Run with: node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";

const svg = await readFile("src/app/icon.svg");

await mkdir("public/icons", { recursive: true });

const sizes = [192, 512];
for (const size of sizes) {
  // Regular icon (keeps the SVG's rounded corners).
  await sharp(svg, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
  // Maskable icon: full-bleed square with a padded mark so Android's safe
  // zone can crop any shape without clipping the mark.
  const fullBleed = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
       <rect width="64" height="64" fill="#071014"/>
       <path d="M9 25.5C16.5 15 27 10 38.5 11.5C47 12.5 53 17 56 23" fill="none" stroke="#49E7FF" stroke-width="2.25" stroke-linecap="round" opacity=".9"/>
       <path d="M55 38.5C47.5 49 37 54 25.5 52.5C17 51.5 11 47 8 41" fill="none" stroke="#49E7FF" stroke-width="2.25" stroke-linecap="round" opacity=".55"/>
       <path d="M18 44V20L46 44V20" fill="none" stroke="#F7FBFF" stroke-width="4.5" stroke-linejoin="bevel"/>
       <path d="M32 12L34.8 20.2L43 23L34.8 25.8L32 34L29.2 25.8L21 23L29.2 20.2L32 12Z" fill="#C8FF3D"/>
       <circle cx="32" cy="23" r="2.2" fill="#071014"/>
     </svg>`,
  );
  await sharp(fullBleed, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}-maskable.png`);
}

console.log("PWA icons written to public/icons/");
