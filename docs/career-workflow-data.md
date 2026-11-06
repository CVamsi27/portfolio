# Career workflow data and release

The income workflow stores three account-scoped record collections in existing `tracker_data` rows:

| Key | Contents |
| --- | --- |
| `career:research` | Reviewed vacancy facts, sources, eligibility evidence and suggested drafts |
| `career:opportunities` | User-owned stages, draft edits, follow-ups and contract terms |
| `career:activities` | Actual dated applications, conversations, proposals, agreements and payments |

Research imports update facts only. They do not mark applications as submitted or replace user-owned activity history. Backup/restore covers all three collections and validates every record before taking a pre-import snapshot or writing any key.

Accepted corrections receive a strictly newer merge timestamp; `sourceUpdatedAt` retains source freshness separately. Historical events cannot restart an automatic follow-up after a later recorded reply. Interviews become Today actions on their scheduled date in Asia/Kolkata, rather than their booking date. The November checkpoint considers only outreach at least five weekdays old and conversations belonging to that cohort.

## Private research exporter

Author a curated version-one snapshot in the canonical private personal repository, using the serializable types and validation in `src/lib/career-workflow.ts`. Export it with:

```sh
node --experimental-strip-types scripts/export-career-research.ts \
  --input=/absolute/private/path/curated-research.json \
  --output=/absolute/private/path/new-review-snapshot.json \
  --liveness=/absolute/private/path/careerops-liveness.json
```

The optional liveness file uses `asOfClientDate` and `results: [{url,status}]`. Exact matching selected URLs update availability and its check date; they cannot establish location eligibility or add unselected roles. Conflicting checks are rejected. Input and output must resolve inside the canonical private personal repository. Exports use a new file with mode `0600`; an existing output is never overwritten. Personal data is not imported by the Next.js bundle.

Exporter tests create the canonical private directory if absent and use removable synthetic fixtures within it, so a clean CI machine needs no personal repository checkout. The production path checks and fresh-file requirement remain active during those CLI tests.

## Signed-in release boundary

Local mode works without Supabase. Configured signed-in writes remain disabled until `NEXT_PUBLIC_CAREER_WORKFLOW_ENABLED=true` is built into a migrated and verified release.

Migration `0016_career_workflow_records.sql` retains the prior record-merge implementation as an owner-checked delegate, preserving existing nutrition, routine and planner validation. The wrapper adds full-record validation for the three career collections and retains timestamp/tombstone merging and row-level security. Migration `0015_telegram_delivery_state.sql` already exists and keeps its original number.

Verify against a test project before enabling the flag. The existing `scripts/verify-cloud-sync.mjs` now includes the three career collections, anonymous/cross-owner denials and unsafe research URL rejection. Its explicit production-verification guard remains unchanged. This implementation does not apply a cloud migration, create probe users, deploy or import live account data.

## Reproducible local database check

With the complete PostgreSQL server binaries (including `postgres`, not only the `libpq` client tools) on `PATH`:

```sh
CAREER_SQL_TESTS=1 node --experimental-strip-types --test scripts/career-persistence-sql.test.ts
```

The test creates a temporary isolated PostgreSQL cluster, applies the actual prior and new migrations, checks repeat application, validates ownership and merge behavior, then stops and deletes the cluster. It does not read application credentials or connect to an existing database.

## Income-first plan authoring

Use `pnpm career:income:generate --input=PRIVATE_FORWARD_PLAN --output=FRESH_PRIVATE_PATH` to generate a reviewed v4 payload. The source must be a validated forward plan, and output must be inside the canonical private personal repository. The generator retains the horizon and all pre-5-November assignments and creates new IDs for the income-first revision. Live owner application remains the separate existing owner-release workflow with its backup, compare-and-swap and readback checks.

Run `pnpm test:career-workflow` for domain, schedule and private-export checks. Run `pnpm test:career-sql` with `CAREER_SQL_TESTS=1` for the isolated database test. Browser cases cover reviewed imports, actual versus draft states, follow-up clearing, contract payments, keyboard behavior, 320px layout, schedule history and the cross-screen workflow.

## Local verification — 5 November 2026

- Production build, TypeScript, ESLint and `git diff --check`: passed.
- Unit and compatibility scripts: 192 passed (sync 22, curriculum 26, prior-plan compatibility 87, income workflow 33, access 24).
- Isolated PostgreSQL: 5 passed, including ownership, complete validation, timestamp/tombstone merges, repeated migration and existing collection behavior.
- Full Playwright suite: 466 passed. Final mobile CSS refinements: all 23 focused career/import/schedule/resource cases passed.
- Local preview: seven reviewed opportunities imported; drafts remain unsent and no application, agreement or payment activity was created.
- Private research and income-first schedule payloads prepared; original plan and live owner data preserved.

Cloud migration, real-project sync verification, owner-data application and production deployment remain separate and unperformed. The write flag stays disabled for configured accounts until those release checks pass.

## Queue and research-check refinement

The queue includes counted All, Ready to apply, Follow-ups, Contracts and Needs recheck views. The `queue` URL parameter preserves the selected view beside search and location context; choosing a view clears contradictory stage, kind and due filters. Advanced filters remain available under their disclosure.

Record research check updates availability, eligibility, evidence and the source check date. It rejects future dates and preserves the original vacancy identity, application stage, edited draft and follow-up. If the stage was only derived from research, it is retained as a low-priority record that cannot supersede an actual user edit from another device. Configured accounts must finish the initial opportunity sync before creating that missing record. Mark ready to apply is a separate explicit preparation action requiring current, active and eligible research; it creates no actual application event. Future-dated imported checks also need review.

Refinement verification on 5 November: 199 unit/compatibility checks (40 income workflow, 22 sync, 26 curriculum, 87 previous-plan compatibility, 24 access), 5 isolated PostgreSQL checks and all 471 Playwright cases passed. Production build, TypeScript, ESLint and whitespace checks passed. Manual review covered the 320px queue, desktop list, clarification state and cancelling an employer check without changing real research. The local preview remains at `http://127.0.0.1:4311/roadmap?queue=ready`; visual evidence is in ignored `artifacts/ui-ux/career-workflow-2026-11-05/career-queue-refined.jpg`. No cloud or live-account release step was performed.

The subsequent visual correction changes presentation only: a compact role list, ordered Today actions with exact role captions, simpler source/fact presentation and shared review ledgers. No schema, merge, import or write-gate contract changed. Its verification passed 473 full browser cases, 24 targeted cases after the final mobile/caption adjustment, the 40 career domain cases, TypeScript, lint and production build. See the current-run screenshots and findings in [the UI review](ui-ux-review.md#career-visual-correction-after-owner-feedback--5-november-2026).

The 6 November career desk adds the read-only `brief` query parameter. It selects a visible opportunity for comparison without writing a record. The existing `role` parameter still opens the full editor. Both preserve the queue's filters, and narrow screens retain the direct editor action. Today uses the existing first action and its saved role evidence. See [Career desk](ui-ux-review.md#career-desk--6-november-2026).
