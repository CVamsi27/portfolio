export function parseStoredValue<T>(raw: string | null, initial: T): T {
  if (raw === null) return initial;
  try {
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? initial : (parsed as T);
  } catch {
    return initial;
  }
}
