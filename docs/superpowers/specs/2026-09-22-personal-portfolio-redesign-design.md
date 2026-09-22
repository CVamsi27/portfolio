# Personal Portfolio Redesign — Design Spec

**Date:** 2026-09-22  
**Scope:** Public portfolio surface on `buildora.work` only

## Objective

Turn the public site into a professional personal portfolio for Vamsi Krishna Chandaluri. The site should help recruiters, hiring managers, and potential collaborators understand what he builds, where he has shipped it, and how to contact him. The private NOVA//OS tracker surface and its host-specific behavior remain unchanged.

## Product direction

Use a restrained editorial case-study direction called **Selected Work / Index**. The work is the dominant visual subject; the person's name is a compact signature rather than a hero headline. The page should feel like a considered portfolio index, not a branded product landing page or a generic developer template.

## Visual system

- Warm off-white background: `#f4f1ea`
- Deep charcoal ink: `#17191c`
- Muted slate secondary text: `#6f7478`
- Electric blue accent: `#315cff`
- Pale blue rules and highlights: `#dce5ff`
- Soft clay utility detail: `#c97755`
- Display typography: Space Grotesk
- Body typography: Inter
- Utility typography: IBM Plex Mono

Use typography, spacing, and rules to create hierarchy. Remove the current public-surface Buildora dossier treatment: gradients, terminal hero, product-style portal label, and NOVA//OS references do not belong on the portfolio host.

## Information architecture

The homepage remains a single scrollable public portfolio with these sections:

1. **Hero** — compact availability signal, work-focused thesis, and a short current-focus line. Do not lead with an oversized name.
2. **Selected work** — the primary section. Render existing project data as an editorial numbered index with title, outcome-led description, stack, and source/live links. Give the first project slightly more visual emphasis without creating a separate card system.
3. **Experience** — chronological evidence with role, company, dates, details, and technologies.
4. **Capabilities** — grouped engineering strengths instead of a generic list of isolated skill cards.
5. **Contact** — concise invitation with email, social links, and resume download.

Keep the existing public route alias at `/portfolio` working. Update navigation labels and anchors to match the new section names. Preserve the public resume asset and existing external project links unless the existing data is clearly incorrect.

## Brand and metadata updates

- Replace public `Buildora` naming with personal or neutral portfolio language.
- Update title, description, and host-aware metadata for the portfolio brand.
- Update Open Graph and Twitter metadata for a personal portfolio preview.
- Replace the public favicon and apple icon with a compact `VK` monogram asset.
- Update public-facing manifest metadata as needed without changing tracker manifest behavior.
- Keep tracker brand data, NOVA//OS assets, personal-host navigation, auth, and tracker routes intact.

## Interaction and accessibility

- Use subtle reveal/hover motion only where it supports scanning; honor `prefers-reduced-motion`.
- Keep visible keyboard focus states and semantic headings/links.
- Maintain responsive behavior from mobile through wide desktop.
- Preserve external-link safety attributes and resume download behavior.

## Verification

- Run the repository lint command.
- Run the production build command.
- Inspect the public homepage at desktop and mobile widths.
- Verify the public metadata/icon references and that tracker host behavior remains unchanged by the public-only changes.

## Out of scope

- Redesigning NOVA//OS or any private tracker page.
- Changing authentication, storage, or tracker data behavior.
- Rewriting project URLs, resume content, or external profiles without source data.
