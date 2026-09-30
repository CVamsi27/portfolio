"use client";

/**
 * Distraction Shield & Germany Goal Guardian Domain Model
 * 
 * Enforces:
 * - Allowlist: buildora.work, notion.com, github.com
 * - Blocklist: social media & distraction platforms
 * - 3-stage behavioral deterrence:
 *   1. Initial Block Screen -> "Remind me of my Germany goals 🇩🇪"
 *   2. Germany Relocation Reality Check -> "Forget your dreams" confirmation
 *   3. 10-Minute Leash -> 1-Hour Strict Lockdown
 */

export const DEFAULT_ALLOWLIST = [
  "buildora.work",
  "study.buildora.work",
  "notion.com",
  "github.com",
];

export const DEFAULT_BLOCKLIST = [
  "x.com",
  "twitter.com",
  "instagram.com",
  "youtube.com",
  "reddit.com",
  "facebook.com",
  "tiktok.com",
  "threads.net",
  "linkedin.com",
  "netflix.com",
  "twitch.tv",
  "discord.com",
];

export interface LeashSession {
  domain: string;
  url: string;
  startedAt: number;
  expiresAt: number; // startedAt + 10 minutes
  lockdownStartsAt: number;
  lockdownExpiresAt: number; // expiresAt + 60 minutes
}

export interface ShieldHistoryEntry {
  id: string;
  timestamp: number;
  domain: string;
  url: string;
  action: "blocked" | "reminded_germany" | "forget_dreams_leash" | "lockdown_blocked" | "returned_to_focus";
}

export interface DistractionShieldState {
  enabled: boolean;
  allowlist: string[];
  blocklist: string[];
  activeLeash: LeashSession | null;
  lockdownUntil: number | null; // Timestamp when 1-hour lockdown expires
  history: ShieldHistoryEntry[];
}

export const DEFAULT_SHIELD_STATE: DistractionShieldState = {
  enabled: true,
  allowlist: DEFAULT_ALLOWLIST,
  blocklist: DEFAULT_BLOCKLIST,
  activeLeash: null,
  lockdownUntil: null,
  history: [],
};

export const LEASH_DURATION_MS = 10 * 60 * 1000; // 10 minutes
export const LOCKDOWN_DURATION_MS = 60 * 60 * 1000; // 1 hour (60 minutes)

/**
 * Extracts normalized hostname from a URL string or domain.
 */
export function extractDomain(input: string): string {
  if (!input) return "";
  let trimmed = input.trim().toLowerCase();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    trimmed = "https://" + trimmed;
  }
  try {
    const url = new URL(trimmed);
    let host = url.hostname;
    if (host.startsWith("www.")) {
      host = host.slice(4);
    }
    return host;
  } catch {
    return input.toLowerCase().replace(/^www\./, "");
  }
}

/**
 * Checks if a given domain or URL is in the allowlist.
 */
export function isDomainAllowed(urlOrDomain: string, allowlist = DEFAULT_ALLOWLIST): boolean {
  const domain = extractDomain(urlOrDomain);
  if (!domain) return true;

  return allowlist.some((allowed) => {
    const normAllowed = extractDomain(allowed);
    return domain === normAllowed || domain.endsWith("." + normAllowed);
  });
}

/**
 * Checks if a given domain or URL is in the blocklist.
 */
export function isDomainBlocked(urlOrDomain: string, blocklist = DEFAULT_BLOCKLIST): boolean {
  const domain = extractDomain(urlOrDomain);
  if (!domain) return false;

  return blocklist.some((blocked) => {
    const normBlocked = extractDomain(blocked);
    return domain === normBlocked || domain.endsWith("." + normBlocked);
  });
}

/**
 * Evaluates whether a destination URL should be intercepted by the shield.
 */
export function shouldInterceptUrl(
  urlOrDomain: string,
  state: DistractionShieldState = DEFAULT_SHIELD_STATE
): boolean {
  if (!state.enabled) return false;
  const domain = extractDomain(urlOrDomain);
  if (!domain) return false;

  // Never intercept allowed domains
  if (isDomainAllowed(domain, state.allowlist)) {
    return false;
  }

  // Intercept if explicitly in blocklist
  return isDomainBlocked(domain, state.blocklist);
}

/**
 * Checks if 1-hour lockdown is currently active.
 */
export function isLockdownActive(state: DistractionShieldState, now = Date.now()): boolean {
  if (!state.lockdownUntil) return false;
  return now < state.lockdownUntil;
}

/**
 * Calculates remaining milliseconds of the 1-hour lockdown.
 */
export function getRemainingLockdownMs(state: DistractionShieldState, now = Date.now()): number {
  if (!state.lockdownUntil) return 0;
  return Math.max(0, state.lockdownUntil - now);
}

/**
 * Checks if a 10-minute temporary leash is currently running.
 */
export function isLeashActive(state: DistractionShieldState, now = Date.now()): boolean {
  if (!state.activeLeash) return false;
  return now >= state.activeLeash.startedAt && now < state.activeLeash.expiresAt;
}

/**
 * Calculates remaining milliseconds of the 10-minute leash.
 */
export function getRemainingLeashMs(state: DistractionShieldState, now = Date.now()): number {
  if (!state.activeLeash) return 0;
  return Math.max(0, state.activeLeash.expiresAt - now);
}

/**
 * Formats milliseconds into mm:ss display string.
 */
export function formatCountdownClock(ms: number): string {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Initiates the 10-minute emergency leash and schedules the subsequent 1-hour lockdown.
 */
export function engage10MinLeash(
  state: DistractionShieldState,
  targetUrl: string,
  now = Date.now()
): DistractionShieldState {
  const domain = extractDomain(targetUrl);
  const expiresAt = now + LEASH_DURATION_MS;
  const lockdownExpiresAt = expiresAt + LOCKDOWN_DURATION_MS;

  const leashSession: LeashSession = {
    domain,
    url: targetUrl,
    startedAt: now,
    expiresAt,
    lockdownStartsAt: expiresAt,
    lockdownExpiresAt,
  };

  const entry: ShieldHistoryEntry = {
    id: `leash-${now}`,
    timestamp: now,
    domain,
    url: targetUrl,
    action: "forget_dreams_leash",
  };

  return {
    ...state,
    activeLeash: leashSession,
    // The 1-hour lockdown extends from the end of the leash
    lockdownUntil: lockdownExpiresAt,
    history: [entry, ...state.history.slice(0, 49)],
  };
}

/**
 * Cancels active leash early when the engineer snaps out and returns to Germany goals.
 */
export function returnToFocusEarly(
  state: DistractionShieldState,
  now = Date.now()
): DistractionShieldState {
  const entry: ShieldHistoryEntry = {
    id: `return-${now}`,
    timestamp: now,
    domain: state.activeLeash?.domain || "browser",
    url: state.activeLeash?.url || "buildora.work",
    action: "returned_to_focus",
  };

  return {
    ...state,
    activeLeash: null,
    history: [entry, ...state.history.slice(0, 49)],
  };
}

/**
 * Generates ready-to-use Tampermonkey / Violentmonkey Userscript for full-browser protection.
 */
export function generateTampermonkeyUserscript(
  blocklist = DEFAULT_BLOCKLIST,
  shieldOrigin = "https://buildora.work"
): string {
  const matchRules = blocklist
    .map((domain) => `// @match        *://*.${domain}/*`)
    .join("\n");

  return `// ==UserScript==
// @name         Buildora Germany Goal Guardian & Distraction Shield
// @namespace    https://buildora.work/
// @version      1.0.0
// @description  Intercepts social media distractions and redirects to your 🇩🇪 Germany relocation goals & focus shield.
// @author       Vamsi Krishna Chandaluri (Buildora)
${matchRules}
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  const targetUrl = encodeURIComponent(window.location.href);
  const shieldUrl = "${shieldOrigin}/roadmap?shield_target=" + targetUrl + "&shield_block=1";
  
  // Replace current page with the Buildora Germany Shield
  window.location.replace(shieldUrl);
})();
`;
}

/**
 * Generates /etc/hosts content for system-level distraction blocking.
 */
export function generateHostsBlockFile(blocklist = DEFAULT_BLOCKLIST): string {
  const rows = blocklist
    .map((domain) => `127.0.0.1  ${domain} www.${domain}`)
    .join("\n");

  return `# === Buildora Germany Focus Shield Blocklist ===
# To activate, run: sudo sh -c 'cat << "EOF" >> /etc/hosts
${rows}
# EOF'
# To restore, simply remove these entries from /etc/hosts.
`;
}
