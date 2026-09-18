import {
  Compass,
  Dumbbell,
  Flag,
  Flame,
  KeyRound,
  Link2,
  ListChecks,
  Settings,
  Share2,
  Globe2,
  BriefcaseBusiness,
  BookOpen,
  WalletCards,
  Sparkles,
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
  settings: Settings,
  globe: Globe2,
  briefcase: BriefcaseBusiness,
  book: BookOpen,
  wallet: WalletCards,
  sparkles: Sparkles,
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
