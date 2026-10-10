/** Date-aware owner schedule. The 50-hour campaign starts 2026-10-12; earlier dates retain their historical allocation. Times are movable IST examples. */
export const TIMETABLE_OWNER_EMAIL = "cvamsik99@gmail.com";
export type ScheduleBlock = {
  label: string;
  minutes: number;
  work: boolean;
  output: string;
};
export type PersonalSchedule = Record<string, ScheduleBlock>;
const weekday: PersonalSchedule = {
  "08:30-10:30": {
    label: "Bible study and retrieval practice",
    minutes: 120,
    work: true,
    output: "Chapter notes and a recall answer",
  },
  "10:30-12:30": {
    label: "Build and debug the week's practical slice",
    minutes: 120,
    work: true,
    output: "Runnable change, tests or case-study evidence",
  },
  "12:30-14:00": {
    label:
      "Research matched roles, recruiter replies and tailored applications",
    minutes: 90,
    work: true,
    output: "Checked submissions or stage preparation",
  },
  "14:30-16:30": {
    label: "Open source or public portfolio proof",
    minutes: 120,
    work: true,
    output: "Reviewed code, a contribution or shipped proof",
  },
  "16:30-17:30": {
    label: "JavaScript/TypeScript coding and interview preparation",
    minutes: 60,
    work: true,
    output: "Correct solution, boundary cases and complexity",
  },
  "17:30-18:00": {
    label: "Mock interview or spoken project story",
    minutes: 30,
    work: true,
    output: "Recording, clearer answer and one observed gap",
  },
  "20:30-21:30": {
    label: "Follow-ups, delayed recall and tomorrow's next action",
    minutes: 60,
    work: true,
    output: "Recall attempt, checked follow-up and a specific next task",
  },
};
const weekend: PersonalSchedule = {
  "09:00-10:15": {
    label: "Review applications, recruiter replies and relevant follow-ups",
    minutes: 75,
    work: true,
    output: "Updated funnel and checked next actions",
  },
  "10:30-11:45": {
    label: "Practical slice and targeted Bible study",
    minutes: 75,
    work: true,
    output: "Runnable change, test or case-study evidence",
  },
  "14:30-15:15": {
    label: "One JavaScript/TypeScript coding problem or variation",
    minutes: 45,
    work: true,
    output: "Correct solution, boundary cases and complexity",
  },
  "15:30-16:00": {
    label: "Mock interview or spoken project story",
    minutes: 30,
    work: true,
    output: "One clearer answer and one observed gap",
  },
  "16:00-16:15": {
    label: "Delayed recall and plan the next session",
    minutes: 15,
    work: true,
    output: "Revision attempt and a specific task",
  },
};
const campaignWeekday: PersonalSchedule = {
  "08:30-10:00": {
    label: "Bible study and retrieval",
    minutes: 90,
    work: true,
    output:
      "Explain one mechanism unaided, trace an example and its failure boundary",
  },
  "10:15-12:15": {
    label: "Build the week's project slice",
    minutes: 120,
    work: true,
    output: "Runnable change, meaningful test or measured evidence",
  },
  "12:30-14:00": {
    label: "Germany applications and recruiter replies",
    minutes: 90,
    work: true,
    output:
      "Checked application, fit note, follow-up or actual stage preparation",
  },
  "14:30-16:00": {
    label: "Open source",
    minutes: 90,
    work: true,
    output: "Reproduction, failing test, focused fix or review response",
  },
  "16:15-17:15": {
    label: "JavaScript/TypeScript coding practice",
    minutes: 60,
    work: true,
    output: "Unaided solution or variation, boundary tests and complexity",
  },
  "17:15-17:45": {
    label: "Spoken project, design or behavioral practice",
    minutes: 30,
    work: true,
    output: "Recording and one corrected gap",
  },
  "20:30-21:15": {
    label: "Beginner German",
    minutes: 45,
    work: true,
    output: "Listening, spoken response and a brief written exercise",
  },
  "21:15-21:30": {
    label: "Delayed recall and next action",
    minutes: 15,
    work: true,
    output: "Record evidence and choose a specific next task",
  },
};
const campaignSaturday: PersonalSchedule = {
  "09:00-10:00": {
    label: "Funnel review and due follow-ups",
    minutes: 60,
    work: true,
    output: "Updated stages, denominators and checked next actions",
  },
  "10:15-11:45": {
    label: "Full mock interview and debrief",
    minutes: 90,
    work: true,
    output: "Timed attempt, rubric and next week's top gap",
  },
  "12:00-13:00": {
    label: "Germany documents and relocation",
    minutes: 60,
    work: true,
    output:
      "One verified requirement, document status or dated cost comparison",
  },
  "14:30-15:30": {
    label: "Package project proof",
    minutes: 60,
    work: true,
    output: "Demo, case-study section, benchmark notes or reproducible setup",
  },
  "15:30-16:00": {
    label: "Weekly planning",
    minutes: 30,
    work: true,
    output: "Next scope, confirmed commitments and replacement blocks",
  },
};
export function isCalendarDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}
export function personalSchedule(
  email: string | null | undefined,
  date: string,
): PersonalSchedule | undefined {
  if (
    email?.trim().toLowerCase() !== TIMETABLE_OWNER_EMAIL ||
    !isCalendarDate(date) ||
    date < "2026-10-03"
  )
    return undefined;
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (date < "2026-10-12") return day === 0 || day === 6 ? weekend : weekday;
  if (day === 0) return {};
  if (day === 6) return campaignSaturday;
  if (day === 2 || day === 4)
    return {
      ...campaignWeekday,
      "14:30-16:00": {
        label: "Networking and technical writing",
        minutes: 90,
        work: true,
        output: "Evidence-based post, useful comments or relevant conversation",
      },
    };
  return campaignWeekday;
}
export function alignPersonalTimetable<
  T extends { days: Array<{ date: string; schedule?: unknown }> },
>(email: string | null | undefined, timetable: T): T {
  if (email?.trim().toLowerCase() !== TIMETABLE_OWNER_EMAIL) return timetable;
  return {
    ...timetable,
    days: timetable.days.map((day) => {
      const schedule = personalSchedule(email, day.date);
      return schedule === undefined ? day : { ...day, schedule };
    }),
  };
}
