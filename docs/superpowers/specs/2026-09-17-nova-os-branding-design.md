# NOVA//OS Tracker Branding Design

**Date:** 2026-09-17  
**Status:** Approved direction, pending implementation review  
**Scope:** Tracker/product surfaces only

## Intent

Turn the tracker suite from a personal-portfolio utility into a recognizable product: an energetic, premium command center for making progress. The identity should feel authored, cinematic, and anime-inspired without becoming noisy or difficult to use.

## Brand core

- **Name:** NOVA//OS
- **Tagline:** Your next chapter, in motion.
- **Positioning:** A personal operating system for goals, habits, focus, and shared momentum.
- **Voice:** Decisive, warm, concise, and slightly dramatic. Use progress language (“next chapter”, “mission”, “signal”, “momentum”) sparingly and purposefully.
- **Brand boundary:** Portfolio routes remain Vamsi Krishna-branded. Tracker routes, tracker PWA metadata, install prompts, and tracker-specific shell copy use NOVA//OS.

## Visual identity

### Mark

The primary mark is an angular **N** built from two orbital rails around a four-point nova star. The mark must work as:

- a compact icon at favicon and mobile sizes;
- a horizontal wordmark in the desktop navigation;
- a monochrome fallback for browser UI, print, and reduced-color contexts.

Do not use the existing VK initials on tracker surfaces.

### Color roles

- **Archive black:** primary canvas and high-contrast shell background.
- **Signal cyan:** links, active navigation, focus states, and system highlights.
- **Acid lime:** progress, success, streaks, and “ready” states.
- **Anime red:** urgent actions, destructive states, and key emphasis.
- **Ultraviolet:** secondary glow, depth, and selected decorative accents.
- **Paper white / mist gray:** readable foreground text and muted metadata.

Colors are role-based. Decorative gradients and glows must never reduce text contrast or make action hierarchy ambiguous.

### Typography

- **Display:** expressive condensed/editorial type for product name, chapter titles, and hero statements.
- **Body:** clean modern sans-serif for controls, descriptions, and long-form copy.
- **Utility:** monospace system labels for timestamps, counters, sync state, and technical metadata.

Typography should create a clear three-level rhythm: dramatic headline, calm explanation, precise system detail. Avoid all-caps body paragraphs and excessive letter spacing.

## Surface changes

The implementation will update the tracker product consistently across:

- navigation logo, wordmark, and accessible brand label;
- document title, description, Open Graph metadata, theme color, and manifest name;
- favicon, PWA icons, and install prompt language;
- tracker shell labels, onboarding/questionnaire copy, auth empty states, and focus-mode copy;
- tracker footer, including the NOVA//OS tagline and product-appropriate utility links;
- service-worker cache identity and product-facing documentation;
- README and changelog references where they describe the tracker product.

The portfolio landing page and its personal identity must remain intact. Internal storage keys, backup identifiers, and database compatibility names must remain stable so existing users do not lose local data or exports during the rebrand.

## Footer direction

Tracker footer copy:

> NOVA//OS · Your next chapter, in motion.

It should feel like a product signature rather than a generic copyright strip. Keep the copyright/legal detail available but subordinate, and preserve keyboard-visible navigation for any links.

## UX requirements

- Brand is legible at mobile widths and does not compete with the primary tracker action.
- Logo-only states include an accessible name and tooltip where the context is otherwise ambiguous.
- Metadata and install surfaces consistently identify NOVA//OS.
- Host-aware branding prevents NOVA//OS from leaking into portfolio surfaces.
- Reduced-motion mode keeps the mark, glows, and transitions fully usable without animation.
- Existing local data, share links, backup imports, and deep links continue to work.

## Verification gates

1. Tracker routes visibly use NOVA//OS; no tracker shell still displays `~VK` or “Personal Suite”.
2. Portfolio routes retain Vamsi Krishna identity and do not regress their metadata or footer.
3. `/manifest.webmanifest`, favicon, and install prompt expose the new product identity.
4. Responsive and reduced-motion checks pass for the navigation, footer, and focus scene.
5. Existing tracker E2E coverage remains green, with branding assertions added for tracker and portfolio boundaries.
6. Lint and production build pass.

