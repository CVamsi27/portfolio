"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),iframe,[tabindex]:not([tabindex="-1"])';
const dialogs: HTMLElement[] = [];
let originalOverflow = "";
const backgroundState = new Map<
  HTMLElement,
  { inert: boolean; ariaHidden: string | null }
>();

function syncBackground() {
  for (const [element, state] of backgroundState) {
    element.inert = state.inert;
    if (state.ariaHidden === null) element.removeAttribute("aria-hidden");
    else element.setAttribute("aria-hidden", state.ariaHidden);
  }
  backgroundState.clear();
  const top = dialogs.at(-1);
  if (!top) return;
  // Leave only the active dialog and its ancestor path interactive. This also
  // isolates older dialogs when one modal opens another.
  let active: HTMLElement = top;
  while (active.parentElement) {
    const parent = active.parentElement;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === active || !(sibling instanceof HTMLElement)) continue;
      backgroundState.set(sibling, {
        inert: sibling.inert,
        ariaHidden: sibling.getAttribute("aria-hidden"),
      });
      sibling.inert = true;
      sibling.setAttribute("aria-hidden", "true");
    }
    if (parent === document.body) break;
    active = parent;
  }
}

/** Keyboard ownership and scroll locking for portal dialogs, including nesting. */
export function useDialogFocus(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (open) return;
    const remember = () => {
      const active = document.activeElement as HTMLElement | null;
      if (active && !active.closest('[role="dialog"][aria-modal="true"]'))
        openerRef.current = active;
    };
    remember();
    document.addEventListener("focusin", remember);
    return () => document.removeEventListener("focusin", remember);
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const opener = openerRef.current;
    if (dialogs.length === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    dialogs.push(dialog);
    const controls = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) =>
          el.tabIndex >= 0 &&
          el.getClientRects().length > 0 &&
          !el.closest('[inert], [aria-hidden="true"]'),
      );
    if (!dialog.contains(document.activeElement))
      (controls()[0] ?? dialog).focus();
    syncBackground();
    const observer = new MutationObserver(syncBackground);
    observer.observe(document.body, { childList: true, subtree: true });

    const onKey = (event: KeyboardEvent) => {
      if (dialogs.at(-1) !== dialog) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeRef.current();
      } else if (event.key === "Tab") {
        const items = controls();
        const active = document.activeElement;
        if (!items.length) {
          event.preventDefault();
          dialog.focus();
          return;
        }
        if (
          active === dialog ||
          !dialog.contains(active) ||
          (event.shiftKey ? active === items[0] : active === items.at(-1))
        ) {
          event.preventDefault();
          (event.shiftKey ? items.at(-1)! : items[0]).focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      observer.disconnect();
      const index = dialogs.indexOf(dialog);
      if (index >= 0) dialogs.splice(index, 1);
      syncBackground();
      if (!dialogs.length) document.body.style.overflow = originalOverflow;
      if (
        opener?.isConnected &&
        (!dialogs.length || dialogs.at(-1)?.contains(opener))
      )
        opener.focus();
    };
  }, [open]);

  return dialogRef;
}
