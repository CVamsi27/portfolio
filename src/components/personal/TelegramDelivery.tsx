"use client";

import { useEffect, useId, useState } from "react";
import {
  DEFAULT_CAREER_TELEGRAM_PREFERENCES,
  validCareerTelegramPreferences,
  type CareerTelegramPreferences,
} from "@/lib/career-telegram";
import { useSyncedStorage } from "@/lib/use-synced-storage";

type DeliveryStatus = {
  configured: { telegram: boolean; storage: boolean; dispatcher: boolean };
  ownerAllowed: true;
  delivery: {
    available: boolean;
    scope: "career";
    counts: Record<
      "pending" | "claimed" | "sending" | "sent" | "failed" | "unknown",
      number
    >;
    latestAttemptAt: string | null;
    latestSentAt: string | null;
    latestUnknownAt: string | null;
  };
};

function validStatus(value: unknown): value is DeliveryStatus {
  if (!value || typeof value !== "object") return false;
  const candidate = value as DeliveryStatus;
  return (
    candidate.ownerAllowed === true &&
    [
      candidate.configured?.telegram,
      candidate.configured?.storage,
      candidate.configured?.dispatcher,
    ].every((item) => typeof item === "boolean") &&
    candidate.delivery?.scope === "career" &&
    typeof candidate.delivery.available === "boolean" &&
    ["pending", "claimed", "sending", "sent", "failed", "unknown"].every(
      (key) => {
        const count =
          candidate.delivery.counts?.[
            key as keyof DeliveryStatus["delivery"]["counts"]
          ];
        return Number.isSafeInteger(count) && count >= 0;
      },
    ) &&
    [
      candidate.delivery.latestAttemptAt,
      candidate.delivery.latestSentAt,
      candidate.delivery.latestUnknownAt,
    ].every(
      (item) =>
        item === null ||
        (typeof item === "string" && Number.isFinite(Date.parse(item))),
    )
  );
}

export default function TelegramDelivery() {
  const { value, setValue, status, user } = useSyncedStorage<unknown>(
    "career:telegram-preferences",
    DEFAULT_CAREER_TELEGRAM_PREFERENCES,
  );
  const valid = validCareerTelegramPreferences(value);
  const preferences = valid ? value : DEFAULT_CAREER_TELEGRAM_PREFERENCES;
  const id = useId();
  const [saveError, setSaveError] = useState("");
  const [checked, setChecked] = useState<{
    account: string | null;
    message?: string;
    status?: DeliveryStatus;
  } | null>(null);
  const account = user?.id ?? null;
  const server = checked?.account === account ? checked : null;

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/telegram/status", {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body: unknown = await response.json().catch(() => null);
        if (controller.signal.aborted) return;
        if (response.ok && validStatus(body)) {
          setChecked({ account, status: body });
        } else {
          setChecked({
            account,
            message:
              response.status === 401
                ? "Sign in to check server delivery."
                : response.status === 403
                  ? "Career Telegram delivery is available only for the configured private owner."
                  : "Server delivery status is unavailable.",
          });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setChecked({
            account,
            message: "Server delivery status is unavailable.",
          });
      });
    return () => controller.abort();
  }, [account]);

  function save(next: CareerTelegramPreferences) {
    try {
      setValue(next, { immediate: true });
      setSaveError("");
    } catch {
      setSaveError(
        "Career settings could not be saved on this device. Try again before closing this page.",
      );
    }
  }

  const syncMessage =
    status === "synced"
      ? "Cloud sync is up to date. Server delivery uses the cloud preference."
      : status === "syncing"
        ? "Saving career settings to your account…"
        : status === "error"
          ? "Career settings are saved on this device; cloud sync needs attention."
          : "Device-only settings. Server delivery requires cloud sync.";
  const delivery = server?.status?.delivery;
  const configured = server?.status?.configured;

  return (
    <div className="space-y-3 rounded-lg bg-muted/40 p-3">
      <h3 className="font-semibold">Telegram delivery</h3>
      <p className="text-sm text-muted-foreground">
        The server sends reminders to the configured private Telegram chat. No
        browser permission or device subscription is needed.
      </p>
      <label
        htmlFor={`${id}-enabled`}
        className="flex items-center gap-2 text-sm font-medium"
      >
        <input
          id={`${id}-enabled`}
          type="checkbox"
          checked={preferences.enabled}
          onChange={(event) =>
            save({
              ...preferences,
              enabled: event.target.checked,
              enabledAt: event.target.checked ? new Date().toISOString() : null,
            })
          }
          className="size-4 accent-primary"
        />
        Career Telegram reminders
      </label>
      <div className="space-y-1">
        <label htmlFor={`${id}-cadence`} className="text-sm">
          Career reminder cadence
        </label>
        <select
          id={`${id}-cadence`}
          value={preferences.cadence}
          onChange={(event) => {
            const cadence = event.target
              .value as CareerTelegramPreferences["cadence"];
            save({
              ...preferences,
              cadence,
              enabledAt:
                preferences.enabled &&
                preferences.cadence === "digest-only" &&
                cadence === "digest-and-learning"
                  ? new Date().toISOString()
                  : preferences.enabledAt,
            });
          }}
          className="block w-full rounded-md border border-border bg-background p-2 text-sm"
        >
          <option value="digest-and-learning">
            Daily digest + study/project blocks
          </option>
          <option value="digest-only">Daily digest only</option>
        </select>
      </div>
      <p className="text-xs text-muted-foreground">
        Digest at {preferences.digestTime} IST. Study/project alerts follow the
        dated plan. Sundays are off. Only future occurrences after opt-in are
        eligible; reminders more than {preferences.catchUpMinutes} minutes late
        are skipped.
      </p>
      {!valid && (
        <p role="alert" className="text-xs text-destructive">
          Saved career settings could not be read. Career delivery stays off
          until you save new settings.
        </p>
      )}
      <p role="status" className="text-xs text-muted-foreground">
        {syncMessage}
      </p>
      {saveError && (
        <p role="alert" className="text-xs text-destructive">
          {saveError}
        </p>
      )}
      <div
        className="space-y-1 border-t border-border pt-2 text-xs text-muted-foreground"
        aria-live="polite"
      >
        {!server && <p>Checking server delivery status…</p>}
        {server?.message && <p>{server.message}</p>}
        {configured && (
          <p>
            {Object.values(configured).every(Boolean)
              ? "Server configuration is present. Scheduled delivery still needs verification."
              : "Server configuration is incomplete. Scheduled delivery is unavailable."}
          </p>
        )}
        {delivery && !delivery.available && (
          <p>
            Delivery history is unavailable. Check the server migration and
            storage connection.
          </p>
        )}
        {delivery?.available && (
          <>
            <p>
              Provider accepted: {delivery.counts.sent} · Unknown:{" "}
              {delivery.counts.unknown}
            </p>
            <p>
              Waiting: {delivery.counts.pending + delivery.counts.claimed} ·
              Sending: {delivery.counts.sending} · Failed:{" "}
              {delivery.counts.failed}
            </p>
            {delivery.latestSentAt && (
              <p>
                Last provider acceptance:{" "}
                {new Intl.DateTimeFormat("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(delivery.latestSentAt))}{" "}
                IST.
              </p>
            )}
            {delivery.counts.unknown > 0 && (
              <p>Unknown attempts require review before any replay.</p>
            )}
          </>
        )}
        <p>Provider acceptance does not confirm receipt on your phone.</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Routine and in-app reminder settings remain separate. Career opt-in
        applies to this account only. Restoring a backup keeps career delivery
        off until you explicitly enable it again.
      </p>
    </div>
  );
}
