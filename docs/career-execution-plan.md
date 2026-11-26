# Career Execution Plan — Startup SWE Immediately → CTO Track

**Owner:** Vamsi Krishna Chandaluri  
**Window:** **Monday, 23 November 2026 → 18 February 2027** (Immediate Hiring Sprint) + **4-Horizon CTO Trajectory**  
**Objective:** Land a high-ownership **Senior / Founding SWE seat at a Seed–Series B product startup** immediately (India Remote / Bengaluru / Hyderabad + EU/US Remote in parallel), turn your strongest existing `/repos/*proof*` CLIs into real externally adopted OSS, contribute upstream to AI/SaaS infrastructure (`langfuse`, `twenty`, `cal.com`), ship future-proof AI/systems wedges on clear gates, and build toward **retiring as a CTO**.  
**Operating rule:** **Zero new side projects until your startup offer is signed.** One tool used by 30 real developers and merged upstream PRs in active startups beat five unvalidated alphas.

---

## 1. The 3-Lane Startup Hiring Funnel & CTO-Track Offer Scorecard

| Lane | Effort Share | Targets | Execution Strategy | Why |
| --- | ---: | --- | --- | --- |
| **Lane 1 · India Product Startups & Global Remote YC / OSS Teams** | **60%** | Bengaluru/Hyderabad/Remote Seed–Series B startups (Peak XV, Accel, Lightspeed, YC) + global remote OSS teams (`Cal.com`, `Supabase`, `PostHog`, `Dub`, `Formbricks`, `Documenso`, `Trigger.dev`, `Twenty`) | Tailor 1-page CV (`--focus fullstack\|backend\|frontend`), pair with direct CTO/HM outreach, target 2–3 week interview loops | Fastest path to immediate India-compatible payroll/EOR + real production scale |
| **Lane 2 · Founding / Early Engineer (#3–#15) Direct Founder Outreach** | **25%** | Recent Seed/Series A founders on YC Work at a Startup, Wellfound & X hiring their first 2–5 senior TS/Postgres engineers | 4-sentence proof pitch linking `/work/docita` or `/work/rls-rehearsal`; for top 5 dream startups, spot 1 real UX/API/DX paper-cut and attach a 2-min **Trojan-Horse Loom + fix** | Bypasses ATS black holes (5–10× reply rate) and puts you 1 hop from the CTO |
| **Lane 3 · High-Fit EU / Germany / NL / IE Relocation Track** | **15%** | Berlin/Munich/Amsterdam/Dublin product startups where stack + OSS PRs overcome visa friction (`Langfuse`, `n8n`, `Twenty`, `Cello`, `Packmatic`) | Anchor outreach on merged upstream PRs; confirm India-remote or supported relocation eligibility early (aligned with dual-career TS + Pega family fit) | Protects long-term family relocation upside without stalling near-term cash |

### CTO-Track Offer Scorecard (Score 1–5 on Every Offer)
1. **Founder / CTO Proximity:** Do you work directly with the CTO/VP Eng and see architecture, hiring, and customer trade-offs up close?
2. **Real Production Complexity:** Paying customers, multi-tenant data, async/AI workloads, and real incidents to own end-to-end.
3. **End-to-End Scope:** Product + API + database + infra ownership (avoid isolated ticket-factory maintenance).
4. **Family & Financial Stability:** Reliable immediate cash + equity upside (global remote or clean EU/NL/DE route).

---

## 2. Open-Source & `/repos/*proof*` Portfolio Triage

| Local Repo | Project | Verdict | Current Reality | Concrete Next Action | Target |
| --- | --- | --- | --- | --- | --- |
| `/repos/tenantproof` | [`rls-rehearsal`](https://github.com/CVamsi27/rls-rehearsal) | **Tier 1 · Ship & Publish to npm** | `rls-rehearsal@0.3.0` CLI + GitHub Action + Supabase JWT claim support ready, npm publish deferred | Publish to npm, add 2-min Supabase + Drizzle drop-in template, launch on Show HN / `r/Supabase` / `r/PostgreSQL` | 100+ stars · 10+ external repos in CI · 5+ external issues/PRs |
| `/repos/deployproof` | [`deployproof`](https://github.com/CVamsi27/deployproof) | **Tier 1 · Zero-Docker Quick Win** | `v0.1.0-alpha.3` (0 stars, 2 downloads); enrollment open through **5 Dec 2026** | Publish to npm (`npx deployproof check ./out` in 5s, zero Docker), close Dec 5 trial cohort with 5 external repos | 5 external trial reports · 3 retained CI integrations |
| `/repos/langfuse` | [`CVamsi27/langfuse`](https://github.com/CVamsi27/langfuse) | **Tier 1 · AI-Era Upstream OSS** | Fork cloned locally (`test` branch active Nov 21); TS + Next.js + Postgres + ClickHouse + BullMQ + LLM Evals | Land 2–3 focused bug-fix or eval/API PRs upstream | ≥2 merged upstream PRs by 31 Dec · 1–2 PRs/mo post-offer |
| `/repos/retryglass` | [`retryglass`](https://github.com/CVamsi27/retryglass) | **Tier 2 · Interview Proof & Audit Wedge** | `v0.1.0-alpha.2` (0 stars, 2 downloads); BullMQ crash sweep + Vitest export works on OrbStack | Record 3-min demo for CTO pitches & interviews; defer npm push & BullMQ v6 until post-offer | Used in ≥10 CTO pitches & technical defenses |
| `/repos/rolloutproof` | [`rolloutproof`](https://github.com/CVamsi27/rolloutproof) | **Park Until Post-Offer** | `v0.1.0-alpha.1`; OrbStack-only profile; SchemaProof overlap | Freeze code during hiring sprint; use expand-and-contract insight in System Design rounds | 0 h/wk during Phase 0–2 |
| `/repos/revokeproof` | [`revokeproof`](https://github.com/CVamsi27/revokeproof) | **Park Until Post-Offer** | `v0.1.0-alpha.1`; Chromium/Playwright helper requiring 6 callbacks | Freeze code during hiring sprint; cite in Auth/JWT/WebSocket interview questions | 0 h/wk during Phase 0–2 |
| `/repos/whetstone` | Edgewise (local) | **Explicitly Parked** | 1,055 passing local tests; native SDKs & reviewed content block release | Keep strictly parked until Month 6+ on the job | 0 h/wk until Month 6 |
| `/repos/docita` | [Docita](https://buildora.work/work/docita) | **Flagship Product Proof** | Multi-tenant healthcare SaaS (React/Vite, NestJS, Postgres RLS, recoverable jobs, HMAC webhooks) | Freeze new features; showcase via 3-min end-to-end architecture walkthrough | Primary ownership proof in every loop |

---

## 3. Startup-Hiring Upstream OSS Targets + 14-Day PR → Interview Playbook

Pick **1 Primary + 1 Secondary** active venture-backed OSS startup repo matching your TS/React/NestJS/Postgres stack:

| Tier | Repo | Stack & Geo | Why It Fits | Exact PRs to Target |
| --- | --- | --- | --- | --- |
| **Tier A · Start Now** | [`langfuse/langfuse`](https://github.com/langfuse/langfuse) | TS, Next.js, Postgres, ClickHouse, BullMQ, LLM Evals · **Berlin / Remote (YC)** | Fixes your #1 future-proofing gap overnight; already cloned in `/repos/langfuse` | BullMQ ingestion/retry edge cases, eval dataset/score bugs, tRPC schema fixes, Postgres/ClickHouse query perf |
| **Tier A · Start Now** | [`twentyhq/twenty`](https://github.com/twentyhq/twenty) | **React, TS, NestJS, PostgreSQL** · **Paris / EU Remote (YC)** | 1:1 stack twin of Docita; actively recruits from GitHub contributors | Multi-workspace permission/isolation bugs, NestJS worker reliability, Postgres N+1 query fixes, React table/form bugs |
| **Tier B · Domain Twin** | [`calcom/cal.com`](https://github.com/calcom/cal.com) | TS, Next.js, Prisma, Postgres · **Global Remote (hires in India)** | Exact Docita scheduling/timezone/webhook twin | Timezone/DST fixes, webhook retry/idempotency bugs, Prisma query tuning |
| **Tier B · Domain Twin** | [`n8n-io/n8n`](https://github.com/n8n-io/n8n) | TS, Node.js, AI Agents, Workflows · **Berlin / EU Remote** | Highest historical fit (4.7/5) | Webhook error/retry edge cases, queue stability, AI tool-node reliability |
| **Tier B · Domain Twin** | [`supabase/supabase`](https://github.com/supabase/supabase) | TS, Postgres, RLS, `pgvector` · **Global Remote** | Exact `rls-rehearsal` + `pgvector` AI stack twin | Studio RLS policy editor edge cases, CLI migration fixes, `rls-rehearsal` showcase |
| **Tier C · AI & Workflows** | [`mastra-ai/mastra`](https://github.com/mastra-ai/mastra) · [`triggerdotdev/trigger.dev`](https://github.com/triggerdotdev/trigger.dev) | TS AI agents/RAG/evals & durable background jobs | Agent memory/RAG without leaving TS + 1:1 `Retryglass` twin | Memory/RAG adapter tests, retry/timeout edge-case PRs |

### 14-Day PR → Startup Interview Playbook
1. **Days 1–3 · PR #1 Trust Builder:** Pick a confirmed bug with a clean repro (never typos), ship a minimal fix **+ a test that fails before and passes after**.
2. **Days 4–10 · PR #2 Architecture Signal:** Target a deeper Postgres, worker retry, isolation, or eval issue; post a crisp 5-line design note before coding.
3. **Day 11 · Direct CTO / Lead DM:** Message the engineering lead/CTO who reviewed your PRs referencing PR #1/#2 + `rls-rehearsal` + India-remote/relocation availability for a 15-min chat.

---

## 4. Future-Proof Wedge Project Queue (Strict Activation Gates)

| Project | 1-Command UX | Activation Gate | What It Does & CTO Leverage |
| --- | --- | --- | --- |
| **`evalproof`** | `npx evalproof run` | **ONLY after npm publish + Week 1–3 hiring targets hit (or post-offer)** | Local-first CI regression gate for TS AI features: asserts Zod schemas, ordered tool calls, p95 latency & `$/1k` token cost budgets vs. `main`. |
| **`webhookproof`** | `npx webhookproof run http://localhost:3000/api/webhooks/stripe --provider stripe` | **Post-offer · Months 3–6** | Zero-Docker CLI firing HMAC payloads across 6 adversarial scenarios (parallel race, reversed order, replay, tampered sig, slow retry). |
| **`pglockguard` (Go)** | `pglockguard check ./prisma/migrations` | **Post-offer · Months 6–12 (Go milestone)** | Static SQL migration lock linter written in **Go** (zero Docker) flagging `ACCESS EXCLUSIVE` lock hazards + suggesting safe expand-and-contract SQL. |
| **`TenantGuard Cloud`** | Paid CI compliance layer on `rls-rehearsal` ($99–$299/mo) | **Horizon 2/3 — ONLY after 20+ external CI repos adopt `rls-rehearsal`** | Signed SOC2/HIPAA tenant-isolation release reports, cross-branch policy drift detection & Slack alerts. |

---

## 5. Daily Cadence (32 Hours / Week) & Telegram Reminders

| Time (IST) | Hours | Block | Telegram Alert |
| --- | ---: | --- | --- |
| `07:00` (configurable `06:00–08:30`) | — | **Daily Morning Brief** (`career-digest`) | Focus, deliverable, schedule & `/hub` + `/roadmap?view=interview` links |
| `09:00–11:00` | 2.0 | **Startup Apps & Founder/CTO Outreach** (`career-project`) | 3 tailored apps across 3-Lane Funnel, ≥60% with direct Founder/CTO notes |
| `11:15–12:45` | 1.5 | **Warm Referrals, Trojan-Horse Looms & Diagnostics** (`career-project`) | 2 warm/referral intros + 1 Trojan-Horse product Loom or RLS/BullMQ enquiry |
| `13:00–14:00` | 1.0 | **OSS & Proof Leverage (Hard 1h Cap)** (`career-project`) | npm publish (`rls-rehearsal`/`deployproof`), `langfuse`/`twenty` PRs, 3-min demos |
| `15:00–16:00` | 1.0 | **5-Round Startup Interview Drill** (`career-study`) | Weekday round + `25m unaided → 10m reference → 20m changed case → 5m notes` |
| `16:00–16:30` | 0.5 | **Follow-Ups, Pipeline Log & Queue Top 3** (`career-study`) | 5-day follow-ups, update Resume Checkpoints & queue tomorrow's top 3 |
| **Saturday `09:00–11:00`** | 2.0 | **Weekly Funnel Audit + 1 Timed Mock** (`career-study`) | ≥10% reply-rate diagnostic + 1 timed mock interview |
| **Sunday** | 0.0 | **Off** | Silent — protected rest |

**Activate daily Telegram alerts:** Deploy `portfolio`, sign into `personal.buildora.work/settings#telegram-delivery`, toggle **Career Telegram reminders** on (which immediately saves `planMode: "hiring-sprint"` to cloud sync; previously opted-in users can click **Switch alerts to active Startup & CTO Sprint**), and select **Daily digest + all sprint blocks** with your preferred digest time (`07:00 IST` default).

---

## 6. Phase 0 Day-by-Day Schedule (23 Nov – 4 Dec 2026)

- **Mon 23 Nov (Day 1):** Sync 1-page resumes (`EU`, `Global/India`, `Public`), audit open leads, send 3 tailored apps + 2 warm notes, drill V8 & Event Loop.
- **Tue 24 Nov (Day 2):** Lock *"no new side projects"* rule, shortlist 20 Seed–Series B startups, send 5 Founder/CTO pitches linking `/work/docita` or `/work/rls-rehearsal`, drill PostgreSQL RLS & MVCC.
- **Wed 25 Nov (Day 3):** Mid-week gate check (≥9 apps), record 3-min `Docita` walkthrough, timed Sliding Window + Two Pointers drill.
- **Thu 26 Nov (Day 4 · Today):** Publish `rls-rehearsal 0.3.0` + `deployproof` to npm, send 3 Lane 1/2 startup apps + 2 founder DMs, reproduce PR #1 issue in `/repos/langfuse`, Multi-Tenant SaaS System Design drill.
- **Fri 27 Nov (Day 5):** Open PR #1 in `/repos/langfuse`, claim PR #1 bug issue in `twentyhq/twenty`, send 2 Trojan-Horse product Looms + hit Week 1 scoreboard (15 apps / 10 warm), record 3-min `Retryglass` demo + MAQ STAR stories.
- **Sat 28 Nov (Day 6):** 2h cap — Week 1 Funnel Audit (≥10% reply-rate gate) + 1 timed mock interview + lock Monday's top gap.
- **Sun 29 Nov:** Off.
- **Mon 30 Nov (Day 7):** 5-day follow-up wave on Nov 23 batch + 3 Lane 1/2 apps + post PR #2 design note (`langfuse`/`twenty`) + React Fiber / TanStack Query drill.
- **Tue 1 Dec (Day 8):** 3 backend/full-stack apps (`--focus backend`) + follow up on founder/diagnostic pitches + advance PR #2 tests + Webhooks / Outbox / Idempotency drill.
- **Wed 2 Dec (Day 9):** 3 apps + 2 warm intros + open PR #2 + light DSA maintenance (455+ LeetCode banked) & practical TS feature coding.
- **Thu 3 Dec (Day 10):** 3 Lane 3 EU/NL/DE apps + Day-11 maintainer/CTO DM + draft Show HN / `r/Supabase` post for `rls-rehearsal` + Payment Gateway & Auth (JWT vs revocation) drill.
- **Fri 4 Dec (Day 11):** Phase 0 Checkpoint (≥25 apps, ≥20 Founder/CTO notes, 2 CLIs on npm, ≥1–2 `langfuse`/`twenty` PRs, ≥3 screens) → transition into Phase 1.

---

## 7. Current (Nov 2026) vs. 12-Month Target (Nov 2027) Resume Checkpoint

Keep both PDFs separate: send `Vamsi_Resume.pdf` / `Vamsi_Resume_EU.pdf` today; use `Vamsi_Resume_Future_Checkpoint.pdf` strictly as a 12-month progress target (tracked interactively on `personal.buildora.work/roadmap?view=interview`).

| # | Area | Horizon | Today (Nov 2026) | Target (Nov 2027 Checkpoint) | Verify By |
| --- | --- | --- | --- | --- | --- |
| 1 | **Core Role & Prod Traffic** | Horizon 1 | Docita + MAQ Senior SWE | Senior / Founding SWE at Seed–Series B startup | Signed offer + 2+ shipped prod systems |
| 2 | **OSS Tool Adoption** | Horizon 1–2 | `rls-rehearsal` & `deployproof` at 0 stars / tarballs | Published on npm (`npx`) with 100+ stars & 10+ external CI repos | npm installs + external CI refs & issues |
| 3 | **Upstream Startup PRs** | Horizon 1–2 | `/repos/langfuse` cloned; 0 external PRs | 2–4+ merged PRs across `langfuse`, `twenty`, `cal.com`, or `supabase` | Public merged PR URLs |
| 4 | **Production AI & Evals** | Horizon 2 | No production AI/LLM eval proof on CV | Shipped AI workflow + automated eval/cost gate (`evalproof` or work) | Measured eval pass-rate & cost guardrails |
| 5 | **Systems Breadth (Go)** | Horizon 2 | TS / Node / NestJS / Postgres only | 1 shipped production Go service or CLI (`pglockguard`) | Public Go release or prod service |
| 6 | **Prod Postgres & OTel** | Horizon 2 | Synthetic local checks & qualitative MAQ work | Measured `EXPLAIN ANALYZE` wins, lock-safe migrations & OTel SLOs | Real before/after prod latency & SLO records |
| 7 | **Cloud, Security & FinOps** | Horizon 2–3 | Docker, GH Actions, Fly.io & Cloudflare basics | Owned Terraform/IaC, canary/rollback gates & per-tenant unit economics | IaC/release runbooks & margin savings |
| 8 | **Staff / CTO Leverage** | Horizon 2–3 | Code reviews & mentoring at MAQ | Authored RFCs/ADRs, led hiring loops, 6+ deep posts & 1+ tech talk | Published articles + interview loop ownership |

---

## 8. Commands

```sh
# Regenerate all current resumes + future checkpoint resume
cd ../resume-generator
./venv/bin/python generate_resume_generic.py
./venv/bin/python generate_resume_germany.py
./venv/bin/python generate_resume_public.py
./venv/bin/python generate_resume_future.py
cp ../personal/resume/Vamsi_Resume_Public.pdf ../portfolio/public/VamsiKrishna_Resume.pdf
./venv/bin/python verify_resume_pdf.py Vamsi_Resume.pdf --pages 1
./venv/bin/python verify_resume_pdf.py Vamsi_Resume_Future_Checkpoint.pdf --pages 1
./venv/bin/python check_ats.py Vamsi_Resume.pdf
./venv/bin/python test_resume_generator.py && ./venv/bin/python ../personal/resume/test_resume_claims.py

# Portfolio & personal.buildora.work verification
cd ../portfolio
pnpm lint && ./node_modules/.bin/tsc --noEmit && pnpm test:telegram && pnpm test:career-workflow && pnpm test:germany-roadmap && pnpm test:sync && pnpm pretest:e2e && pnpm exec playwright test e2e/career-workflow.spec.ts
```
