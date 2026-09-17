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
  // Maskable icon: full-bleed square with a padded monogram so Android's
  // safe zone can crop any shape without clipping the mark.
  const fullBleed = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
       <defs>
         <linearGradient id="vk-g" x1="0" y1="0" x2="1" y2="1">
           <stop offset="0" stop-color="#7c3aed"/>
           <stop offset="1" stop-color="#d946ef"/>
         </linearGradient>
       </defs>
       <rect width="64" height="64" fill="url(#vk-g)"/>
       <text x="32" y="42" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="22" font-weight="800" letter-spacing="0.5" fill="#ffffff" text-anchor="middle">VK</text>
     </svg>`,
  );
  await sharp(fullBleed, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}-maskable.png`);
}

console.log("PWA icons written to public/icons/");
