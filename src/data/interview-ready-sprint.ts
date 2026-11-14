export type InterviewSprintStatus = "active" | "gated" | "next";

export type InterviewSprintStage = {
  id: string;
  number: string;
  label: string;
  window: string;
  status: InterviewSprintStatus;
  summary: string;
  points: string[];
  exit: string;
};

export type InterviewSprintDay = {
  day: number;
  date: string;
  build: string;
  evidence: string;
};

export type InterviewSprintCadenceBlock = {
  days: string;
  time: string;
  work: string;
};

export type InterviewSprintTarget = {
  value: string;
  label: string;
};

/**
 * Public, generic roadmap content. The detailed personal schedule and
 * application record stay in the private workspace, not in this repository.
 */
export const interviewReadySprint = {
  headline: "Income first, six stages, one signed offer",
  summary:
    "The search runs as a 32-hour week: apply and follow up, keep the pipeline warm, drill the four interview rounds, and gate the flagship sprint on a signed contract. The public view stays generic; the private plan holds companies, contacts, compensation and the tracker.",
  triggerDate: "27 November 2026",
  sprintWindow: "30 November–10 December 2026",
  defenseDate: "10 December 2026",
  weeklyCapacity: "32 hours · Sunday off",
  repositoryUrl: "https://github.com/CVamsi27/rls-rehearsal",
  triggerNote:
    "If the trigger arrives after 27 November, shift the gated sprint and the defense by the same number of working days. Do not compress the verification gates to keep a date.",
  frontendNote:
    "Keep React, React Hook Form, Zod and TanStack Query current with Docita drills. The gated sprint changes the CLI, docs and release; it does not add a second frontend.",
  stages: [
    {
      id: "position",
      number: "01",
      label: "Position",
      window: "Now–27 November 2026",
      status: "active",
      summary:
        "Make the target and the evidence unambiguous before sending more applications.",
      points: [
        "Choose two role families and one contract offer; stop widening the list.",
        "Rewrite the CV and profile around tenant isolation, PostgreSQL and React evidence.",
        "Keep companies, contacts, compensation and the tracker private; public artifacts stay synthetic.",
      ],
      exit: "One CV variant per role family and a one-page contract offer are ready.",
    },
    {
      id: "pipeline",
      number: "02",
      label: "Pipeline",
      window: "Now–27 November 2026",
      status: "active",
      summary:
        "Create repeatable conversations instead of a pile of applications.",
      points: [
        "Each week: 15 tailored applications, 10 warm contacts, 2 referral asks and 5 contract enquiries.",
        "Every application gets a next action and a follow-up date in the private tracker.",
        "Reply within one working day and ask for the next step in every conversation.",
      ],
      exit: "Three live conversations and one referral in motion every week.",
    },
    {
      id: "interview",
      number: "03",
      label: "Interview readiness",
      window: "Now–27 November 2026",
      status: "active",
      summary: "Keep the four rounds warm while the pipeline runs.",
      points: [
        "Each week: 2 coding problems, 1 mock, 1 behavioral story and 1 proof update.",
        "Rotate JavaScript/TypeScript, React, PostgreSQL and system design; use Docita for React Hook Form, Zod and TanStack Query.",
        "Record a 90-second answer for each drill: problem, mechanism, example, trade-off, evidence.",
      ],
      exit:
        "A timed frontend, backend/design, coding and behavioral round, each with a recorded gap.",
    },
    {
      id: "proof",
      number: "04",
      label: "Flagship proof",
      window: "30 November–10 December 2026",
      status: "gated",
      summary:
        "Ship one reusable proof: the RLS isolation CLI and GitHub Action.",
      points: [
        "Config-driven actors, JWT claims and settings; transaction-wrapped matrix and explicit read/write checks.",
        "Control mode disables RLS to prove the assertion can fail; JSON, Markdown and JUnit reports.",
        "Safety guards for remote and privileged targets, Supabase and CI recipes, and a ten-day release.",
      ],
      exit:
        "A broken policy fails the CLI, the control leaks, the Action runs and the demo stays green.",
    },
    {
      id: "loops",
      number: "05",
      label: "Loops",
      window: "After the sprint",
      status: "next",
      summary: "Turn evidence into repeatable interview loops.",
      points: [
        "Run application → conversation → round → debrief every week; cut the source that produces no replies.",
        "Update one story, one project claim and one resume bullet from real feedback.",
        "Keep a weekly scorecard: applications, replies, rounds, offers and the first blocker.",
      ],
      exit:
        "Four consecutive weekly loops with a review and no unclaimed evidence.",
    },
    {
      id: "offer",
      number: "06",
      label: "Offer & first 90 days",
      window: "On a signed offer",
      status: "next",
      summary: "Close the search and start with a plan.",
      points: [
        "Compare scope, team, learning, compensation and start date; negotiate the written terms.",
        "Write a 30/60/90 plan: one system to learn, one delivery to own, one relationship to build.",
        "Keep the proof and drills warm for the first month; stop applying only after the contract is signed.",
      ],
      exit:
        "Signed contract with start and first-payment dates, plus a 30/60/90 plan.",
    },
  ] satisfies InterviewSprintStage[],
  cadence: {
    headline: "The 32-hour week",
    note: "Six-hour weekdays, a two-hour Saturday and Sunday off. The first daily block is income work, never the project.",
    blocks: [
      {
        days: "Monday–Friday",
        time: "3 h",
        work: "Applications, follow-ups, warm contacts, contract proposals and paid delivery",
      },
      {
        days: "Monday–Friday",
        time: "1 h",
        work: "Interview drill: one timed problem or a 90-second spoken answer",
      },
      {
        days: "Monday–Friday",
        time: "1 h",
        work: "Proof: resume bullet, project walkthrough or contract artifact",
      },
      {
        days: "Monday–Friday",
        time: "1 h",
        work: "Pipeline admin: replies, scheduling and tomorrow's first action",
      },
      {
        days: "Saturday",
        time: "2 h",
        work: "Weekly funnel review and one recorded mock or defense",
      },
      {
        days: "Sunday",
        time: "0 h",
        work: "Off",
      },
    ] satisfies InterviewSprintCadenceBlock[],
  },
  targets: [
    { value: "15", label: "tailored applications" },
    { value: "10", label: "warm contacts" },
    { value: "2", label: "referral asks" },
    { value: "5", label: "contract enquiries" },
    { value: "2", label: "coding problems" },
    { value: "1", label: "mock interview" },
    { value: "1", label: "behavioral story" },
    { value: "1", label: "proof update" },
  ] satisfies InterviewSprintTarget[],
  days: [
    {
      day: 1,
      date: "Mon 30 Nov",
      build: "Baseline and one-page design brief",
      evidence: "Clean checkout builds; doctor and demo behave as documented",
    },
    {
      day: 2,
      date: "Tue 1 Dec",
      build: "Red tests for config, matrix, control and reports",
      evidence: "Failures are assertions, not compile errors",
    },
    {
      day: 3,
      date: "Wed 2 Dec",
      build: "Session setup: role, JWT claims and settings",
      evidence: "SET ROLE verified; scope cannot leak between actors",
    },
    {
      day: 4,
      date: "Thu 3 Dec",
      build: "Matrix and safety guards",
      evidence: "A disabled policy is caught; remote and privileged targets are refused",
    },
    {
      day: 5,
      date: "Fri 4 Dec",
      build: "Explicit read/write checks and rollback",
      evidence: "Foreign write denied; no fixture change persists",
    },
    {
      day: 6,
      date: "Sat 5 Dec",
      build: "Control mode and coverage gap",
      evidence: "RLS off leaks the foreign row; the same assertion fails",
    },
    {
      day: 7,
      date: "Mon 7 Dec",
      build: "Reports, exit codes and GitHub Action",
      evidence: "JSON, Markdown and JUnit parse; a failing run fails CI",
    },
    {
      day: 8,
      date: "Tue 8 Dec",
      build: "Supabase and disposable-database recipes",
      evidence: "Claims work through auth.uid(); the action runs end to end",
    },
    {
      day: 9,
      date: "Wed 9 Dec",
      build: "Case study, demo and release candidate",
      evidence: "Every claim traces to a command, test or commit",
    },
    {
      day: 10,
      date: "Thu 10 Dec",
      build: "Timed defense and scorecard",
      evidence: "Three gaps, each with a next action",
    },
  ] satisfies InterviewSprintDay[],
  gates: [
    "Project: clean checkout, doctor passes, matrix catches a broken policy, control leaks and the Action runs.",
    "Resume: every selected bullet has the change, location, check and claim limit.",
    "Rounds: one frontend, backend/design, coding and behavioral round, each timed.",
    "Feedback: one independent mock or peer review with the first concern and fix.",
    "Logistics: introduction, stories, interviewer questions and working links.",
  ],
} as const;
