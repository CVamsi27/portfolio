# NOVA career desk

The 5 November visual pass compressed the dashboard but left the role list and editor as separate steps. The next local preview should read like a desk for comparing roles and deciding what to do today. Apply the [Anti-AI-UI design filter](https://github.com/Vanszs/Anti-AI-UI/blob/main/Anti-AI-SLop/SKILL.md) to the approved income workflow.

Color: existing NOVA teal and fog, with a solid deep teal reading surface (`#142e31`), pale ink (`#edf6f3`), muted ink (`#b9d2cf`) and a pale teal action (`#a9e0d0`). Type: existing display and body faces; use tabular figures for real priority and effort. Layout: asymmetric role index and brief on desktop; a single column and the existing editor dialog at narrow widths. Copy: actual company, role, source, fit, unanswered question and next action. Motion: none added.

- [x] Add a read-only role brief that follows the selected index entry and preserves its selection and filters in the URL. Keep the existing explicit editor and `role` deep links.
- [x] Give Today a strong first-action area with actual role evidence; keep the other two actions on quieter rows. Retain effort, reasons and direct role links.
- [x] Check role selection, keyboard focus, no actual-event writes, narrow-screen overflow, dark/light contrast, and production build. Leave deployment separate.

Final local verification: all 475 Playwright cases, TypeScript, lint, production build and whitespace checks passed. Three existing unscheduled-task tests now use a fixed pre-campaign day, so their expected action does not depend on when the suite runs. Visual review at 1280px, 685px and 320px covered both themes; the original browser settings were restored. Local preview: `http://127.0.0.1:4311/roadmap`.
