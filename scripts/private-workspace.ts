/** Explicit authoring/release CLIs may write personal data only in its canonical home. */
import { realpathSync, lstatSync } from "node:fs";
import { homedir } from "node:os";
import { resolve, dirname, basename, sep } from "node:path";

export function assertPrivateWorkspacePath(path: string): string {
  try {
    const root = realpathSync(resolve(homedir(), "repos", "personal"));
    const actual = realpathSync(resolve(path));
    if (actual === root || actual.startsWith(root + sep)) return actual;
  } catch {
    // Missing paths and symlinks outside the canonical root are rejected together.
  }
  throw new Error("Path must resolve inside the canonical private workspace");
}

export function assertFreshPrivateOutputPath(path: string): string {
  const actual = resolve(
    assertPrivateWorkspacePath(dirname(resolve(path))),
    basename(path),
  );
  try {
    lstatSync(actual);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return actual;
    throw error;
  }
  throw new Error("Every output must be a fresh private file");
}
