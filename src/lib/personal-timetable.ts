/** Active plan: software-developer-bible/personal/reports/100-day-job-roadmap.md,
 * user override 2026-10-03: 10 focused weekday hours, 4 on each weekend day.
 * Clock times are movable examples in Asia/Kolkata; breaks are outside work.
 */
export const TIMETABLE_OWNER_EMAIL = "cvamsik99@gmail.com";
export type ScheduleBlock = { label: string; minutes: number; work: boolean; output: string };
export type PersonalSchedule = Record<string, ScheduleBlock>;
const weekday: PersonalSchedule = {
  "08:30-10:30": { label: "Bible study and retrieval practice", minutes: 120, work: true, output: "Chapter notes and a recall answer" },
  "10:30-12:30": { label: "Build and debug the week's practical slice", minutes: 120, work: true, output: "Runnable change, tests or case-study evidence" },
  "12:30-14:00": { label: "Research matched roles, recruiter replies and tailored applications", minutes: 90, work: true, output: "Checked submissions or stage preparation" },
  "14:30-16:30": { label: "Open source or public portfolio proof", minutes: 120, work: true, output: "Reviewed code, a contribution or shipped proof" },
  "16:30-17:30": { label: "JavaScript/TypeScript coding and interview preparation", minutes: 60, work: true, output: "Correct solution, boundary cases and complexity" },
  "17:30-18:00": { label: "Mock interview or spoken project story", minutes: 30, work: true, output: "Recording, clearer answer and one observed gap" },
  "20:30-21:30": { label: "Follow-ups, delayed recall and tomorrow's next action", minutes: 60, work: true, output: "Recall attempt, checked follow-up and a specific next task" },
};
const weekend: PersonalSchedule = {
  "09:00-10:15": { label: "Review applications, recruiter replies and relevant follow-ups", minutes: 75, work: true, output: "Updated funnel and checked next actions" },
  "10:30-11:45": { label: "Practical slice and targeted Bible study", minutes: 75, work: true, output: "Runnable change, test or case-study evidence" },
  "14:30-15:15": { label: "One JavaScript/TypeScript coding problem or variation", minutes: 45, work: true, output: "Correct solution, boundary cases and complexity" },
  "15:30-16:00": { label: "Mock interview or spoken project story", minutes: 30, work: true, output: "One clearer answer and one observed gap" },
  "16:00-16:15": { label: "Delayed recall and plan the next session", minutes: 15, work: true, output: "Revision attempt and a specific task" },
};
export function personalSchedule(email: string | null | undefined, date: string): PersonalSchedule | undefined {
  if (email?.trim().toLowerCase() !== TIMETABLE_OWNER_EMAIL || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < "2026-10-03") return undefined;
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 || day === 6 ? weekend : weekday;
}
export function alignPersonalTimetable<T extends { days: Array<{ date: string; schedule?: unknown }> }>(email: string | null | undefined, timetable: T): T {
  if (email?.trim().toLowerCase() !== TIMETABLE_OWNER_EMAIL) return timetable;
  return { ...timetable, days: timetable.days.map(day => {
    const schedule = personalSchedule(email, day.date);
    return schedule === undefined ? day : { ...day, schedule };
  }) };
}
