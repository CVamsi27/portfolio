# Career Execution Plan — Startup SWE Immediately → CTO Track

**Owner:** Vamsi Krishna Chandaluri  
**Window:** **Monday, 23 November 2026 → 18 February 2027** (Immediate Hiring Sprint) + **4-Horizon CTO Trajectory**  
**Objective:** Land a high-ownership **Senior / Founding SWE seat at a Seed–Series B product startup** immediately (India Remote / Bengaluru / Hyderabad + EU/US Remote in parallel), turn your strongest existing `/repos/*proof*` CLIs into real externally adopted OSS, contribute upstream to AI infrastructure (`/repos/langfuse`), and build toward **retiring as a CTO**.  
**Operating rule:** **Zero new side projects until your startup offer is signed.** One tool used by 30 real developers beats five unvalidated alphas.

---

## 1. Open-Source & `/repos/*proof*` Portfolio Triage

Audit of existing local repositories in `/Users/vamsikrishnachandaluri/repos`:

| Local Repo | GitHub / Name | Verdict | Current Reality | Concrete Next Action | Target |
| --- | --- | --- | --- | --- | --- |
| `/repos/tenantproof` | [`rls-rehearsal`](https://github.com/CVamsi27/rls-rehearsal) | **Tier 1 · Ship & Publish to npm** | `rls-rehearsal@0.3.0` CLI + GitHub Action + Supabase JWT claim support ready, but npm publish deferred (0 external users) | Publish `rls-rehearsal@0.3.0` to npm, add 2-min Supabase + Drizzle drop-in templates, publish HN/Reddit/LinkedIn launch post | 100+ stars · 10+ external repos in CI · 5+ external issues/PRs |
| `/repos/deployproof` | [`deployproof`](https://github.com/CVamsi27/deployproof) | **Tier 1 · Zero-Docker Quick Win** | `v0.1.0-alpha.3` (0 stars, 2 tarball downloads); enrollment window open until 5 Dec 2026; GitHub tarball creates install friction | Publish to npm so devs run `npx deployproof check ./out` in 5s with zero Docker; close Dec 5 trial cohort with 5 external Node/pnpm users | 5 external trial reports · 3 retained CI integrations |
| `/repos/langfuse` | [`CVamsi27/langfuse`](https://github.com/CVamsi27/langfuse) | **Tier 1 · AI-Era Upstream OSS** | Local fork already cloned (`test` branch active Nov 21); TS + Next.js + Postgres + ClickHouse + queues + LLM observability/evals | Land 2–3 focused, well-tested bug-fix or eval/API PRs upstream (plus `drizzle-orm` / `better-auth` / `bullmq` in Months 2–6) | ≥2 merged upstream PRs by 31 Dec · 1–2 PRs/mo post-offer |
| `/repos/retryglass` | [`retryglass`](https://github.com/CVamsi27/retryglass) | **Tier 2 · Interview Proof & Audit Wedge** | `v0.1.0-alpha.2` (0 stars, 2 downloads); BullMQ crash sweep + Vitest export verified on OrbStack; heavier Docker/Redis setup | Record 3-min crash-sweep demo for CTO pitches & interviews; defer npm push and BullMQ v6 until post-offer | Used in ≥10 CTO pitches & technical defenses |
| `/repos/rolloutproof` | [`rolloutproof`](https://github.com/CVamsi27/rolloutproof) | **Park Until Post-Offer** | `v0.1.0-alpha.1` (0 stars, 2 downloads); macOS OrbStack local profile; own docs note overlap with SchemaProof | Freeze code during hiring sprint; reuse expand-and-contract rollback thesis in System Design rounds; revisit as upstream PR only if demand pulls | 0 h/wk during Phase 0–2 |
| `/repos/revokeproof` | [`revokeproof`](https://github.com/CVamsi27/revokeproof) | **Park Until Post-Offer** | `v0.1.0-alpha.1` (0 stars, 2 downloads); Chromium/Playwright helper requiring 6 custom app callbacks | Freeze code during hiring sprint; cite in Auth/JWT/WebSocket interview questions | 0 h/wk during Phase 0–2 |
| `/repos/whetstone` | Edgewise (local) | **Explicitly Parked** | 1,055 passing local tests across Next/Lynx/NestJS/native sign-in; native SDKs & reviewed content block release | Keep strictly parked until Month 6+ on the job so it cannot steal 20+ h/wk from hiring & onboarding | 0 h/wk until Month 6 |
| `/repos/docita` | [Docita](https://buildora.work/work/docita) | **Flagship Product Proof** | Independent multi-tenant healthcare SaaS (React/Vite, NestJS, Postgres RLS, recoverable jobs, HMAC webhooks) | Freeze new features; use as 3-min end-to-end ownership showcase in founder pitches & interviews | Primary ownership proof in every loop |

---

## 2. The 90-Day Hiring Sprint (23 Nov 2026 → 18 Feb 2027)

| Phase | Dates | Focus | Exit Condition |
| --- | --- | --- | --- |
| **Phase 0 · Startup Pipeline, npm Unlock & Upstream OSS** | **23 Nov – 4 Dec 2026** | Direct Founder/CTO outreach to 20+ Seed–Series B startups, publish `rls-rehearsal@0.3.0` + `deployproof` to npm, open first Langfuse PR | ≥25 startup apps, ≥20 Founder/CTO notes, 2 CLIs live on npm, ≥1 Langfuse PR opened, ≥3 screens booked |
| **Phase 1 · Interview Conversion & First External Users** | **5 Dec – 31 Dec 2026** | 5-round timed interview rotation mapped to `study.buildora.work`, 3 recorded demos, Supabase/Drizzle templates, close Deployproof cohort | ≥3 active startup loops or paid engagements, ≥2 merged upstream OSS PRs, first external trial reports logged |
| **Phase 2 · Offer Closing, Launch Post & CTO Foundation** | **1 Jan – 18 Feb 2027** | Negotiate Seed–Series B offer (CTO proximity + equity + comp), publish tenant-isolation article on HN/Reddit/LinkedIn, lock 30/60/90 onboarding | Countersigned Senior/Founding SWE offer + 10+ external CI repos using `rls-rehearsal`/`deployproof` + 30/60/90 plan |

### The Four High-Leverage Changes

1. **Direct-to-Founder/CTO Outreach (≥60% ratio) + Trojan Horse Looms.** Cold ATS forms convert at 1–3%. Pair tailored 1-page CVs (`--focus fullstack|backend|frontend`) with a 4-sentence Founder/CTO message linking `/work/docita` or `/work/rls-rehearsal`. For your top 5 dream startups, sign up for their product, spot 1 real UX/DX/perf paper-cut, and send a 2-min Loom + fix.
2. **Unlock real OSS adoption by removing tarball friction.** Publish `rls-rehearsal@0.3.0` and `deployproof` to npm so external developers can run `npx` in 5 seconds instead of downloading GitHub release tarballs.
3. **Use `/repos/langfuse` as your AI-era bridge.** Landing 2–3 real merged PRs in Langfuse proves production TypeScript + Postgres + LLM observability/eval engineering inside a real high-growth AI codebase.
4. **Enforce the 10-Application Diagnostic Gate.** If reply rate is under 10% across any 15-startup cohort, pause volume and fix your outreach pitch + top 3 resume bullets before sending more.

---

## 3. Daily Cadence (32 Hours / Week)

| Time (IST) | Hours | Block | Output |
| --- | ---: | --- | --- |
| `09:00–11:00` | 2.0 | **Startup Applications & Founder/CTO Outreach** | 3 tailored apps (`--focus fullstack\|backend\|frontend`), ≥60% paired with direct CTO/founder note |
| `11:15–12:45` | 1.5 | **Warm Referrals, Trojan-Horse Looms & Paid Diagnostics** | 2 warm/referral notes + 1 Trojan-Horse product Loom or scoped RLS/BullMQ diagnostic enquiry |
| `13:00–14:00` | 1.0 | **OSS & Proof Leverage (Hard 1h Cap)** | Publish `rls-rehearsal`/`deployproof` to npm, record 3-min demos, or ship `/repos/langfuse` PRs |
| `15:00–16:00` | 1.0 | **5-Round Targeted Interview Drill** | `25m unaided → 10m study.buildora.work → 20m changed case → 5m notes` |
| `16:00–16:30` | 0.5 | **Follow-Ups & Pipeline Logging** | 5-business-day follow-ups, update stages, queue tomorrow's top 3 startups |
| **Saturday `09:00–11:00`** | 2.0 | **Weekly Funnel Audit + 1 Timed Mock** | Conversion metrics + 1 timed mock ([Mock Script](https://study.buildora.work/80-lanes-abroad-full-stack/80.30-mock-interview-script)) |
| **Sunday** | 0.0 | **Off** | Protected rest — zero catch-up |

---

## 4. Phase 0 Day-by-Day Schedule (23 Nov – 4 Dec 2026)

- **Mon 23 Nov (Day 1):** Sync 1-page resumes (`EU`, `Global/India`, `Public`), audit open leads, send 3 tailored apps + 2 warm notes, drill V8 & Event Loop.
- **Tue 24 Nov (Day 2 · Today):** Lock the *"no new side projects"* rule. Build a shortlist of 20 Seed–Series B startups (10 India Remote/BLR/HYD + 10 EU/US Remote), send 5 direct Founder/CTO notes linking `/work/docita` or `/work/rls-rehearsal`, **publish `rls-rehearsal@0.3.0` (`/repos/tenantproof`) to npm**, and drill PostgreSQL RLS & MVCC.
- **Wed 25 Nov (Day 3):** Mid-week gate check (≥9 apps sent), record 3-min `Docita` walkthrough, **publish `deployproof` (`/repos/deployproof`) to npm** (zero-Docker quick win), timed Sliding Window + Two Pointers drill.
- **Thu 26 Nov (Day 4):** Send 3 apps + 2 referral asks, record 3-min `RLS Rehearsal` demo (failing control pass), reproduce 1 clean bug/test issue in `/repos/langfuse`, 40-min Multi-Tenant SaaS design.
- **Fri 27 Nov (Day 5):** Hit Week 1 targets (15 apps / 10 warm / 5 enquiries), **open first upstream PR in `/repos/langfuse`**, record 3-min `Retryglass` demo, rehearse 2 MAQ STAR stories.
- **Sat 28 Nov (Day 6):** 2h cap — Week 1 Funnel Audit + 1 timed mock interview + lock Monday's top gap.
- **Sun 29 Nov:** Off.
- **Mon 30 Nov (Day 7):** 5-day follow-up wave on Nov 23 batch + 3 new apps + React Fiber / TanStack Query machine coding.
- **Tue 1 Dec (Day 8):** 3 backend/full-stack apps (`--focus backend`) + contract/founder follow-ups + Webhooks / Outbox / Idempotency drill.
- **Wed 2 Dec (Day 9):** 3 apps + 2 warm intros + BFS/DFS & Topological Sort in TypeScript + TypeScript Generics.
- **Thu 3 Dec (Day 10):** 3 apps (including Track B EU/Germany) + Payment Gateway system design + JWT/RBAC-ABAC review.
- **Fri 4 Dec (Day 11):** Phase 0 exit review (≥25 apps, ≥20 Founder/CTO notes, 2 CLIs on npm, ≥1 Langfuse PR, ≥3 screens booked) → transition into Phase 1.

---

## 5. Future-Proof Skills Stack (2026–2030+)

| Pillar | Horizon | Durable Moat | Concrete Execution Moves |
| --- | --- | --- | --- |
| **1. Production AI & Eval Engineering** | Start Now → Months 3–12 | AI agents commoditize CRUD; owning eval harnesses, guardrails, structured outputs, hybrid search (`pgvector` + BM25) & token/latency budgets grows in value | Merge PRs in `/repos/langfuse`; volunteer in first 90 days on the job to own 1 AI feature + its automated eval & cost dashboard |
| **2. Systems Reliability, Postgres & Go** | Months 3–12 | Deep correctness under load (`EXPLAIN ANALYZE`, lock queues, outbox/CDC, OpenTelemetry SLOs) + Go alongside TypeScript removes the "only JS dev" ceiling | Own real production DB/queue reliability at work; ship 1 real service or CLI in **Go** (Months 6–12) |
| **3. Cloud Infra, Security & FinOps** | Months 6–24 | CTOs are graded on uptime, compliance (SOC2/HIPAA/GDPR), and gross margins (cloud + LLM cost per tenant) | Own Terraform/IaC, canary/rollback release gates, incident postmortems & per-tenant unit economics |
| **4. Product Judgment & Team Leverage** | Years 2–5+ | Multiplying teams via RFCs/ADRs, scope-cutting, hiring A-players, and customer empathy compounds straight to CTO | Sit in customer calls, cut 70% of non-essential scope, design interview rubrics & partner with Founders/Sales |

---

## 6. Four-Horizon Career Roadmap (Startup SWE → Retiring as CTO)

1. **Horizon 1 · Days 1–60 (Now → Jan 2027) — Senior / Founding SWE at a Seed–Series B Startup:**
   - Join 1 hop from the CTO/Founders doing real production work. Publish `rls-rehearsal` + `deployproof` to npm; merge upstream `langfuse` PRs.
2. **Horizon 2 · Months 3–12 — Most Trusted Senior / Lead Engineer in the Room:**
   - Own 1 critical reliability system + 1 production AI feature with evals/cost tracking; add Go + OpenTelemetry + cloud IaC; grow `rls-rehearsal` (or a work-born CLI) to 100+ stars & 10+ external CI repos; publish 1 battle-tested engineering post/month.
3. **Horizon 3 · Years 2–5 — Staff / Tech Lead → Head of Engineering:**
   - Write company-wide RFCs/ADRs, own incident & release culture, build hiring rubrics, lead 5–15 engineers, join enterprise customer architecture reviews, and speak 2–3×/year.
4. **Horizon 4 · Years 5–10+ → Career Goal — Founding / Scale-Up CTO → Retire as CTO:**
   - **Path A:** Grow Founding/Staff SWE → Head of Eng → VP Eng / CTO as a startup scales Series A → C.
   - **Path B:** Pair with a strong GTM co-founder as Founding CTO (backed by solo SaaS + scale-up leadership track record).

---

## 7. Five-Round Interview Rotation & Direct Study Links

- **Mon (Frontend / TS):** [V8 Execution](https://study.buildora.work/10-frontend/10.1-javascript/01-execution-and-scope/10.1.1.07-v8-execution-and-optimization) · [Event Loop](https://study.buildora.work/10-frontend/10.1-javascript/03-async-concurrency/10.1.3.01-event-loop) · [TypeScript Generics](https://study.buildora.work/10-frontend/10.2-typescript/02-generics-and-inference/10.2.2.01-generics) · [React Fiber](https://study.buildora.work/10-frontend/10.3-react/01-react-internals/10.3.1.02-fiber) · [TanStack Query](https://study.buildora.work/10-frontend/10.3-react/03-advanced-hooks-and-patterns/10.3.3.07-tanstack-query)
- **Tue (Backend / Postgres / Security):** [NestJS Guards](https://study.buildora.work/20-backend/20.2-nestjs/02-request-lifecycle/20.2.2.02-guards) · [Webhooks](https://study.buildora.work/20-backend/20.3-rest-apis/03-payloads-errors-integration/20.3.3.05-webhooks) · [PostgreSQL RLS](https://study.buildora.work/20-backend/20.4-database/01-postgresql-foundations/20.4.1.06-row-level-security) · [MVCC](https://study.buildora.work/20-backend/20.4-database/01-postgresql-foundations/20.4.1.03-mvcc) · [JWT](https://study.buildora.work/20-backend/20.5-security/01-auth/20.5.1.05-jwt) · [RBAC/ABAC](https://study.buildora.work/20-backend/20.5-security/01-auth/20.5.1.09-rbac-abac)
- **Wed (Timed TS DSA):** [Sliding Window](https://study.buildora.work/70-interview-toolkit/70.2-coding-patterns/01-linear-structures/70.2.1.01-sliding-window) · [Two Pointers](https://study.buildora.work/70-interview-toolkit/70.2-coding-patterns/01-linear-structures/70.2.1.02-two-pointers) · [Binary Search](https://study.buildora.work/70-interview-toolkit/70.2-coding-patterns/01-linear-structures/70.2.1.03-binary-search) · [DFS & BFS](https://study.buildora.work/70-interview-toolkit/70.2-coding-patterns/02-graphs-trees-grids/70.2.2.01-dfs-bfs) · [Topological Sort](https://study.buildora.work/70-interview-toolkit/70.2-coding-patterns/02-graphs-trees-grids/70.2.2.04-topological-sort)
- **Thu (System Design):** [How to Approach](https://study.buildora.work/30-architecture/30.2-system-design/01-theory/30.2.1.15-how-to-approach) · [Outbox & CDC](https://study.buildora.work/30-architecture/30.2-system-design/01-theory/30.2.1.18-outbox-and-cdc) · [Idempotency & Retry](https://study.buildora.work/30-architecture/30.3-infra-patterns/02-failure-and-recovery/30.3.2.06-idempotency-retry-deep-dive) · [Multi-Tenant SaaS](https://study.buildora.work/30-architecture/30.3-infra-patterns/04-data-at-scale/30.3.4.04-multi-tenant-saas-architecture) · [Payment Gateway](https://study.buildora.work/30-architecture/30.2-system-design/02-case-studies/30.2.2.06-payment-gateway)
- **Fri (Defense & STAR):** [STAR Method](https://study.buildora.work/00-strategy/00.03-star-method) · [Docita Defense](https://study.buildora.work/80-lanes-abroad-full-stack/80.36-docita-complete-interview-defense) · [MAQ Product Engineering](https://study.buildora.work/projects/maq/01-product-engineering) · [Salary Negotiation](https://study.buildora.work/80-lanes-abroad-full-stack/80.31-salary-negotiation-guide)

---

## 8. Commands

```sh
# Regenerate resumes (with optional --focus fullstack|backend|frontend)
cd ../resume-generator
./venv/bin/python generate_resume_germany.py --focus fullstack
./venv/bin/python generate_resume_generic.py --focus fullstack
./venv/bin/python generate_resume_public.py
./venv/bin/python verify_resume_pdf.py Vamsi_Resume_EU.pdf --pages 1
./venv/bin/python verify_resume_pdf.py Vamsi_Resume.pdf --pages 1
./venv/bin/python check_ats.py Vamsi_Resume.pdf

# Portfolio & personal.buildora.work verification
cd ../portfolio
pnpm lint && pnpm test:career-workflow && pnpm build
```
