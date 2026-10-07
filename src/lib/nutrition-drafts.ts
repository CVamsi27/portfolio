import { validateMealDraft, type MealDraft } from "./nutrition-meals.ts";

const DATABASE = "nova-nutrition-drafts-v1";
const STORE = "drafts";

function validScope(scope: string) {
  if (typeof scope !== "string" || !scope.trim() || scope.length > 300)
    throw new Error("Invalid nutrition draft scope.");
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Persistent draft storage is unavailable."));
      return;
    }
    const request = indexedDB.open(DATABASE, 1);
    let rejected = false;
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => {
      if (rejected) request.result.close();
      else resolve(request.result);
    };
    request.onerror = () => reject(new Error(`Draft storage could not open: ${request.error?.message ?? "unknown error"}`));
    request.onblocked = () => {
      rejected = true;
      reject(new Error("Draft storage is blocked by another open tab."));
    };
  });
}

async function operation<T>(scope: string, mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  validScope(scope);
  const db = await open();
  return new Promise((resolve, reject) => {
    let result: T;
    let transaction: IDBTransaction;
    try {
      transaction = db.transaction(STORE, mode);
      const request = run(transaction.objectStore(STORE));
      request.onsuccess = () => { result = request.result; };
      request.onerror = () => { /* The transaction abort reports the durable failure. */ };
      transaction.oncomplete = () => { db.close(); resolve(result); };
      transaction.onabort = transaction.onerror = () => {
        db.close();
        reject(new Error(`Draft storage failed: ${transaction.error?.message ?? "transaction aborted"}`));
      };
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

/** Account scope is mandatory. Corrupt records are reported, never treated as saved drafts. */
export async function readDraft(scope: string): Promise<MealDraft | null> {
  const draft: unknown = await operation(scope, "readonly", (store) => store.get(scope));
  if (draft === undefined) return null;
  if (!validateMealDraft(draft)) throw new Error("Stored meal draft is invalid. Discard it to start again.");
  return draft;
}

export async function writeDraft(scope: string, draft: MealDraft): Promise<void> {
  if (!validateMealDraft(draft)) throw new Error("Invalid meal draft.");
  // Snapshot before opening the asynchronous transaction; later caller edits cannot change this save.
  const snapshot = structuredClone(draft);
  await operation(scope, "readwrite", (store) => store.put(snapshot, scope));
}

export async function deleteDraft(scope: string): Promise<void> {
  await operation(scope, "readwrite", (store) => store.delete(scope));
}
