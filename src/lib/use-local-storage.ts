/** Byte size of localStorage (UTF-16). Pure read — safe to call during render. */
export function storageUsageBytes(): number {
  try {
    let total = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k) continue;
      total += (k.length + (window.localStorage.getItem(k)?.length ?? 0)) * 2;
    }
    return total;
  } catch {
    return 0;
  }
}
