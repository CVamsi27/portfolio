/**
 * Deep Study & Distraction Prevention Domain Model
 * Supports strict anti-distraction monitoring, attention checking, and progress tracking.
 */

export interface ActiveStudySession {
  id: string;
  chapterId: string;
  chapterTitle: string;
  chapterUrl: string;
  stack: string;
  day: number;
  date: string;
  startedAt: number;
  pausedAt?: number;
  pausedMs: number;
  targetMinutes: number;
  distractionCount: number;
  attentionChecksTotal: number;
  attentionChecksPassed: number;
  strictLockdown: boolean;
  notes: string;
  // Multi-device & Phone Lockdown coordination
  originDeviceId?: string;
  originDeviceType?: "desktop" | "mobile";
  originDeviceName?: string;
  blockMobileDevices?: boolean;
}

export interface CompletedChapterRecord {
  chapterId: string;
  chapterTitle: string;
  stack: string;
  day: number;
  date: string;
  completedAt: string;
  durationMinutes: number;
  distractions: number;
  notes: string;
}

export const MINUTE_MS = 60_000;

/**
 * Calculates current active elapsed study time in milliseconds.
 */
export function getStudyElapsedMs(session: ActiveStudySession, now: number): number {
  const currentPause = session.pausedAt === undefined ? 0 : Math.max(0, now - session.pausedAt);
  const elapsed = now - session.startedAt - session.pausedMs - currentPause;
  return Math.max(0, elapsed);
}

/**
 * Calculates remaining study time for a timed session in milliseconds.
 */
export function getStudyRemainingMs(session: ActiveStudySession, now: number): number {
  const targetMs = session.targetMinutes * MINUTE_MS;
  const elapsed = getStudyElapsedMs(session, now);
  return Math.max(0, targetMs - elapsed);
}

/**
 * Formats milliseconds into mm:ss or hh:mm:ss.
 */
export function formatStudyClock(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1_000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export interface StudyChapterRef {
  id: string;
  title: string;
  studyUrl: string;
  stack?: string;
  estimatedMinutes?: number;
}

export interface NextStudyGoal {
  chapter: StudyChapterRef;
  day: number;
  date: string;
  isToday: boolean;
}

/**
 * Determines the next uncompleted study chapter in sequential order.
 */
export function getNextStudyGoal(
  currentChapterId: string,
  days: Array<{
    day: number;
    date: string;
    chapters: Array<StudyChapterRef>;
  }>,
  completedIds: Set<string>
): NextStudyGoal | null {
  // 1. Flatten all chapters with day context
  const allFlattened: Array<{
    chapter: StudyChapterRef;
    day: number;
    date: string;
  }> = [];

  for (const d of days) {
    for (const ch of d.chapters || []) {
      allFlattened.push({ chapter: ch, day: d.day, date: d.date });
    }
  }

  // 2. Locate current chapter index
  const currentIndex = allFlattened.findIndex((item) => item.chapter.id === currentChapterId);
  const startIndex = currentIndex >= 0 ? currentIndex + 1 : 0;

  // 3. Find first subsequent uncompleted chapter
  for (let i = startIndex; i < allFlattened.length; i++) {
    if (!completedIds.has(allFlattened[i].chapter.id)) {
      const currentDay = currentIndex >= 0 ? allFlattened[currentIndex].day : days[0]?.day;
      return {
        ...allFlattened[i],
        isToday: allFlattened[i].day === currentDay,
      };
    }
  }

  // 4. Fallback: check any remaining uncompleted chapter from the beginning
  for (let i = 0; i < allFlattened.length; i++) {
    if (!completedIds.has(allFlattened[i].chapter.id) && allFlattened[i].chapter.id !== currentChapterId) {
      return {
        ...allFlattened[i],
        isToday: false,
      };
    }
  }

  return null;
}

export interface StudyAnalytics {
  totalCompleted: number;
  totalMinutes: number;
  totalDistractions: number;
  distractionFreePercentage: number;
  completedByStack: Record<string, number>;
}

export function computeStudyAnalytics(records: CompletedChapterRecord[]): StudyAnalytics {
  const totalCompleted = (records || []).length;
  let totalMinutes = 0;
  let totalDistractions = 0;
  let distractionFreeCount = 0;
  const completedByStack: Record<string, number> = {};

  for (const r of records || []) {
    totalMinutes += r.durationMinutes || 0;
    totalDistractions += r.distractions || 0;
    if ((r.distractions || 0) === 0) {
      distractionFreeCount++;
    }
    const stack = r.stack || "General";
    completedByStack[stack] = (completedByStack[stack] || 0) + 1;
  }

  const distractionFreePercentage =
    totalCompleted > 0 ? Math.round((distractionFreeCount / totalCompleted) * 100) : 100;

  return {
    totalCompleted,
    totalMinutes,
    totalDistractions,
    distractionFreePercentage,
    completedByStack,
  };
}

/**
 * Detects whether the current browser client is running on a mobile phone / handheld device.
 */
export function isMobilePhoneDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isNarrowTouch =
    window.innerWidth <= 768 && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  return isMobileUA || isNarrowTouch;
}

/**
 * Returns a persistent unique device identifier stored in localStorage.
 */
export function getClientDeviceId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let id = window.localStorage.getItem("study:client_device_id");
    if (!id) {
      id = "dev_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
      window.localStorage.setItem("study:client_device_id", id);
    }
    return id;
  } catch {
    return "ephemeral_client";
  }
}

/**
 * Returns a human-readable display name for the current hardware/browser.
 */
export function getDeviceDisplayName(): string {
  if (typeof window === "undefined") return "Workstation";
  const ua = navigator.userAgent || "";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android Phone";
  if (/Macintosh|Mac OS X/i.test(ua)) return "Mac Workstation";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Linux/i.test(ua)) return "Linux Workstation";
  return isMobilePhoneDevice() ? "Mobile Device" : "Workstation";
}

