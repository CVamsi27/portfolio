import { shiftDay, validDay, type AgendaItem } from "./day-plan.ts";

export function containingWeek(date: string): string[] {
  if (!validDay(date)) throw new Error("Choose a valid date.");
  const weekday = new Date(date + "T12:00:00Z").getUTCDay();
  const monday = shiftDay(date, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => shiftDay(monday, i));
}

export function agendaPeriod(
  at: number,
  timeZone: string,
): "Morning" | "Afternoon" | "Evening" {
  const hour = Number(
    new Intl.DateTimeFormat("en", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone,
    }).format(at),
  );
  return hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
}

export function agendaStatus(
  row: AgendaItem,
  date: string,
  today: string,
  now: number,
): string {
  if (row.done) return row.status ?? "Completed";
  if (row.unavailable) return "Linked task unavailable";
  if (date === today && row.at + (row.durationMinutes ?? 0) * 60000 <= now)
    return "Earlier";
  return "Planned";
}
