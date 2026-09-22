export type LockdownPlatform = "ios" | "android" | "macos" | "windows";

export type LockdownPreferences = {
  bedtimeEnabled: boolean;
  bedtimeStart: string;
  bedtimeEnd: string;
  bedtimeDays: number[];
  deviceChecklist: Record<LockdownPlatform, boolean>;
};

export const DEFAULT_LOCKDOWN_PREFERENCES: LockdownPreferences = {
  bedtimeEnabled: false,
  bedtimeStart: "22:30",
  bedtimeEnd: "07:00",
  bedtimeDays: [0, 1, 2, 3, 4, 5, 6],
  deviceChecklist: { ios: false, android: false, macos: false, windows: false },
};

export const LOCKDOWN_PLATFORMS: Array<{
  id: LockdownPlatform;
  label: string;
  steps: readonly string[];
}> = [
  {
    id: "ios",
    label: "iPhone / iPad",
    steps: ["Open Settings → Focus → Sleep or create a Personal Focus.", "Add Screen Time app limits for distracting apps.", "Turn on the device Focus or Do Not Disturb schedule yourself."],
  },
  {
    id: "android",
    label: "Android",
    steps: ["Open Digital Wellbeing → Bedtime mode.", "Use Focus mode to pause distracting apps.", "Turn on the device Do Not Disturb schedule yourself."],
  },
  {
    id: "macos",
    label: "Mac",
    steps: ["Open System Settings → Focus and schedule Do Not Disturb.", "Use Screen Time → App Limits for distracting apps.", "Enable the Mac Focus schedule yourself."],
  },
  {
    id: "windows",
    label: "Windows",
    steps: ["Open Settings → System → Focus and choose a session length.", "Use Microsoft Family Safety or app limits where available.", "Turn on Windows notifications/Do Not Disturb settings yourself."],
  },
];

function parseMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function dayWithMinutes(date: Date, minutes: number): Date {
  const result = startOfDay(date);
  result.setMinutes(minutes);
  return result;
}

function candidateForDay(date: Date, startMinutes: number, endMinutes: number, days: number[]): { start: Date; end: Date } | null {
  if (!days.includes(date.getDay())) return null;
  const start = dayWithMinutes(date, startMinutes);
  const end = dayWithMinutes(date, endMinutes);
  if (endMinutes <= startMinutes) end.setDate(end.getDate() + 1);
  return { start, end };
}

export function nextBedtimeWindow(preferences: LockdownPreferences, now: Date): { start: Date; end: Date } | null {
  if (!preferences.bedtimeEnabled) return null;
  const startMinutes = parseMinutes(preferences.bedtimeStart);
  const endMinutes = parseMinutes(preferences.bedtimeEnd);
  const days = preferences.bedtimeDays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  if (startMinutes === null || endMinutes === null || days.length === 0) return null;

  const current = new Date(now);
  let upcoming: { start: Date; end: Date } | null = null;
  for (let offset = -1; offset <= 8; offset += 1) {
    const day = new Date(current);
    day.setDate(day.getDate() + offset);
    const candidate = candidateForDay(day, startMinutes, endMinutes, days);
    if (!candidate) continue;
    if (current >= candidate.start && current < candidate.end) return candidate;
    if (candidate.start > current && (!upcoming || candidate.start < upcoming.start)) upcoming = candidate;
  }
  return upcoming;
}

export function isBedtimeLocked(preferences: LockdownPreferences, now: Date): boolean {
  const window = nextBedtimeWindow(preferences, now);
  return Boolean(window && now >= window.start && now < window.end);
}

export function formatLockEnd(end: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(end);
}

export function normalizeLockdownPreferences(value: unknown): LockdownPreferences {
  if (!value || typeof value !== "object") return DEFAULT_LOCKDOWN_PREFERENCES;
  const raw = value as Partial<LockdownPreferences>;
  const deviceChecklist = raw.deviceChecklist && typeof raw.deviceChecklist === "object"
    ? raw.deviceChecklist as Partial<Record<LockdownPlatform, boolean>>
    : {};
  return {
    bedtimeEnabled: raw.bedtimeEnabled === true,
    bedtimeStart: typeof raw.bedtimeStart === "string" ? raw.bedtimeStart : DEFAULT_LOCKDOWN_PREFERENCES.bedtimeStart,
    bedtimeEnd: typeof raw.bedtimeEnd === "string" ? raw.bedtimeEnd : DEFAULT_LOCKDOWN_PREFERENCES.bedtimeEnd,
    bedtimeDays: Array.isArray(raw.bedtimeDays) ? raw.bedtimeDays.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6) : DEFAULT_LOCKDOWN_PREFERENCES.bedtimeDays,
    deviceChecklist: {
      ios: deviceChecklist.ios === true,
      android: deviceChecklist.android === true,
      macos: deviceChecklist.macos === true,
      windows: deviceChecklist.windows === true,
    },
  };
}
