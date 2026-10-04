export type DatedRecord = { updatedAt: number; deleted?: boolean };
export function mergeRecords<T extends DatedRecord>(
  local: Record<string, T>,
  remote: Record<string, T>,
): Record<string, T> {
  const merged = { ...remote };
  for (const [id, record] of Object.entries(local))
    if (
      !merged[id] ||
      record.updatedAt > merged[id].updatedAt ||
      (record.updatedAt === merged[id].updatedAt && record.deleted)
    )
      merged[id] = record;
  return merged;
}
export function scopedLocalKey(
  key: string,
  userId: string | null,
  configured: boolean,
  scoped: boolean,
) {
  return scoped && configured
    ? `vk:account:${userId ?? "signed-out"}:${key}`
    : `vk:${key}`;
}
