/** Explicit private authoring only. Never imported by the application bundle. */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  parseResearchSnapshot,
  type CareerResearchSnapshotV1,
} from "../src/lib/career-workflow.ts";
import { isCalendarDate } from "../src/lib/personal-timetable.ts";
import {
  assertFreshPrivateOutputPath,
  assertPrivateWorkspacePath,
} from "./private-workspace.ts";

/** Liveness updates availability only; curated eligibility and selection remain authoritative. */
export function exportCareerResearch(
  inputPath: string,
  outputPath: string,
  livenessPath?: string,
): CareerResearchSnapshotV1 {
  const input = assertPrivateWorkspacePath(inputPath);
  const output = assertFreshPrivateOutputPath(outputPath);
  const snapshot = structuredClone(
    parseResearchSnapshot(JSON.parse(readFileSync(input, "utf8"))),
  );
  if (livenessPath) {
    const source = JSON.parse(
      readFileSync(assertPrivateWorkspacePath(livenessPath), "utf8"),
    );
    if (
      !source ||
      typeof source !== "object" ||
      typeof source.asOfClientDate !== "string" ||
      !isCalendarDate(source.asOfClientDate) ||
      !Array.isArray(source.results)
    )
      throw new Error(
        "Liveness input needs a valid asOfClientDate and results array.",
      );
    for (const role of snapshot.roles) {
      const matches = source.results.filter(
        (item: unknown) =>
          item &&
          typeof item === "object" &&
          (item as { url?: unknown }).url === role.roleUrl,
      );
      if (!matches.length || source.asOfClientDate < role.checkedOn) continue;
      if (
        matches.some(
          (item: { status?: unknown }) =>
            !["active", "expired", "uncertain"].includes(String(item.status)),
        ) ||
        new Set(matches.map((item: { status: string }) => item.status)).size !==
          1
      )
        throw new Error(
          "Conflicting or invalid liveness results for a selected role. Nothing exported.",
        );
      role.availability = matches[0].status;
      role.checkedOn = source.asOfClientDate;
      role.updatedAt = Math.max(
        role.updatedAt,
        Date.parse(`${source.asOfClientDate}T00:00:00Z`),
      );
    }
  }
  parseResearchSnapshot(snapshot);
  writeFileSync(output, `${JSON.stringify(snapshot, null, 2)}\n`, {
    flag: "wx",
    mode: 0o600,
  });
  return snapshot;
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  try {
    const option = (name: string) =>
      process.argv
        .find((arg) => arg.startsWith(`--${name}=`))
        ?.slice(name.length + 3);
    const input = option("input"),
      output = option("output");
    if (!input || !output)
      throw new Error(
        "Pass --input=PRIVATE_CURATED_SNAPSHOT --output=FRESH_PRIVATE_PATH and optional --liveness=PRIVATE_CAREEROPS_RESULTS.",
      );
    const result = exportCareerResearch(input, output, option("liveness"));
    console.log(
      `Exported ${result.roles.length} reviewed opportunities. No applications, messages or account writes.`,
    );
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Could not export career research.",
    );
    process.exitCode = 1;
  }
}
