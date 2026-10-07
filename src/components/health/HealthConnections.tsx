"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-store";
import { getSupabase } from "@/lib/supabase/client";

type Device = {
  id: string;
  label: string;
  lastSyncAt: string | null;
  revokedAt?: string | null;
  pairedAt?: string;
};
type ImportedRecord = {
  id: string;
  deviceId?: string;
  type: "weight" | "steps" | "sleep";
  date: string;
  value: number;
  unit: string;
  source: string;
  measuredAt: string;
  deleted?: boolean;
  measurementKind?: string;
};
async function request(path: string, body?: unknown) {
  const session = await getSupabase()?.auth.getSession();
  const response = await fetch(`/api/health-connect/${path}`, {
    method: body ? "POST" : "GET",
    cache: "no-store",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(session?.data.session
        ? { Authorization: `Bearer ${session.data.session.access_token}` }
        : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok)
    throw Error(data.error ?? "Health connection unavailable. Try again.");
  return data;
}
export default function HealthConnections({ date }: { date: string }) {
  const { user, configured } = useAuth();
  return (
    <HealthConnectionWorkspace
      key={configured ? (user?.id ?? "signed-out") : "local"}
      date={date}
    />
  );
}
function HealthConnectionWorkspace({ date }: { date: string }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [records, setRecords] = useState<ImportedRecord[]>([]);
  const [code, setCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [total, setTotal] = useState(0);
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const token = ++generation.current;
    setLoading(true);
    try {
      const [deviceData, recordData] = await Promise.all([
        request("devices"),
        request(`records?from=${date}&to=${date}&limit=100`),
      ]);
      if (token !== generation.current) return;
      setLoadedDate(date);
      setDevices(deviceData.devices);
      setRecords(
        recordData.records.filter((record: ImportedRecord) => !record.deleted),
      );
      setTotal(recordData.total ?? recordData.records.length);
      setError("");
    } catch (cause) {
      if (token === generation.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load health records.",
        );
    } finally {
      if (token === generation.current) setLoading(false);
    }
  }, [date]);
  useEffect(() => {
    void refresh();
    return () => {
      // Numeric cancellation token, not a DOM ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
    };
  }, [refresh]);
  async function claim() {
    if (!consent || !code.trim() || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await request("claim", { code: code.trim() });
      setCode("");
      setConsent(false);
      setMessage(
        "Device connected. Open the companion on your phone and tap Sync now.",
      );
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Device was not connected.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function revoke() {
    if (!pending || busy) return;
    setBusy(true);
    setError("");
    try {
      await request("revoke", { deviceId: pending });
      setPending(null);
      setMessage(
        "Device disconnected. Previously imported records are retained.",
      );
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Device was not disconnected.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <section className="workspace-panel space-y-4">
        <h2>Android Health Connect</h2>
        <p className="text-sm text-muted-foreground">
          Connect the NOVA Android companion to import weight, daily steps and
          sleep. Source apps must write these records to Health Connect first.
        </p>
        <ol className="list-decimal pl-5 text-sm space-y-2">
          <li>Open the companion on your phone and grant read permissions.</li>
          <li>
            Create a pairing code on the phone, then enter it here while signed
            in.
          </li>
          <li>
            After connecting, tap Sync now on the phone. Sync currently runs
            while the app is open.
          </li>
        </ol>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void claim();
          }}
        >
          <label className="field-label">
            Pairing code
            <Input
              autoComplete="off"
              value={code}
              maxLength={16}
              placeholder="16-character code from your phone"
              onChange={(event) => setCode(event.target.value)}
            />
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              className="mt-1 h-4 w-4 shrink-0"
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            Allow this device to import weight, steps and sleep read-only
          </label>
          <Button type="submit" disabled={busy || !consent || !code.trim()}>
            Connect device
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Pairing codes expire after ten minutes. Disconnecting stops future
          imports; it retains historical records. Manual logs are kept
          separately.
        </p>
      </section>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <section className="workspace-panel space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2>Devices</h2>
          <Button
            variant="outline"
            disabled={loading || busy}
            onClick={() => void refresh()}
          >
            Refresh connection
          </Button>
        </div>
        {loading ? (
          <p role="status">Loading connections…</p>
        ) : loadedDate &&
          devices.filter((device) => !device.revokedAt).length === 0 ? (
          <p>No device connected.</p>
        ) : (
          devices
            .filter((device) => !device.revokedAt)
            .map((device) => (
              <div
                key={device.id}
                className="border-t border-border pt-3 space-y-2"
              >
                <h3 className="font-medium">{device.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {device.lastSyncAt
                    ? `Last sync: ${new Date(device.lastSyncAt).toLocaleString()}`
                    : "Waiting for the first sync from your phone."}
                </p>
                {pending === device.id ? (
                  <div className="space-y-2">
                    <p className="text-sm">
                      Stop this device from importing new records?
                    </p>
                    <div className="flex gap-2">
                      <Button disabled={busy} onClick={() => void revoke()}>
                        Confirm disconnect
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() => setPending(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => setPending(device.id)}
                    aria-label={`Disconnect ${device.label}`}
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            ))
        )}
      </section>
      <section className="workspace-panel space-y-3">
        <h2>Imported records · {date}</h2>
        <p className="text-sm text-muted-foreground">
          These are source records. They do not overwrite manual weigh-ins or
          sleep logs.
        </p>
        {!loading && loadedDate === date && !records.length && (
          <p>No imported records for this date.</p>
        )}
        {(loadedDate === date ? records : []).map((record) => (
          <div
            key={`${record.deviceId ?? ""}:${record.id}`}
            className="border-t border-border pt-3 flex flex-wrap justify-between gap-2"
          >
            <div>
              <strong className="capitalize">{record.type}</strong>
              <p className="text-sm">
                {record.value} {record.unit}
              </p>
              <p className="text-xs text-muted-foreground">{record.source}</p>
              {record.measurementKind && (
                <p className="text-xs text-muted-foreground">
                  {record.measurementKind.replaceAll("-", " ")}
                </p>
              )}
            </div>
            <time
              className="text-xs text-muted-foreground"
              dateTime={record.measuredAt}
            >
              {new Date(record.measuredAt).toLocaleTimeString()}
            </time>
          </div>
        ))}
        {loadedDate === date && total > records.length && (
          <p className="text-sm">
            Showing the first {records.length} of {total} source records for
            this date.
          </p>
        )}
      </section>
    </div>
  );
}
