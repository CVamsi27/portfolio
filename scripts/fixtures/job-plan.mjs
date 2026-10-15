/** Synthetic career data for unit/browser verification; no account data. */
const dateAt = (n) =>
  new Date(Date.UTC(2026, 9, 12 + n)).toISOString().slice(0, 10);
export function jobPlanFixture() {
  return {
    version: 1,
    effectiveOn: "2026-10-15",
    timezone: "Asia/Kolkata",
    weeklyMinutes: 3600,
    sourceDigest: "b".repeat(64),
    days: Array.from({ length: 84 }, (_, n) => n)
      .filter((n) => n % 7 !== 6)
      .map((n) => {
        const date = dateAt(n),
          saturday = n % 7 === 5,
          wednesday =
            n % 7 === 2 || ["2026-12-18", "2027-01-01"].includes(date);
        const slots = saturday
          ? [
              ["09:00-10:00", "funnel"],
              ["10:15-11:45", "mock"],
              ["12:00-13:00", "documents"],
              ["14:30-15:30", "proof"],
              ["15:30-16:00", "planning"],
            ]
          : [
              ["08:00-09:30", "study"],
              ["09:45-12:15", "project"],
              ["12:30-14:00", "applications"],
              ["14:30-16:30", n % 7 === 1 || n % 7 === 3 ? "network" : "oss"],
              ...(wednesday
                ? [["16:45-18:45", "assessment"]]
                : [
                    ["16:45-18:15", "coding"],
                    ["18:15-18:45", "speaking"],
                  ]),
              ["20:00-21:00", "german"],
              ["21:00-21:30", "review"],
            ];
        return {
          date,
          assignments: slots.map(([range, kind]) => {
            const [a, b] = range
              .split("-")
              .map((x) => Number(x.slice(0, 2)) * 60 + Number(x.slice(3)));
            return {
              id: `germany:2026:day:${date}:assignment:${kind}`,
              date,
              range,
              minutes: b - a,
              kind,
              title:
                kind === "study"
                  ? "Type narrowing at runtime"
                  : kind === "assessment"
                    ? "Checkpoint and gap repair"
                    : `${kind} assignment`,
              outcome:
                "Explain the rejection boundary using a runnable example.",
              brief:
                "Read [Type narrowing](https://study.buildora.work/10-frontend/10.2-typescript/01-foundations/10.2.1.03-type-narrowing.md). Compare a declared type with runtime validation. [Exercise bank](2026-10-10-germany-daily-curriculum.md)",
              steps: [
                "Predict an invalid input before running it.",
                "Run the example and explain the actual boundary.",
              ],
              deliverable: "A saved trace and corrected misconception.",
              doneCheck:
                "Explain the rejection without notes and record the observed check.",
              dependency:
                "Open the existing source and inspect the previous attempt.",
              blocked:
                "Record the missing prerequisite and replace a later practice block.",
            };
          }),
        };
      }),
  };
}
export function executionFixture() {
  return {
    version: 1,
    assessmentVersion: "a".repeat(64),
    days: Array.from({ length: 60 }, (_, i) => {
      const date = dateAt(Math.floor(i / 5) * 7 + (i % 5));
      return {
        id: `germany:2026:day:${date}`,
        date,
        week: Math.floor(i / 5) + 1,
        title: `Study ${date}`,
        blocks: {
          study: "Read and explain the source.",
          project: "Test the request boundary.",
          practice: "Solve the coding variation.",
          speak: "Explain your result.",
        },
      };
    }),
    rounds: Array.from({ length: 7 }, (_, i) => ({
      id: "R" + i,
      title: "Round " + i,
      dimensions: [
        "Contract",
        "Correctness",
        "Boundaries",
        "Tests",
        "Communication",
      ],
      passTotal: 16,
      minimum3: [1, 2],
      content: "Explain and test the changed prompt.",
      version: "c".repeat(64),
    })),
    assessments: Array.from({ length: 12 }, (_, w) =>
      ["W", "E"].map((k) => ({
        id: k + String(w + 1).padStart(2, "0"),
        date: dateAt(w * 7 + (k === "W" ? 2 : 5)),
        time: k === "W" ? "16:15–17:45" : "10:15–11:45",
        content: "Changed-prompt mock with scoring.",
      })),
    ).flat(),
    companies: Array.from({ length: 25 }, (_, i) => ({
      id: "DE" + String(i + 1).padStart(2, "0"),
      title: "Synthetic company " + i,
      status: "research",
      action: "Check the current role and actual fit.",
    })),
    weeks: Array.from({ length: 12 }, (_, i) => ({
      number: i + 1,
      application: "Check roles and tailor evidence.",
      tuesday: "Draft a relevant question.",
      thursday: "Review the technical post.",
      oss: {
        monday: "Reproduce the issue.",
        wednesday: "Test the boundary.",
        friday: "Review the focused fix.",
      },
      german: "Retrieve the lesson.",
      germanCheck: "Record a spoken exchange.",
      relocation: "Check one official requirement.",
    })),
    posts: Array.from({ length: 12 }, (_, i) => ({
      id: "P" + String(i + 1).padStart(2, "0"),
      date: dateAt(i * 7 + 3),
      title: "Tested boundary",
      content: "Write from actual evidence.",
    })),
    practices: [
      {
        id: "C01",
        task: "Find a distinct pair.",
        cases: "Empty, duplicate and negative inputs.",
      },
    ],
    guides: ["design", "curriculum", "exams", "campaign"].map((id) => ({
      id,
      title: id,
      content: "Synthetic guide for " + id,
    })),
    jobPlan: jobPlanFixture(),
  };
}
export function roadmapFixture() {
  return {
    version: 1,
    reviewedOn: "2026-10-15",
    startDate: "2026-10-12",
    endDate: "2027-01-03",
    target: "Full-stack engineering in Germany",
    sourceDigest: "d".repeat(64),
    execution: executionFixture(),
    weeks: Array.from({ length: 12 }, (_, i) => ({
      number: i + 1,
      start: dateAt(i * 7),
      end: dateAt(i * 7 + 6),
      study: "Explain the boundary.",
      deliverable: "A tested workflow.",
      campaign: "Check relevant roles.",
      items: [
        {
          id: `germany:2026:w${String(i + 1).padStart(2, "0")}:project`,
          text: "Test the workflow.",
          evidenceType: "note",
          acceptanceCriteria: "Save the revision and observed checks.",
          estimatedMinutes: 120,
        },
      ],
    })),
    allocations: [{ label: "Focused work", hours: 60 }],
    sections: [],
    sources: [],
  };
}
