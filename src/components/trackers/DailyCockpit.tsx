import type { ReactNode } from "react";
import ActionQueue, { type ActionQueueRow } from "@/components/trackers/ActionQueue";
import FocusSprint from "@/components/trackers/FocusSprint";
import WeekPulse, { type WeekPulseDay } from "@/components/trackers/WeekPulse";

export type DailyCockpitProps = {
  dailyMove: ReactNode;
  goalSummary: ReactNode;
  momentum: ReactNode;
  focusLabel: string;
  actionQueue: ActionQueueRow[];
  weekPulse: WeekPulseDay[];
};

export default function DailyCockpit({
  dailyMove,
  goalSummary,
  momentum,
  focusLabel,
  actionQueue,
  weekPulse,
}: DailyCockpitProps) {
  return (
    <>
      <section data-testid="command-center-brief" className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,.85fr)]">
        <div className="order-1 lg:col-start-1 lg:row-start-1">
          {dailyMove}
        </div>
        <div className="order-3 lg:col-start-1 lg:row-start-2">
          <FocusSprint label={focusLabel} compact />
        </div>
        <div className="order-4 lg:col-start-2 lg:row-start-1">
          {goalSummary}
        </div>
        <div className="order-2 lg:col-start-2 lg:row-start-2" data-testid="momentum-signal">
          {momentum}
        </div>
      </section>
      <ActionQueue rows={actionQueue} />
      <WeekPulse days={weekPulse} />
    </>
  );
}
