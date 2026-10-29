export type ReminderSlot = { enabled: boolean; time: string };
export type CareerReminderKey =
  | "morning"
  | "study"
  | "roleResearch"
  | "interview"
  | "eveningReview"
  | "windDown";
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
    study: { enabled: false, time: "09:00" },
    roleResearch: { enabled: false, time: "10:30" },
    interview: { enabled: false, time: "16:30" },
    eveningReview: { enabled: false, time: "19:30" },
    windDown: { enabled: false, time: "21:30" },
  },
};

export const REMINDER_LABELS: Record<ReminderKey, string> = {
  weighIn: "Weigh-in reminder",
  focus: "Focus reminder",
  evening: "End-of-day check-in",
  morning: "Wake up and refresh",
  study: "Study block check-in",
  roleResearch: "Role research check-in",
  interview: "Interview practice check-in",
  eveningReview: "Outreach and daily review",
  windDown: "Wind down for 22:00 sleep",
};
