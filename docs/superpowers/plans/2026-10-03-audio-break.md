# Audio Break Implementation Plan

> **For agentic workers:** Use executing-plans to implement this plan inline, task by task.

**Goal:** Replace misleading embedded playback with useful YouTube Music links and an optional reliable break timer.

**Architecture:** Shared accessible Modal owns interaction isolation. A small study-audio helper owns the curated destinations; the lounge owns only local timer state. The shield permits the exact YouTube Music hostname even for older saved blocklists.

**Tech Stack:** Next.js, React, TypeScript, Playwright, existing synced storage and dialog primitives.

## Global Constraints

Preserve all tracker data and active focus sessions. External links use HTTPS, native anchors, new tabs and noopener noreferrer. Never imply external playback is controlled. Preserve existing component props and callers. No cloud writes.

## Task 1: External podcast chooser

Files: create src/lib/study-audio.ts; replace src/components/study/StudyBreakLoungeModal.tsx; create e2e/audio-break.spec.ts.

- [x] Add a browser regression that opens Audio break on Roadmap, expects the Listen on YouTube Music dialog, and asserts every podcast link uses music.youtube.com/search with an encoded title and no iframe.
- [x] Run `pnpm exec playwright test e2e/audio-break.spec.ts --workers=1` against the existing build; expect the missing dialog assertion to fail.
- [x] Export `STUDY_PODCASTS` with Syntax, Software Engineering Daily, and The Changelog. Build destinations with `new URL('https://music.youtube.com/search')` and `url.searchParams.set('q', title + ' podcast')`. Render name, topic, and Find podcast on YouTube Music anchor inside the shared Modal.
- [x] Add timestamp-based timer: state `{remainingMs: number, deadline: number | null}`; start sets deadline to Date.now()+remainingMs; pause snapshots max(0,deadline-Date.now()); resume starts again; reset returns selected minutes; render remaining with Math.ceil. Refresh on an interval and visibility changes, including while the chooser is closed. Never mutate focus storage.
- [x] Verify Escape restores trigger focus, no inert elements remain, no mobile overflow, timer pause/reset and background elapsed time work.

## Task 2: Shield policy and entry labels

Files: modify src/lib/distraction-shield.ts; existing RoadmapTodayCard and roadmap entry points; e2e/audio-break.spec.ts.

- [x] Test a saved shield state blocking youtube.com: a native podcast click opens the requested Music URL without a shield dialog, while youtube.com remains blocked.
- [x] In shouldInterceptUrl return false only when parsed hostname is exactly music.youtube.com; retain existing behavior for other domains.
- [x] Rename visible lounge entry points to Audio break and remove promises of a top-ten player or locked screen.
- [x] Rebuild and rerun audio regressions plus existing click/focus/navigation tests.

## Release gate

- [x] Finish full browser suite and record count: 194 passed, one test assertion corrected, 3/3 targeted rerun passed. Lint, TypeScript and production build passed.
- [x] Review mobile/light/dark screenshots and diff. Do not claim authenticated production verification from local tests.


Consolidated scope: [NOVA change sheet](../../NOVA_CHANGE_SHEET.md). The sheet resolves navigation/scope differences and adds the requested food tracker; this document remains the historical design or delivered phase record.
