import { isDeepStrictEqual } from "node:util";
type Row = { user_id: string; key: string; value: unknown };
type Failure = { code?: string; message: string } | null;
type Client = {
  rpc: (name: string, args: { p_user_id: string; p_rows: Row[] }) => PromiseLike<{ data?: unknown; error: Failure }>;
  from: (table: string) => { upsert: (rows: Row[], options: { onConflict: string }) => PromiseLike<{ error: Failure }> };
};

export async function applyCareerRows(client: Client, owner: string, rows: Row[]): Promise<string> {
  const result = await client.rpc("sync_career_roadmap", { p_user_id: owner, p_rows: rows });
  if (!result.error) {
    if (result.data !== rows.length) throw new Error(`Atomic sync applied ${String(result.data)} rows; expected ${rows.length}.`);
    return "rpc";
  }
  if (!["PGRST202", "42883"].includes(result.error.code ?? "")) throw new Error(`Atomic career sync failed: ${result.error.message}`);
  // PostgREST bulk upsert is one SQL statement/transaction, never five writes.
  const updatedAt = new Date().toISOString();
  const bulk = await client.from("tracker_data").upsert(rows.map(row => ({ ...row, updated_at: updatedAt })), { onConflict: "user_id,key" });
  if (bulk.error) throw new Error(`Atomic bulk upsert failed: ${bulk.error.message}`);
  return "bulk-upsert";
}

export function verifyCareerReadback(expected: Row[], actual: Array<{ key: string; value: unknown }>): void {
  const values = new Map(actual.map(row => [row.key, row.value]));
  if (actual.length !== expected.length || expected.some(row => !values.has(row.key) || !isDeepStrictEqual(values.get(row.key), row.value))) {
    throw new Error("Database readback did not match every validated planner value.");
  }
}
