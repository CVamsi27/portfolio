import { validPlanBlock, shiftDay, type PlanBlock } from "./day-plan.ts";

export function editablePlanBlocks(
  blocks: Record<string, PlanBlock>,
  date: string,
  days = 1,
): PlanBlock[] {
  const end = shiftDay(date, days - 1);
  return Object.values(blocks)
    .filter(
      (block) =>
        validPlanBlock(block) &&
        !block.deleted &&
        !block.id.startsWith("owner:") &&
        !block.id.startsWith("timetable:") &&
        block.date >= date &&
        block.date <= end,
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.startLocal.localeCompare(b.startLocal) ||
        a.id.localeCompare(b.id),
    );
}
