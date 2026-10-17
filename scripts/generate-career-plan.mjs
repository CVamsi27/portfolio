// Owner-only generator: the private roadmap document becomes the career-plan payload.
// Inputs and output must stay under the canonical private personal workspace.
import { createHash } from "node:crypto";
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const PRIVATE_ROOTS = [
  `${sep}80-lanes-abroad-full-stack${sep}personal${sep}`,
  `${sep}repos${sep}personal${sep}`,
];

function privatePath(path, output = false) {
  const resolved = resolve(path);
  const actual = realpathSync(output ? dirname(resolved) : resolved);
  if (!PRIVATE_ROOTS.some((root) => actual.includes(root)))
    throw new Error(
      "All authoring inputs and outputs must remain in the canonical private personal workspace",
    );
  return resolved;
}

function stripPrivateLinks(markdown) {
  return markdown.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (link, label, href) =>
    /^https?:\/\//i.test(href) ? link : label,
  );
}

function slug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function generateCareerPlan(markdown) {
  const title = /^# (.+)$/m.exec(markdown)?.[1]?.trim();
  if (!title) throw new Error("Roadmap document needs a title");
  const meta =
    /\*\*Updated:\*\* (.+?)\.\s*\*\*Search window:\*\* (.+)/.exec(markdown);
  if (!meta)
    throw new Error("Roadmap document needs the Updated and Search window line");
  const introMatch = /> \*\*What this is:\*\* ([^\n]+)/.exec(markdown);
  const sections = [];
  for (const chunk of markdown.split(/^## /m).slice(1)) {
    const [headingLine, ...rest] = chunk.split("\n");
    const heading = headingLine.trim();
    if (/^6\./.test(heading) || /map of everything/i.test(heading)) continue;
    const body = stripPrivateLinks(rest.join("\n").trim());
    if (!body) throw new Error(`Section "${heading}" is empty`);
    sections.push({ id: slug(heading), title: heading, markdown: body });
  }
  if (sections.length < 4)
    throw new Error(
      `Expected at least four plan sections, found ${sections.length}`,
    );
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    updated: meta[1].trim(),
    window: meta[2].trim(),
    title,
    ...(introMatch
      ? { intro: `> **What this is:** ${introMatch[1].trim()}` }
      : {}),
    sourceDigest: createHash("sha256").update(markdown).digest("hex"),
    sections,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [source, output] = process.argv.slice(2);
  if (!source || !output)
    throw new Error(
      "Usage: node scripts/generate-career-plan.mjs PRIVATE_ROADMAP.md PRIVATE_OUTPUT.json",
    );
  const sourcePath = privatePath(source);
  const outputPath = privatePath(output, true);
  if (sourcePath === outputPath)
    throw new Error("Output must not overwrite the authoring source");
  const plan = generateCareerPlan(readFileSync(sourcePath, "utf8"));
  writeFileSync(outputPath, JSON.stringify(plan, null, 2) + "\n", {
    mode: 0o600,
  });
  console.log(
    `Generated ${plan.sections.length} plan sections (${plan.sourceDigest.slice(0, 12)}); private output only.`,
  );
}
