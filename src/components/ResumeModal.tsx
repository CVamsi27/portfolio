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
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative flex flex-col w-full max-w-5xl h-[92dvh] max-h-[900px] overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="hidden h-9 w-9 shrink-0 items-center justify-center sm:flex rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-foreground">
                Vamsi Krishna Chandaluri — Résumé
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                Senior Full Stack &amp; Systems Engineer · PDF Document
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={RESUME_PATH}
              download="VamsiKrishna_Resume"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              title="Download PDF"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <a
              href={RESUME_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              title="Open PDF in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open in Tab</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close résumé modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Frame */}
        <div className="relative flex-1 w-full bg-muted/30 overflow-hidden">
          <iframe
            src={`${RESUME_PATH}#toolbar=1&navpanes=0`}
            title="Vamsi Krishna Chandaluri Resume"
            className="w-full h-full border-0"
          />

          <noscript>
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <p className="text-sm text-muted-foreground">
                PDF preview requires JavaScript.
              </p>
              <a
                href={RESUME_PATH}
                download
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </a>
            </div>
          </noscript>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 px-5 py-2.5 bg-muted/10 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Bangalore, India · Open to Relocation (Germany)</span>
            <span className="hidden sm:inline">·</span>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="hidden sm:inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Mail className="h-3 w-3" />
              {CONTACT_EMAIL}
            </a>
          </div>
          <span className="font-mono text-[10px]">Press Esc to close</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
