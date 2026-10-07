"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-store";
import {
  parseHealthArchive,
  type HealthArchive,
} from "@/lib/health-connect-transfer";
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
async function request(path: string, body?: unknown, owner?: string) {
  const session = await getSupabase()?.auth.getSession();
  if (owner && session?.data.session?.user.id !== owner)
    throw Error("Sign in to manage your health imports.");
  const response = await fetch(`/api/health-connect/${path}`, {
    method: body ? "POST" : "GET",
    cache: "no-store",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(owner && session?.data.session
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
  const { user } = useAuth();
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const ownerRequest = useCallback(
    (path: string, body?: unknown) => request(path, body, user?.id),
    [user?.id],
  );
  const [archive, setArchive] = useState<HealthArchive | null>(null);
  const [deletion, setDeletion] = useState<"date" | "all" | "source" | null>(
    null,
  );
  const [deleteSource, setDeleteSource] = useState("");
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
        ownerRequest("devices"),
        ownerRequest(`records?from=${date}&to=${date}&limit=100`),
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
  }, [date, ownerRequest]);
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
      await ownerRequest("claim", { code: code.trim() });
      if (!alive.current) return;
      setCode("");
      setConsent(false);
      setMessage(
        "Device connected. Open the companion on your phone and tap Sync now.",
      );
      await refresh();
    } catch (cause) {
      if (!alive.current) return;
      setError(
        cause instanceof Error ? cause.message : "Device was not connected.",
      );
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function revoke() {
    if (!pending || busy) return;
    setBusy(true);
    setError("");
    try {
      await ownerRequest("revoke", { deviceId: pending });
      if (!alive.current) return;
      setPending(null);
      setMessage(
        "Device disconnected. Previously imported records are retained.",
      );
      await refresh();
    } catch (cause) {
      if (!alive.current) return;
      setError(
        cause instanceof Error ? cause.message : "Device was not disconnected.",
      );
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function perform(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      if (alive.current)
        setError(e instanceof Error ? e.message : "Health operation failed.");
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function exportImports() {
    await perform(async () => {
      const data = parseHealthArchive(await ownerRequest("export"));
      if (!alive.current) return;
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `nova-health-imports-${date}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage(
        `Exported all ${data.records.length} stored source records, including deleted records. No device credentials included.`,
      );
    });
  }
  async function restoreImports() {
    if (!archive) return;
    await perform(async () => {
      const result = await ownerRequest("restore", archive);
      if (!alive.current) return;
      setArchive(null);
      setMessage(
        `Restored ${result.count} source records to your signed-in account. Devices were not connected.`,
      );
      await refresh();
    });
  }
  async function deleteImports() {
    if (!deletion) return;
    await perform(async () => {
      const result = await ownerRequest("delete", {
        confirm: "DELETE IMPORTS",
        ...(deletion === "date" ? { from: date, to: date } : {}),
        ...(deletion === "source" ? { source: deleteSource } : {}),
      });
      if (!alive.current) return;
      setDeletion(null);
      setMessage(
        `Deleted ${result.count} imported records. Phone replays of deleted records remain blocked. New records can still sync; manual logs are unchanged.`,
      );
      await refresh();
    });
  }
  async function loadMore() {
    await perform(async () => {
      const token = generation.current;
      const data = await ownerRequest(
        `records?from=${date}&to=${date}&limit=100&offset=${records.length}`,
      );
      if (!alive.current || token !== generation.current) return;
      setRecords((prev) => [...prev, ...data.records]);
      setTotal(data.total);
    });
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
            Showing {records.length} of {total} source records for this date.
            <Button
              variant="outline"
              disabled={busy || loading}
              onClick={() => void loadMore()}
            >
              Load more imported records
            </Button>
          </p>
        )}
      </section>
      <section className="workspace-panel space-y-3">
        <h2>Manage imported health data</h2>
        <p className="text-sm text-muted-foreground">
          Export includes every stored record and deletion marker. Archives
          support up to 5,000 records and 20 MB; larger exports report an error
          instead of saving an incomplete file. Restore keeps source labels and
          never reconnects devices. Conflicting source records must be reviewed
          before restore.
        </p>
        <Button
          variant="outline"
          disabled={busy || loading || !loadedDate}
          onClick={() => void exportImports()}
        >
          Export all health imports
        </Button>
        <label className="field-label">
          Restore health archive
          <input
            type="file"
            accept="application/json,.json"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              void perform(async () => {
                if (file.size > 20000000)
                  throw Error("Choose a health archive smaller than 20 MB.");
                const data = parseHealthArchive(JSON.parse(await file.text()));
                if (alive.current) setArchive(data);
              });
            }}
          />
        </label>
        {archive && (
          <div className="space-y-2">
            <p>
              Review restore: {archive.records.length} source records (
              {archive.records.filter((r) => r.deleted).length} deleted),
              exported {new Date(archive.exportedAt).toLocaleString()}. Restore
              to this signed-in account?
            </p>
            <Button disabled={busy} onClick={() => void restoreImports()}>
              Confirm restore health imports
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setArchive(null)}
            >
              Cancel restore
            </Button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={busy || loading || !loadedDate}
            onClick={() => setDeletion("date")}
          >
            Delete imports for {date}
          </Button>
          <Button
            variant="outline"
            disabled={busy || loading || !loadedDate}
            onClick={() => setDeletion("all")}
          >
            Delete all health imports
          </Button>
          <Button
            variant="outline"
            disabled={busy || loading || !loadedDate}
            onClick={() => setDeletion("source")}
          >
            Delete imports by source
          </Button>
        </div>
        {deletion && (
          <div className="space-y-2">
            {deletion === "source" && (
              <label className="field-label">
                Exact source name
                <Input
                  value={deleteSource}
                  onChange={(e) => setDeleteSource(e.target.value)}
                />
              </label>
            )}
            <p>
              Delete{" "}
              {deletion === "all"
                ? "all imported health data"
                : deletion === "date"
                  ? `imports dated ${date}`
                  : `imports from ${deleteSource || "the selected source"}`}
              ? This blocks phone replays of the deleted records. New records
              can still sync. Manual logs remain separate. You can explicitly
              restore an archive; disconnecting devices is a separate action.
            </p>
            <Button
              disabled={busy || (deletion === "source" && !deleteSource.trim())}
              onClick={() => void deleteImports()}
            >
              Confirm delete health imports
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setDeletion(null)}
            >
              Cancel deletion
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
