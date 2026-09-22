# Immersive Motivation Rotation Design

## Goal

Make the Personal Motivation scene feel continuous and image-led: approved visuals stay present through loading and failures, rotate automatically, and fill the viewport behind readable controls. Rename the tracker product display name to NOVA without changing storage keys, routes, or public Buildora behavior.

## Experience

The motivation scene is a full-height canvas below the Personal shell header. One approved visual covers the scene with `object-fit: cover`; the objective, quote, progress, and actions sit in a restrained translucent panel. A small source line remains visible over the image. On mobile, the panel becomes a full-width lower sheet while the image remains the full scene background.

The scene rotates every 10 seconds with a crossfade. The active image remains visible until the next image has loaded. If a remote image fails, the previous image remains visible when available; otherwise the category fallback remains visible. Manual “Refresh transmission” still refreshes the source deck and resets rotation to the first slide. Reduced-motion users receive an immediate swap without crossfade.

## Media contract

Motivation media returns one primary image plus a small, approved `imageOptions` deck. The API may contribute a public Wikimedia image; category and destination fallbacks contribute HTTPS Unsplash references already covered by the same-origin relay allowlist. No goal titles, journal text, or private notes are sent to providers. Each option carries alt text, attribution, and source URL.

## Brand contract

Visible tracker-facing brand copy becomes `NOVA`. The existing `vk:` storage namespace, `vk-tracker-suite` backup discriminator, asset paths, and route behavior remain unchanged. Portfolio content continues to use Buildora/Vamsi identity; only shared tracker brand values and tracker-facing NOVA copy are updated.

## Verification

- Add a regression for image deck rotation and retention through a failed replacement.
- Assert full-scene layout at 320px, 390px, and 430px without horizontal overflow.
- Assert Personal shell, onboarding, footer, manifest, and tracker navbar expose NOVA and no longer expose NOVA//OS.
- Preserve existing media attribution, relay, fallback, fullscreen, reduced-motion, and public-host regression tests.
