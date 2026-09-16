import {
  Compass,
  Dumbbell,
  Flag,
  Flame,
  KeyRound,
  Link2,
  ListChecks,
  Share2,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";

export const TRACKER_ICONS = {
  timer: Timer,
  flame: Flame,
  flag: Flag,
  workout: Dumbbell,
  todo: ListChecks,
  share: Share2,
  hub: Compass,
  shared: Users,
  login: KeyRound,
  link: Link2,
} satisfies Record<string, LucideIcon>;

export type TrackerIconName = keyof typeof TRACKER_ICONS;

export function TrackerIcon({
  name,
  className,
}: {
  name: TrackerIconName;
  className?: string;
}) {
  const Cmp = TRACKER_ICONS[name];
  return <Cmp className={className ?? "h-5 w-5 text-white"} aria-hidden />;
}
