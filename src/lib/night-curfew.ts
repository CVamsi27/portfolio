/**
 * Night Curfew & Phone Bedtime Lockdown Domain Model
 *
 * Enforces a strict phone lockdown starting at 10:00 PM (22:00) until morning (06:00 AM),
 * permitting access only to essential utilities (Phone, Messaging, Settings, Emergency SOS,
 * and Sleep Audio). Protects circadian sleep cycles required for deep memory consolidation
 * towards senior engineering career goals in Germany (€75k-€85k Blue Card).
 */

export interface AllowedCurfewApp {
  id: string;
  name: string;
  category: "communication" | "utility" | "emergency" | "sleep";
  urlScheme: string;
  iconName: string;
  description: string;
  isNativeLink: boolean;
}

export interface NightCurfewConfig {
  enabled: boolean;
  startHour: number; // 22 (10:00 PM)
  startMinute: number; // 0
  endHour: number; // 6 (06:00 AM)
  endMinute: number; // 0
  onlyMobilePhones: boolean; // default true: locks down handheld phones
  emergencyUnlockedUntil: number | null; // epoch timestamp when temporary emergency pass ends
  emergencyUnlockDurationMs: number; // 15 minutes default
  emergencyContactName: string;
  emergencyContactNumber: string;
  bedtimeAffirmation: string;
}

export const DEFAULT_ALLOWED_APPS: AllowedCurfewApp[] = [
  {
    id: "phone",
    name: "Phone",
    category: "communication",
    urlScheme: "tel:",
    iconName: "Phone",
    description: "Make essential or urgent phone calls",
    isNativeLink: true,
  },
  {
    id: "messages",
    name: "Messages / SMS",
    category: "communication",
    urlScheme: "sms:",
    iconName: "MessageSquare",
    description: "Send or check critical text messages",
    isNativeLink: true,
  },
  {
    id: "emergency-sos",
    name: "Emergency Services (112)",
    category: "emergency",
    urlScheme: "tel:112",
    iconName: "ShieldAlert",
    description: "Official European / International Emergency Services",
    isNativeLink: true,
  },
  {
    id: "sleep-audio",
    name: "Sleep Audio & Soundscapes",
    category: "sleep",
    urlScheme: "https://music.youtube.com/search?q=delta+waves+sleep+deep+rest",
    iconName: "Headphones",
    description: "Screen-off ambient delta waves, rain, and sleep podcasts",
    isNativeLink: false,
  },
];

export const DEFAULT_NIGHT_CURFEW_CONFIG: NightCurfewConfig = {
  enabled: true,
  startHour: 22, // 10:00 PM
  startMinute: 0,
  endHour: 6, // 06:00 AM
  endMinute: 0,
  onlyMobilePhones: true,
  emergencyUnlockedUntil: null,
  emergencyUnlockDurationMs: 15 * 60 * 1000, // 15 mins
  emergencyContactName: "Emergency Contact",
  emergencyContactNumber: "",
  bedtimeAffirmation:
    "Sleep is the biological compiler of your brain. Every hour of deep sleep before midnight consolidates algorithms and system design concepts into permanent memory for your €75k–€85k Germany relocation.",
};

/**
 * Checks whether the current time falls within the configured curfew window.
 * Handles the overnight rollover across midnight (e.g. 22:00 to 06:00).
 */
export function isWithinCurfewWindow(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
  currentTime: Date = new Date()
): boolean {
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  if (startMinutes === endMinutes) {
    return false; // Zero-duration window
  }

  // Same-day window (e.g. 13:00 to 17:00)
  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  // Overnight window spanning midnight (e.g. 22:00 to 06:00)
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

/**
 * Determines if Night Curfew is currently active and enforceable on this device.
 */
export function isNightCurfewActive(
  config: NightCurfewConfig = DEFAULT_NIGHT_CURFEW_CONFIG,
  nowMs: number = Date.now(),
  isPhone: boolean = true
): boolean {
  if (!config.enabled) return false;

  // Check emergency unlock bypass
  if (config.emergencyUnlockedUntil && nowMs < config.emergencyUnlockedUntil) {
    return false;
  }

  // Check device filter
  if (config.onlyMobilePhones && !isPhone) {
    return false;
  }

  const currentDate = new Date(nowMs);
  return isWithinCurfewWindow(
    config.startHour,
    config.startMinute,
    config.endHour,
    config.endMinute,
    currentDate
  );
}

/**
 * Calculates remaining milliseconds until the curfew ends (morning wake-up time).
 */
export function getNightCurfewRemainingMs(
  config: NightCurfewConfig = DEFAULT_NIGHT_CURFEW_CONFIG,
  nowMs: number = Date.now()
): number {
  const now = new Date(nowMs);
  const endToday = new Date(now);
  endToday.setHours(config.endHour, config.endMinute, 0, 0);

  // If currently after end time (e.g. 10 PM today, end is 6 AM tomorrow), target is tomorrow morning
  if (now.getTime() >= endToday.getTime()) {
    endToday.setDate(endToday.getDate() + 1);
  }

  const diff = endToday.getTime() - now.getTime();
  return Math.max(0, diff);
}

/**
 * Formats 24-hour hour & minute into human-friendly string (e.g. "10:00 PM" or "06:00 AM").
 */
export function formatCurfewTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

/**
 * Formats duration milliseconds into human-readable format like "7h 48m 12s" or "07:48:12".
 */
export function formatCurfewCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Grants a temporary emergency unlock for a fixed period (default 15 mins).
 */
export function grantEmergencyUnlock(
  config: NightCurfewConfig,
  durationMs: number = config.emergencyUnlockDurationMs || 15 * 60 * 1000,
  nowMs: number = Date.now()
): NightCurfewConfig {
  return {
    ...config,
    emergencyUnlockedUntil: nowMs + durationMs,
  };
}

/**
 * Revokes the emergency unlock and restores instant phone lockdown.
 */
export function revokeEmergencyUnlock(config: NightCurfewConfig): NightCurfewConfig {
  return {
    ...config,
    emergencyUnlockedUntil: null,
  };
}

/**
 * Step-by-step native OS setup instructions for iOS & Android
 * to enforce physical phone hardware lockdown of third-party apps.
 */
export interface OsLockdownGuide {
  os: "ios" | "android";
  title: string;
  badge: string;
  steps: Array<{
    step: number;
    title: string;
    detail: string;
    settingPath: string;
  }>;
}

export const OS_LOCKDOWN_GUIDES: Record<"ios" | "android", OsLockdownGuide> = {
  ios: {
    os: "ios",
    title: "Apple iOS (iPhone) Hardware Lockdown",
    badge: "Screen Time + Focus Automation",
    steps: [
      {
        step: 1,
        title: "Enable Screen Time Downtime at 10:00 PM",
        detail:
          "Open Settings > Screen Time > Downtime. Toggle 'Scheduled' ON. Set From: 10:00 PM, To: 06:00 AM. Turn ON 'Block at Downtime'.",
        settingPath: "Settings > Screen Time > Downtime",
      },
      {
        step: 2,
        title: "Whitelist Only Essential Apps",
        detail:
          "In Settings > Screen Time > Always Allowed, select only: Phone, Messages, and Settings. Remove Instagram, YouTube, X, Reddit, and all browsers.",
        settingPath: "Settings > Screen Time > Always Allowed",
      },
      {
        step: 3,
        title: "Set Sleep Focus with Clean Home Screen",
        detail:
          "In Settings > Focus > Sleep, schedule automatically from 10:00 PM to 6:00 AM. Configure a dedicated Home Screen page containing ONLY Phone, Messages, and Clock widgets.",
        settingPath: "Settings > Focus > Sleep",
      },
      {
        step: 4,
        title: "Optional: Ask a Partner / Accountability Friend for a Passcode",
        detail:
          "Under Screen Time > Lock Screen Time Settings, have an accountability partner enter a 4-digit code so you cannot impulsively bypass your 10:00 PM curfew.",
        settingPath: "Settings > Screen Time > Lock Settings",
      },
    ],
  },
  android: {
    os: "android",
    title: "Android (Samsung / Pixel / OnePlus) Bedtime Lockdown",
    badge: "Digital Wellbeing & Routines",
    steps: [
      {
        step: 1,
        title: "Enable Bedtime Mode at 10:00 PM",
        detail:
          "Open Settings > Digital Wellbeing & Parental Controls > Bedtime Mode. Schedule from 10:00 PM to 06:00 AM. Turn ON Grayscale screen and Do Not Disturb.",
        settingPath: "Settings > Digital Wellbeing > Bedtime Mode",
      },
      {
        step: 2,
        title: "Configure App Limits / Focus Mode",
        detail:
          "In Digital Wellbeing > Focus Mode, create 'Night Lockdown'. Select all social apps, games, and video apps. Set daily timer to shut down by 10:00 PM.",
        settingPath: "Settings > Digital Wellbeing > Focus Mode",
      },
      {
        step: 3,
        title: "Samsung Galaxy Modes & Routines (Optional)",
        detail:
          "If using Samsung: Modes & Routines > Sleep Mode. Automatically turn off Always-On Display, turn on Eye Comfort Shield, and restrict background app alerts to Phone and SMS only.",
        settingPath: "Settings > Modes and Routines > Sleep",
      },
      {
        step: 4,
        title: "Only Allow Calls and Messages",
        detail:
          "In Do Not Disturb settings, allow calls and messages only from starred / favorite emergency contacts.",
        settingPath: "Settings > Notifications > Do Not Disturb",
      },
    ],
  },
};
