export type ReminderSlot = { enabled: boolean; time: string };
export type CareerReminderKey = "morning" | "study" | "roleResearch" | "interview" | "eveningReview" | "windDown";
export type ReminderKey = "weighIn" | "focus" | "evening" | CareerReminderKey;

export type ReminderPreferences = {
  weighIn: ReminderSlot;
  focus: ReminderSlot;
  evening: ReminderSlot;
  career: Record<CareerReminderKey, ReminderSlot>;
  browserPermission?: NotificationPermission | "unsupported";
};

export const DEFAULT_REMINDERS: ReminderPreferences = {
  weighIn: { enabled: false, time: "08:00" },
  focus: { enabled: false, time: "09:00" },
  evening: { enabled: false, time: "20:30" },
  career: {
    morning: { enabled: false, time: "07:00" },
    study: { enabled: false, time: "10:25" },
    roleResearch: { enabled: false, time: "12:25" },
    interview: { enabled: false, time: "17:25" },
    eveningReview: { enabled: false, time: "20:30" },
    windDown: { enabled: false, time: "21:30" },
  },
};

export const REMINDER_LABELS: Record<ReminderKey, string> = {
  weighIn: "Weigh-in reminder",
  focus: "Focus reminder",
  evening: "End-of-day check-in",
  morning: "07:00 · Exercise and freshen up",
  study: "10:25 · Study block check-in",
  roleResearch: "12:25 · Role research check-in",
  interview: "17:25 · Interview practice check-in",
  eveningReview: "20:30 · Outreach and daily review",
  windDown: "21:30 · Wind down for 22:00 sleep",
};
