# Personal workspace refinement

Goal: reduce visual friction across the existing approved personal tracking workflows.

Architecture: refine shared components rather than introduce a second design system. Preserve routes, account isolation, stored records and reminder semantics. Public portfolio remains separate.

Design: warm neutral canvas, white surfaces, teal actions, restrained borders; sentence-case sans-serif headings; compact title-first headers; list-like destination links; anchored mobile navigation. Clock remains accessible on every page but no longer leads the page. Remove the redundant personal marketing footer and repeated Today link.

- [x] Refine ChapterHeader and PersonalShell hierarchy, preserve accessible clocks and navigation.
- [x] Turn SectionLinks into compact destination rows with explicit arrows and consistent focus states.
- [x] Unify personal surface spacing, typography, disclosure and control styles; preserve public styles.
- [x] Verify populated and empty screens on mobile and desktop, light and dark. Run TypeScript, lint, production build and browser regression suite.
- [x] Record evidence, commit only task changes and push the current branch. Preserve the unrelated resume PDF edit.
