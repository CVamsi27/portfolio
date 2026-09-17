/** Request browser fullscreen after an explicit user gesture when supported. */
export async function enterFullscreen(element: HTMLElement): Promise<boolean> {
  if (typeof element.requestFullscreen !== "function") return false;

  try {
    await element.requestFullscreen();
    return true;
  } catch {
    return false;
  }
}

/** Leave browser fullscreen when the current browser supports the API. */
export async function exitFullscreen(): Promise<void> {
  if (typeof document === "undefined" || typeof document.exitFullscreen !== "function") return;

  try {
    await document.exitFullscreen();
  } catch {
    // A browser can reject this when fullscreen has already been exited.
  }
}

export function focusModeLabel(active: boolean): string {
  return active ? "Exit Focus Mode" : "Enter Focus Mode";
}
