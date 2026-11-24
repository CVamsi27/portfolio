"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "@/components/common/useDialogFocus";
import { Download, ExternalLink, FileText, X, Mail } from "lucide-react";
import { CONTACT_EMAIL, RESUME_PATH } from "@/lib/const";

const emptySubscribe = () => () => {};

export default function ResumeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const dialogRef = useDialogFocus(open, onClose);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Résumé Viewer"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative flex flex-col w-full max-w-5xl h-[92dvh] max-h-[900px] overflow-hidden border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] text-[var(--portfolio-ink)] animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--portfolio-rule)] bg-[var(--portfolio-surface)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="hidden h-9 w-9 shrink-0 items-center justify-center sm:flex border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] text-[var(--portfolio-ink)]">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-xl font-light tracking-[-0.02em] text-[var(--portfolio-ink)]">
                Vamsi Krishna Chandaluri — Résumé
              </h2>
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--portfolio-muted)]">
                Senior Full Stack Engineer · One-page PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={RESUME_PATH}
              download="VamsiKrishna_Resume"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--portfolio-ink)] bg-[var(--portfolio-ink)] px-4 py-1.5 font-sans text-xs font-medium text-[var(--portfolio-paper)] transition-opacity hover:opacity-85"
              title="Download PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <a
              href={RESUME_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] px-4 py-1.5 font-sans text-xs font-medium text-[var(--portfolio-ink)] transition-colors hover:border-[var(--portfolio-ink)]"
              title="Open PDF in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open in Tab</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] text-[var(--portfolio-muted)] transition-colors hover:border-[var(--portfolio-ink)] hover:text-[var(--portfolio-ink)]"
              aria-label="Close résumé modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Frame */}
        <div className="relative flex-1 w-full bg-[var(--portfolio-wash)] overflow-hidden">
          <iframe
            src={`${RESUME_PATH}#toolbar=1&navpanes=0`}
            title="Vamsi Krishna Chandaluri Resume"
            className="w-full h-full border-0"
          />

          <noscript>
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <p className="text-sm text-[var(--portfolio-muted)]">
                PDF preview requires JavaScript.
              </p>
              <a
                href={RESUME_PATH}
                download
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--portfolio-ink)] bg-[var(--portfolio-ink)] px-4 py-2 text-xs font-medium text-[var(--portfolio-paper)]"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </a>
            </div>
          </noscript>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--portfolio-rule)] bg-[var(--portfolio-surface)] px-5 py-2.5 text-xs text-[var(--portfolio-muted)]">
          <div className="flex items-center gap-3 font-sans">
            <span>Hyderabad, India · Remote full-stack roles</span>
            <span className="hidden sm:inline">·</span>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="hidden sm:inline-flex items-center gap-1 text-[var(--portfolio-ink)] hover:underline"
            >
              <Mail className="h-3 w-3" />
              {CONTACT_EMAIL}
            </a>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em]">
            Press Esc to close
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
