"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("focus", onChange);
  window.addEventListener("notification-permission-change", onChange);
  return () => {
    window.removeEventListener("focus", onChange);
    window.removeEventListener("notification-permission-change", onChange);
  };
}
function snapshot(): NotificationPermission | "unsupported" {
  return "Notification" in window ? Notification.permission : "unsupported";
}
const serverSnapshot = () => "unsupported" as const;

/** Browser capability is read after hydration; permission is requested only by actions. */
export function useNotificationPermission() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
export function refreshNotificationPermission() {
  window.dispatchEvent(new Event("notification-permission-change"));
}
