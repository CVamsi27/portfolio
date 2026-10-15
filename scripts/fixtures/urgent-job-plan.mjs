/** Synthetic urgent-plan data; no candidate pay or account content. */
import { roadmapFixture } from "./job-plan.mjs";
export const urgentCampaignFixture = `# Urgent remote and Germany campaign

The confirmed USD 73/hour minimum applies to both remote contracts and salaried remote jobs. The salaried comparison is USD 151,840 gross annual base. Germany relocation preferences remain **EUR 93K–118K target / EUR 81K minimum**.

## Start now — the next four focused hours

Qualify three roles, finish one packet, prepare two contacts and practise a real contribution. These four hours replace existing blocks.

## Outreach drafts

Use a real role and truthful contribution. Confirm India eligibility and the budget before substantial custom work.
`;
export const urgentLearningFixture = `# Eight-session learning route

## Eight sessions inside the timetable

Reproduce, explain the index, calculate statistics, inspect booking, payments and queue recovery, vary the workload and rehearse.

## Exact synthetic practice command

\`\`\`bash
python3 example.py --output runs/fresh-synthetic.json
\`\`\`

## Twenty-four follow-ups

Explain only the observed result and its limitations. [Calendar](2026-10-15-detailed-job-plan-calendar.md).
`;
export function urgentRoadmapFixture() {
  const p = roadmapFixture();
  p.execution.jobPlan.version = 2;
  p.target =
    "Full-stack remote employment/paid contracts and Germany relocation";
  p.allocations = [
    ["Applications and qualification", 16],
    ["Hiring conversations and outreach", 7],
    ["Interviews and practical preparation", 12],
    ["Project proof or paid delivery", 10],
    ["OSS contribution", 4],
    ["Targeted study", 3],
    ["German", 5],
    ["Documents, review and planning", 3],
  ].map(([label, hours]) => ({ label, hours }));
  p.execution.guides.find((g) => g.id === "campaign").content =
    urgentCampaignFixture;
  for (const d of p.execution.jobPlan.days) {
    if (d.date < p.execution.jobPlan.effectiveOn) continue;
    const w = new Date(d.date + "T12:00:00Z").getUTCDay();
    const full = ["2026-12-19", "2027-01-02"].includes(d.date);
    const assessment = w === 3 || ["2026-12-18", "2027-01-01"].includes(d.date);
    const slots =
      w === 6
        ? [
            ["09:00-10:00", "funnel"],
            ["10:15-12:15", "mock"],
            ["13:00-14:00", full ? "proof" : "oss"],
            ["14:15-14:45", "study"],
            ["14:45-15:00", "documents"],
            ["15:00-15:15", "planning"],
          ]
        : [
            ["08:00-11:00", "applications"],
            ["11:15-13:15", "project"],
            [w === 2 || w === 4 ? "14:00-16:00" : "14:00-15:00", "network"],
            ...([1, 3, 5].includes(w) ? [["15:00-16:00", "oss"]] : []),
            ["16:00-16:30", "study"],
            ...(assessment
              ? [["16:45-18:45", "assessment"]]
              : [
                  ["16:45-18:15", "coding"],
                  ["18:15-18:45", "speaking"],
                ]),
            ["20:00-21:00", "german"],
            ["21:00-21:30", "review"],
          ];
    const template = d.assignments[0];
    d.assignments = slots.map(([range, kind]) => {
      const old = d.assignments.find((a) => a.kind === kind) ?? template;
      const [start, end] = range
        .split("-")
        .map((x) => Number(x.slice(0, 2)) * 60 + Number(x.slice(3)));
      return {
        ...old,
        id: `germany:2026:day:${d.date}:assignment:${kind}`,
        kind,
        range,
        minutes: end - start,
      };
    });
  }
  return p;
}
