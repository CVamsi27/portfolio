export type ReminderSlot = { enabled: boolean; time: string };

export type ReminderPreferences = {
  weighIn: ReminderSlot;
  focus: ReminderSlot;
  evening: ReminderSlot;
  browserPermission?: NotificationPermission | "unsupported";
};

export const DEFAULT_REMINDERS: ReminderPreferences = {
  weighIn: { enabled: false, time: "08:00" },
  focus: { enabled: false, time: "09:00" },
  evening: { enabled: false, time: "20:30" },
};

export const REMINDER_LABELS: Record<keyof Pick<ReminderPreferences, "weighIn" | "focus" | "evening">, string> = {
  weighIn: "Weigh-in reminder",
  focus: "Focus reminder",
  evening: "End-of-day check-in",
};
