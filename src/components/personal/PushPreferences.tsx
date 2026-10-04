"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
export default function PushPreferences() {
  const [message, setMessage] = useState(
    "In-app only. Enable notifications to check background delivery support.",
  );
  const [busy, setBusy] = useState(false);
  const [detailed, setDetailed] = useState(false);
  const { user } = useAuth();
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (
        !user ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      )
        return;
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) return;
      const session = await getSupabase()?.auth.getSession();
      if (!session?.data.session) return;
      const response = await fetch("/api/push/subscription", {
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });
      if (!response.ok) {
        if (!cancelled)
          setMessage(
            "Delivery unavailable: subscription status could not be confirmed.",
          );
        return;
      }
      const data = await response.json();
      const saved = data.subscriptions.find(
        (item: { endpoint: string; detailed: boolean }) =>
          item.endpoint === subscription.endpoint,
      );
      if (saved && !cancelled) {
        setDetailed(saved.detailed);
        setMessage(
          "Notifications enabled on this device. System delivery may be delayed.",
        );
      }
    })().catch(() => {
      if (!cancelled)
        setMessage("Delivery unavailable. In-app reminders still work.");
    });
    return () => {
      cancelled = true;
    };
  }, [user]);
  const enable = async () => {
    setBusy(true);
    try {
      if (
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      )
        throw new Error(
          "Delivery unavailable in this browser. In-app reminders still work.",
        );
      const config = await fetch("/api/push/config").then((response) =>
        response.json(),
      );
      if (!config.publicKey)
        throw new Error("Delivery unavailable: server push is not configured.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted")
        throw new Error("Permission denied. In-app reminders still work.");
      const session = await getSupabase()?.auth.getSession();
      if (!session?.data.session)
        throw new Error("Sign in to enable private notifications.");
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: Uint8Array.from(
            atob(config.publicKey.replace(/-/g, "+").replace(/_/g, "/")),
            (c) => c.charCodeAt(0),
          ),
        }));
      const response = await fetch("/api/push/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
        body: JSON.stringify({ subscription: subscription.toJSON(), detailed }),
      });
      if (!response.ok)
        throw new Error(
          "Subscription could not be saved. In-app reminders still work.",
        );
      setMessage(
        "Notifications enabled. Browser/system delivery may be delayed.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Delivery unavailable.");
    } finally {
      setBusy(false);
    }
  };
  const disable = async () => {
    setBusy(true);
    try {
      const subscription = await (
        await navigator.serviceWorker.ready
      ).pushManager.getSubscription();
      const session = await getSupabase()?.auth.getSession();
      if (subscription && session?.data.session) {
        const response = await fetch("/api/push/subscription", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        if (!response.ok)
          throw new Error("Could not remove subscription. Try again.");
      }
      if (subscription) await subscription.unsubscribe();
      setMessage("In-app only. Notifications disabled on this device.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to disable.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-lg bg-muted/40 p-3 space-y-2">
      <h3 className="font-semibold">Notification delivery</h3>
      <p role="status" className="text-sm text-muted-foreground">
        {message}
      </p>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={detailed}
          onChange={(e) => setDetailed(e.target.checked)}
        />
        Show meal/supplement details on the lock screen
      </label>
      <div className="flex flex-wrap gap-2">
        <Button onClick={enable} disabled={busy}>
          {busy ? "Checking…" : "Enable notifications"}
        </Button>
        <Button variant="outline" onClick={disable} disabled={busy}>
          Disable on this device
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Your requested 10 PM reminder is not suppressed by NOVA bedtime mode.
        Device quiet hours may still affect delivery.
      </p>
    </div>
  );
}
