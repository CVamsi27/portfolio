"use client";
import Link from "next/link";
import Modal from "@/components/trackers/Modal";
import { Button } from "@/components/ui/button";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import {
  DEFAULT_SHIELD_STATE,
  extractDomain,
  type DistractionShieldState,
} from "@/lib/distraction-shield";
export default function DistractionShieldModal({
  open,
  targetUrl,
  onClose,
  onProceedAnyway,
}: {
  open: boolean;
  targetUrl: string;
  onClose: () => void;
  onProceedAnyway?: (url: string) => void;
}) {
  const store = useSyncedStorage<DistractionShieldState>(
    "distraction_shield_state",
    DEFAULT_SHIELD_STATE,
  );
  const valid = /^https?:\/\//.test(targetUrl);
  const domain = extractDomain(targetUrl);
  const record = (action: "blocked" | "returned_to_focus") =>
    store.setValue((previous) => ({
      ...previous,
      history: [
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          domain,
          url: targetUrl,
          action,
        },
        ...(previous.history ?? []),
      ].slice(0, 200),
    }));
  return (
    <Modal open={open} title="Take a moment" onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        Your optional distraction guard flagged {domain || "this link"}. Choose
        what helps you now.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            record("returned_to_focus");
            onClose();
          }}
        >
          Keep working
        </Button>
        {valid && (
          <Button asChild variant="outline">
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                record("blocked");
                onProceedAnyway?.(targetUrl);
                onClose();
              }}
            >
              Open link
            </a>
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            store.setValue((previous) => ({
              ...previous,
              enabled: false,
              activeLeash: null,
              lockdownUntil: null,
            }));
            onClose();
          }}
        >
          Turn guard off
        </Button>
        <Button asChild variant="ghost">
          <Link href="/motivation" onClick={onClose}>
            My goal
          </Link>
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        This guard only prompts for links inside NOVA. It cannot control other
        apps.
      </p>
    </Modal>
  );
}
