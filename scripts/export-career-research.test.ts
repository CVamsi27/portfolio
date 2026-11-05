import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(homedir(), "repos", "personal");
const script = fileURLToPath(
  new URL("./export-career-research.ts", import.meta.url),
);
const role = {
  id: "synthetic-role",
  company: "Example Engineering",
  title: "Full-stack engineer",
  roleUrl: "https://example.test/jobs/one",
  kind: "employment",
  location: "India remote",
  availability: "uncertain",
  checkedOn: "2026-11-04",
  eligibility: "clarify",
  eligibilityEvidence: "Confirm residence eligibility.",
  fit: ["React"],
  gaps: [],
  questions: ["Can India residents apply?"],
  suggestedAction: "Ask eligibility",
  rank: 1,
  compensation: "Unconfirmed",
  contacts: [],
  draft: "Unsent draft",
  updatedAt: 1,
};
const snapshot = {
  schemaVersion: 1,
  exportedAt: "2026-11-05T00:00:00Z",
  roles: [role],
};
const run = (...args: string[]) =>
  spawnSync(process.execPath, ["--experimental-strip-types", script, ...args], {
    encoding: "utf8",
  });

test("export validates a curated selection, reconciles exact liveness URLs and writes only a fresh private file", () => {
  const dir = mkdtempSync(join(root, ".career-export-test-"));
  try {
    const input = join(dir, "input.json"),
      output = join(dir, "output.json"),
      live = join(dir, "liveness.json");
    writeFileSync(input, JSON.stringify(snapshot));
    writeFileSync(
      live,
      JSON.stringify({
        asOfClientDate: "2026-11-05",
        results: [
          { url: role.roleUrl, status: "active", method: "public ATS API" },
          { url: "https://example.test/jobs/unselected", status: "active" },
        ],
      }),
    );
    const result = run(
      `--input=${input}`,
      `--output=${output}`,
      `--liveness=${live}`,
    );
    assert.equal(result.status, 0, result.stderr);
    const exported = JSON.parse(readFileSync(output, "utf8"));
    assert.equal(exported.schemaVersion, 1);
    assert.equal(exported.roles.length, 1);
    assert.equal(exported.roles[0].availability, "active");
    assert.equal(exported.roles[0].checkedOn, "2026-11-05");
    assert.equal(exported.roles[0].eligibility, "clarify");
    assert.equal(statSync(output).mode & 0o777, 0o600);
    const before = readFileSync(output, "utf8");
    assert.notEqual(run(`--input=${input}`, `--output=${output}`).status, 0);
    assert.equal(readFileSync(output, "utf8"), before);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("invalid research and public or symlink-escaped paths produce no export", () => {
  const dir = mkdtempSync(join(root, ".career-export-test-"));
  const outside = mkdtempSync(join(tmpdir(), "career-export-outside-"));
  try {
    const input = join(dir, "input.json"),
      output = join(dir, "invalid.json");
    writeFileSync(
      input,
      JSON.stringify({
        ...snapshot,
        roles: [{ ...role, roleUrl: "javascript:alert(1)" }],
      }),
    );
    assert.notEqual(run(`--input=${input}`, `--output=${output}`).status, 0);
    assert.equal(existsSync(output), false);
    writeFileSync(input, JSON.stringify(snapshot));
    assert.notEqual(
      run(`--input=${input}`, `--output=${join(outside, "public.json")}`)
        .status,
      0,
    );
    assert.equal(existsSync(join(outside, "public.json")), false);
    symlinkSync(outside, join(dir, "escape"));
    assert.notEqual(
      run(`--input=${input}`, `--output=${join(dir, "escape", "public.json")}`)
        .status,
      0,
    );
    assert.equal(existsSync(join(outside, "public.json")), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
