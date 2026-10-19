#!/usr/bin/env node
const BASE = process.env.RELEASE_BASE_URL ?? "https://www.buildora.work";
const PERSONAL =
  process.env.RELEASE_PERSONAL_URL ?? "https://personal.buildora.work";
const APEX = process.env.RELEASE_APEX_URL ?? "https://buildora.work";
const ORIGIN = "https://www.buildora.work";
const SLUGS = [
  "docita",
  "senior-full-stack-bible",
  "teamops",
  "super-tic-tac-toe",
  "digital-library",
  "task-manager",
  "portfolio",
];
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`ok   ${name}`);
    return;
  }
  failures.push(name);
  console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
}

async function get(url) {
  return fetch(url, { redirect: "manual" });
}

async function main() {
  const root = await get(`${BASE}/`);
  check("root status 200", root.status === 200, String(root.status));
  const rootHtml = await root.text();
  check(
    "root renders the portfolio",
    /Case study|Selected Work/.test(rootHtml),
    "portfolio markers missing",
  );

  for (const slug of SLUGS) {
    const response = await get(`${BASE}/work/${slug}`);
    check(`case study ${slug}`, response.status === 200, String(response.status));
  }

  const sitemap = await get(`${BASE}/sitemap.xml`);
  const sitemapBody = await sitemap.text();
  check("sitemap status 200", sitemap.status === 200, String(sitemap.status));
  const locs = [...sitemapBody.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );
  check("sitemap has 8 URLs", locs.length === 8, String(locs.length));
  check(
    "sitemap uses the www origin",
    locs.every((url) => url.startsWith(`${ORIGIN}/`)),
    locs.find((url) => !url.startsWith(`${ORIGIN}/`)) ?? "",
  );

  const robots = await get(`${BASE}/robots.txt`);
  const robotsBody = await robots.text();
  check("robots status 200", robots.status === 200, String(robots.status));
  check(
    "robots declares the sitemap",
    robotsBody.includes(`Sitemap: ${ORIGIN}/sitemap.xml`),
    "Sitemap directive missing",
  );

  const manifest = await get(`${BASE}/manifest.webmanifest`);
  check("manifest status 200", manifest.status === 200, String(manifest.status));

  for (const [name, expected] of [
    ["x-content-type-options", "nosniff"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
    ["x-frame-options", "DENY"],
  ]) {
    const value = root.headers.get(name);
    check(`header ${name}`, value === expected, value ?? "missing");
  }
  const permissions = root.headers.get("permissions-policy") ?? "";
  check(
    "header permissions-policy disables camera",
    permissions.includes("camera=()"),
    permissions || "missing",
  );

  const apex = await get(`${APEX}/`);
  check(
    "apex redirects to www",
    apex.status === 307 && apex.headers.get("location") === `${ORIGIN}/`,
    `${apex.status} ${apex.headers.get("location")}`,
  );

  const hub = await get(`${PERSONAL}/hub`);
  const hubLocation = hub.headers.get("location") ?? "";
  check(
    "personal hub redirects to login",
    hub.status === 307 && hubLocation.startsWith(`${PERSONAL}/login`),
    `${hub.status} ${hubLocation}`,
  );
  const login = await get(`${PERSONAL}/login`);
  check("personal login status 200", login.status === 200, String(login.status));

  if (failures.length) {
    console.error(`\n${failures.length} release smoke check(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll release smoke checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
